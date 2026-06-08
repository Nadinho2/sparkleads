import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — SparkLeads',
  description: 'Guidelines for acceptable use of the SparkLeads platform.',
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm hover:underline mb-8 inline-block">&larr; Back to SparkLeads</Link>
        <h1 className="text-3xl font-bold text-text mb-2">Acceptable Use Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: June 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text/80 text-sm leading-relaxed">

          <p>
            This Acceptable Use Policy (&quot;AUP&quot;) governs your use of SparkLeads. Violations may result in account suspension or termination without refund.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">1. Permitted Use</h2>
          <p>SparkLeads is designed for legitimate business professionals to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Discover and research local businesses for potential client outreach.</li>
            <li>Generate professional proposals and marketing materials.</li>
            <li>Analyze website performance and online presence.</li>
            <li>Create AI-assisted content for marketing campaigns.</li>
            <li>Manage team workflows through agency workspaces.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">2. Prohibited Activities</h2>

          <h3 className="text-lg font-medium text-text mt-4">Spam and Unsolicited Communications</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sending bulk unsolicited messages to businesses without legitimate business interest.</li>
            <li>Using the outreach tools for pyramid schemes, phishing, or scam operations.</li>
            <li>Sending messages that violate the Nigerian Cybercrimes (Prohibition, Prevention, etc.) Act 2015.</li>
            <li>Ignoring opt-out requests from message recipients.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">Fraud and Misrepresentation</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Impersonating another business, agency, or individual.</li>
            <li>Creating proposals or marketing materials with false claims or credentials.</li>
            <li>Using AI-generated content to deceive or mislead potential clients.</li>
            <li>Providing false information during account registration.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">Data Abuse</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Scraping, harvesting, or mass-exporting lead data for resale.</li>
            <li>Using automated tools (bots, scripts) to access the Service beyond normal usage.</li>
            <li>Attempting to access other users&apos; data or workspace information.</li>
            <li>Reverse-engineering the Service to replicate its functionality.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">Platform Abuse</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Creating multiple accounts to circumvent credit limits or bans.</li>
            <li>Exploiting bugs or vulnerabilities for unauthorized benefits.</li>
            <li>Overloading the Service with excessive API calls or requests.</li>
            <li>Sharing account credentials with unauthorized users.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">3. Content Standards</h2>
          <p>All content generated or uploaded through SparkLeads must NOT:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contain hateful, discriminatory, or harassing material.</li>
            <li>Promote violence, illegal activities, or harmful products.</li>
            <li>Infringe on copyrights, trademarks, or other intellectual property rights.</li>
            <li>Contain malware, viruses, or malicious code.</li>
            <li>Violate any applicable Nigerian law or regulation.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">4. Outreach Compliance</h2>
          <p>When using our outreach tools (WhatsApp, Email), you must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only contact businesses with a legitimate business interest.</li>
            <li>Clearly identify yourself and your business in all communications.</li>
            <li>Provide a way for recipients to opt out of future messages.</li>
            <li>Honor opt-out requests within 48 hours.</li>
            <li>Comply with the Nigerian Communications Commission regulations on electronic communications.</li>
            <li>Comply with WhatsApp Business Policy when using WhatsApp outreach.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">5. Enforcement</h2>
          <p>We may take the following actions for AUP violations:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Warning:</strong> First-time minor violations may receive a warning email.</li>
            <li><strong>Temporary Suspension:</strong> Repeated violations may result in temporary account suspension.</li>
            <li><strong>Permanent Termination:</strong> Serious violations (fraud, spam, data abuse) result in permanent account termination without refund.</li>
            <li><strong>Legal Action:</strong> We may report illegal activities to law enforcement authorities.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">6. Reporting Violations</h2>
          <p>
            If you become aware of any AUP violation, please report it to <a href="mailto:abuse@sparkleads.io" className="text-primary hover:underline">abuse@sparkleads.io</a>.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">7. Changes</h2>
          <p>
            We may update this AUP at any time. Continued use of the Service after changes constitutes acceptance.
          </p>
        </div>
      </div>
    </div>
  );
}
