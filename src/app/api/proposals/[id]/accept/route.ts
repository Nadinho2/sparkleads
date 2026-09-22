import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { signerName, signerEmail, notes } = body;

    if (!params.id) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    const { getProposalById, updateProposal } = await import('@/lib/proposals-store');
    const proposal = await getProposalById(params.id);

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedProposalData = {
      ...(proposal.proposal_data || {}),
      accepted_at: now,
      accepted_by: signerName || proposal.business_name,
      signer_email: signerEmail || '',
      acceptance_notes: notes || '',
    };

    const updated = await updateProposal(params.id, {
      status: 'accepted',
      proposal_data: updatedProposalData,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to accept proposal' }, { status: 500 });
    }

    // Notify the agency user
    if (proposal.user_token) {
      await createNotification(proposal.user_token, {
        title: '🎉 Proposal Accepted!',
        message: `${signerName || 'Client'} has digitally signed and accepted the proposal for ${proposal.business_name}.`,
        type: 'system',
        link: '/agency/proposals',
      }).catch((e) => console.error('Failed to dispatch notification:', e));
    }

    return NextResponse.json({
      success: true,
      acceptedAt: now,
      acceptedBy: signerName || proposal.business_name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
