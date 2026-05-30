import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { email?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, token } = body;

  if (!email || !token) {
    return NextResponse.json(
      { error: 'email and token are required' },
      { status: 400 }
    );
  }

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`;

  console.log('============================================');
  console.log('ACTIVATION EMAIL');
  console.log('============================================');
  console.log(`To: ${email}`);
  console.log(`Subject: Activate your SparkLeads account`);
  console.log(`Activation Link: ${activationUrl}`);
  console.log('============================================');

  // TODO: Wire up email provider (Resend / Nodemailer / SendGrid)
  // Example with Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'SparkLeads <noreply@yourdomain.com>',
  //   to: email,
  //   subject: 'Activate your SparkLeads account',
  //   html: `<p>Click here to activate: <a href="${activationUrl}">${activationUrl}</a></p>`,
  // });

  return NextResponse.json({
    success: true,
    activation_url: activationUrl,
  });
}
