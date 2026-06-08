import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — SparkLeads',
  description: 'The terms governing your use of the SparkLeads platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm hover:underline mb-8 inline-block">&larr; Back to SparkLeads</Link>
        <h1 className="text-3xl font-bold text-text mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-8">Last updated: June 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text/80 text-sm leading-relaxed">

          <h2 className="text-xl font-semibold text-text mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SparkLeads (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">2. Description of Service</h2>
          <p>
            SparkLeads is a lead generation and digital marketing platform that provides:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Local business search and lead discovery via public data sources.</li>
            <li>Website performance grading and audit reports.</li>
            <li>Google Business Profile analysis.</li>
            <li>Competitor analysis tools.</li>
            <li>AI-generated proposals, marketing messages, ad plans, and content calendars.</li>
            <li>Outreach tools (WhatsApp and email).</li>
            <li>Creative brief generation.</li>
            <li>Team collaboration features for agency workspaces.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">3. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide a valid email address and create a secure password.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must be at least 18 years old to create an account.</li>
            <li>One person may not maintain multiple free accounts.</li>
            <li>You agree to notify us immediately of any unauthorized use of your account.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">4. Credits and Payment</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>The Service operates on a credit-based system. Each service action consumes a specific number of credits.</li>
            <li>Free accounts receive a limited number of trial credits upon registration.</li>
            <li>Additional credits can be purchased through our payment processor (Paystack).</li>
            <li>Agency subscriptions provide monthly credit pools shared among workspace members.</li>
            <li>Credits are non-transferable between individual and agency accounts.</li>
            <li>Unused credits do not roll over unless specified in your subscription plan.</li>
            <li>All prices are in Nigerian Naira (NGN) unless otherwise stated.</li>
            <li>Payments are processed securely by Paystack. We do not store your card details.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">5. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any illegal purpose or in violation of any Nigerian law or regulation.</li>
            <li>Send unsolicited spam, bulk messages, or communications that violate the Nigerian Cybercrimes Act 2015.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the Service beyond normal usage.</li>
            <li>Impersonate another person or business in proposals, messages, or outreach.</li>
            <li>Use AI-generated content to create misleading, deceptive, or fraudulent materials.</li>
            <li>Attempt to reverse-engineer, decompile, or access the source code of the Service.</li>
            <li>Resell, sublicense, or redistribute the Service without written permission.</li>
            <li>Interfere with or disrupt the Service&apos;s infrastructure or servers.</li>
            <li>Use the Service to harass, threaten, or defame any individual or business.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">6. AI-Generated Content Disclaimer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All AI-generated content (proposals, messages, ad plans, content, briefs) is provided &quot;as is&quot; for informational purposes.</li>
            <li>You are solely responsible for reviewing, editing, and verifying all generated content before use.</li>
            <li>SparkLeads does not guarantee the accuracy, completeness, or suitability of AI-generated content.</li>
            <li>You retain ownership of content you generate through the Service.</li>
            <li>You grant SparkLeads a limited license to process your input data to generate requested outputs.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">7. Lead Data and Third-Party Sources</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Business listing data is sourced from publicly available information via Google Maps and SerpAPI.</li>
            <li>We do not guarantee the accuracy, completeness, or currency of lead data.</li>
            <li>You are responsible for verifying lead information before acting on it.</li>
            <li>You must comply with applicable laws when contacting leads, including the Nigeria Data Protection Act 2023 and the Nigerian Communications Commission regulations on unsolicited communications.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">8. Agency Workspaces</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Agency owners are responsible for all activity within their workspace.</li>
            <li>Workspace members are bound by these Terms through the owner&apos;s acceptance.</li>
            <li>Credit allocation to members is managed by the workspace owner.</li>
            <li>The agency owner is liable for all content generated and outreach conducted by workspace members.</li>
            <li>SparkLeads may suspend or terminate workspaces that violate these Terms.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">9. Intellectual Property</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>The SparkLeads platform, including its design, code, logos, and documentation, is our intellectual property.</li>
            <li>You retain all rights to content you create using the Service.</li>
            <li>You grant us a limited, non-exclusive license to store and display your generated content within the Service.</li>
            <li>Our trademarks and branding may not be used without written permission.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">10. Service Availability</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We strive for 99.5% uptime but do not guarantee uninterrupted access.</li>
            <li>We may perform scheduled maintenance with reasonable advance notice.</li>
            <li>We are not liable for downtime caused by factors beyond our control (internet outages, third-party service failures, force majeure).</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Nigerian law:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>SparkLeads shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
            <li>Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.</li>
            <li>We are not liable for business losses, lost profits, lost data, or damages resulting from use of AI-generated content.</li>
            <li>We are not responsible for the actions you take based on lead data or generated content.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold SparkLeads harmless from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of a third party.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">13. Termination</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You may terminate your account at any time by contacting support.</li>
            <li>We may suspend or terminate your account for violation of these Terms, with or without notice.</li>
            <li>Upon termination, your right to use the Service ceases immediately.</li>
            <li>We will retain your data for 30 days after termination, after which it will be permanently deleted.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">14. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through good-faith negotiation first. If unresolved, disputes shall be submitted to the jurisdiction of Nigerian courts.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">15. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect. Continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">16. Contact</h2>
          <p>
            For questions about these Terms:<br />
            Email: <a href="mailto:legal@sparkleads.io" className="text-primary hover:underline">legal@sparkleads.io</a><br />
            Website: <a href="https://sparkleads.io" className="text-primary hover:underline">sparkleads.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
