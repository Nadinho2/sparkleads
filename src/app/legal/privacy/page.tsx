import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — SparkLeads',
  description: 'How SparkLeads collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm hover:underline mb-8 inline-block">&larr; Back to SparkLeads</Link>
        <h1 className="text-3xl font-bold text-text mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: June 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text/80 text-sm leading-relaxed">

          <h2 className="text-xl font-semibold text-text mt-8">1. Introduction</h2>
          <p>
            SparkLeads (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a lead generation and business intelligence platform operated from Nigeria. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and related services (collectively, the &quot;Service&quot;).
          </p>
          <p>
            By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not access the Service.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">2. Information We Collect</h2>

          <h3 className="text-lg font-medium text-text mt-4">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Email address, password (hashed), display name, and business name when you register.</li>
            <li><strong>Payment Information:</strong> Payment details are processed by Paystack (our payment processor). We do not store your full card number or CVV. We receive transaction references and confirmation status.</li>
            <li><strong>Profile Data:</strong> Business type, location, service descriptions, and content preferences you provide when using our tools.</li>
            <li><strong>Content You Generate:</strong> Proposals, messages, ad plans, audit reports, creative briefs, and content calendars created through the Service.</li>
            <li><strong>Communications:</strong> Messages you send through the platform, including WhatsApp and email outreach composed using our tools.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Pages visited, features used, search queries, click patterns, and session duration.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
            <li><strong>Log Data:</strong> IP address, access timestamps, referring URLs, and error logs.</li>
            <li><strong>Cookies:</strong> Session cookies for authentication and preference cookies for your settings. See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">2.3 Information from Third Parties</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>SerpAPI / Google Maps:</strong> Business listing data (name, address, phone, website, ratings, reviews) retrieved from public Google Maps search results when you perform lead searches.</li>
            <li><strong>Paystack:</strong> Transaction confirmation and subscription status.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve the Service.</li>
            <li>To process transactions and manage your credit balance.</li>
            <li>To generate AI-powered content, proposals, messages, and reports on your behalf.</li>
            <li>To send transactional emails (account verification, password resets, credit notifications).</li>
            <li>To monitor usage patterns and improve user experience.</li>
            <li>To detect, prevent, and address fraud, abuse, and technical issues.</li>
            <li>To comply with legal obligations under Nigerian law.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">4. AI-Generated Content</h2>
          <p>
            SparkLeads uses third-party AI services (including OpenAI and Anthropic) to generate proposals, messages, ad plans, and other content. When you use these features:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your input data (business names, service descriptions, lead details) is sent to AI providers solely to generate your requested output.</li>
            <li>We do not use your input data to train AI models.</li>
            <li>Generated content is stored in your account and accessible only to you (and your workspace members, if applicable).</li>
            <li>You are responsible for reviewing and verifying all AI-generated content before use.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">5. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Supabase (database), Vercel (hosting), Paystack (payments), SerpAPI (business data), OpenAI/Anthropic (AI generation), Resend (emails). These providers process data on our behalf under contractual obligations.</li>
            <li><strong>Legal Requirements:</strong> When required by Nigerian law, court order, or government regulation.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to affected users.</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing (e.g., sending proposals to leads via WhatsApp or email).</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">6. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account data is retained while your account is active.</li>
            <li>Generated content (proposals, messages, audits) is retained for 12 months after creation or until you delete it.</li>
            <li>Search history is retained for 6 months.</li>
            <li>Payment records are retained for 5 years as required by Nigerian tax law.</li>
            <li>Upon account deletion, personal data is removed within 30 days, except where retention is legally required.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">7. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted data transmission (TLS/SSL), hashed passwords, row-level security on our database, and regular security audits. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">8. Your Rights</h2>
          <p>Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data.</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
            <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
            <li><strong>Withdrawal of Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p>
            To exercise these rights, contact us at <a href="mailto:privacy@sparkleads.io" className="text-primary hover:underline">privacy@sparkleads.io</a>.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">9. International Data Transfers</h2>
          <p>
            Your data may be processed in countries outside Nigeria (including the United States and European Union) where our service providers operate. We ensure adequate data protection through contractual agreements and compliance with applicable data transfer regulations.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">10. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or prominent notice on the Service. Your continued use after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">12. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your data rights:<br />
            Email: <a href="mailto:privacy@sparkleads.io" className="text-primary hover:underline">privacy@sparkleads.io</a><br />
            Website: <a href="https://sparkleads.io" className="text-primary hover:underline">sparkleads.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
