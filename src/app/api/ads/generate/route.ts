import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { generateAdPlan, type AdPlanInput } from '@/lib/ad-plan-generator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: AdPlanInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, businessType, goal, budget, budgetCurrency } = body;
  if (!businessName || !businessType || !goal || !budget) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const inferLocation = (): string => {
    if (body.location && body.location.trim()) return body.location.trim();

    const currencyMap: Record<string, string> = {
      NGN: 'Nigeria',
      GHS: 'Ghana',
      KES: 'Kenya',
      ZAR: 'South Africa',
      UGX: 'Uganda',
      TZS: 'Tanzania',
      USD: 'United States',
      GBP: 'United Kingdom',
      EUR: 'Europe',
      CAD: 'Canada',
      AUD: 'Australia',
      INR: 'India',
      AED: 'United Arab Emirates',
      SAR: 'Saudi Arabia',
      EGP: 'Egypt',
      MAD: 'Morocco',
    };

    return currencyMap[body.budgetCurrency] || 'Nigeria';
  };

  const inferBusinessContext = (): string => {
    const name = body.businessName.toLowerCase();
    const hints: string[] = [];

    if (name.includes('hair') || name.includes('belle') || name.includes('glam') || name.includes('beauty')) {
      hints.push('beauty and hair industry business');
    }
    if (name.includes('ng') || name.includes('naija')) {
      hints.push('Nigerian business');
    }

    return hints.join(', ') || '';
  };

  const resolvedLocation = inferLocation();
  const businessContext = inferBusinessContext();

  const supabase = createSupabaseAdmin();

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < 5) {
    return NextResponse.json(
      { error: 'insufficient_credits', balance: credits?.balance ?? 0 },
      { status: 403 }
    );
  }

  try {
    const plan = await generateAdPlan({ ...body, resolvedLocation, businessContext });

    const newBalance = Number(credits.balance) - 5;
    await supabase
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_token', userToken);

    await supabase.from('credit_transactions').insert({
      user_token: userToken,
      type: 'usage',
      amount: -5,
      description: `Ad plan for ${businessName}`,
      balance_after: newBalance,
    });

    const { data: savedPlan, error: saveError } = await supabase
      .from('ad_plans')
      .insert({
        user_token: userToken,
        business_name: businessName,
        business_type: businessType,
        location: body.location || null,
        budget,
        budget_currency: budgetCurrency || 'NGN',
        goal,
        website: body.website || null,
        extra_context: body.extraContext || null,
        plan,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to save ad plan:', saveError);
    }

    return NextResponse.json({
      success: true,
      plan,
      planId: savedPlan?.id || null,
    });
  } catch (error) {
    console.error('Ad plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ad plan. Please try again.' },
      { status: 500 }
    );
  }
}
