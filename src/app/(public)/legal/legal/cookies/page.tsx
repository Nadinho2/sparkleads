import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy — SparkLeads',
  description: 'How SparkLeads uses cookies and similar tracking technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm hover:underline mb-8 inline-block">&larr; Back to SparkLeads</Link>
        <h1 className="text-3xl font-bold text-text mb-2">Cookie Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: June 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text/80 text-sm leading-relaxed">

          <h2 className="text-xl font-semibold text-text mt-8">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and understanding how you use our Service.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">2. Cookies We Use</h2>

          <h3 className="text-lg font-medium text-text mt-4">Essential Cookies</h3>
          <p>These are required for the Service to function and cannot be disabled.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>sparkleads_token:</strong> Your authentication session token. Keeps you logged in.</li>
            <li><strong>sparkleads_workspace:</strong> Identifies your active agency workspace (if applicable).</li>
            <li><strong>sparkleads_session_id:</strong> Your unique session identifier for tracking search history and credits.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">Functional Cookies</h3>
          <p>These enhance functionality but are not strictly necessary.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Theme preferences:</strong> Remembers your dark/light mode setting.</li>
            <li><strong>UI state:</strong> Remembers sidebar collapse state and filter preferences.</li>
          </ul>

          <h3 className="text-lg font-medium text-text mt-4">Analytics Cookies</h3>
          <p>These help us understand how the Service is used.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage tracking:</strong> We collect anonymized usage data to improve the Service (page views, feature usage, error rates).</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">3. Local Storage</h2>
          <p>In addition to cookies, we use browser localStorage for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>sparkleads_grade_url:</strong> Temporarily stores URL data for the Website Grader tool.</li>
            <li><strong>sparkleads_gbp_check:</strong> Temporarily stores business data for the GBP Audit tool.</li>
            <li><strong>sparkleads_report_data:</strong> Temporarily stores data for the Audit Report tool.</li>
            <li><strong>sparkleads_proposal_data:</strong> Temporarily stores data for the Proposals tool.</li>
            <li><strong>sparkleads_message_lead:</strong> Temporarily stores lead data for the AI Messages tool.</li>
            <li><strong>sparkleads_ad_plan:</strong> Temporarily stores data for the Ad Plans tool.</li>
          </ul>
          <p>These are cleared after use and do not track you across sessions.</p>

          <h2 className="text-xl font-semibold text-text mt-8">4. Third-Party Cookies</h2>
          <p>We do not use third-party advertising cookies. Payment processing by Paystack may set its own cookies on their checkout pages, which are governed by Paystack&apos;s privacy policy.</p>

          <h2 className="text-xl font-semibold text-text mt-8">5. Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Note that disabling essential cookies will prevent the Service from functioning. Most browsers allow you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View what cookies are set.</li>
            <li>Delete cookies individually or all at once.</li>
            <li>Block cookies from specific sites.</li>
            <li>Block all cookies.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">6. Changes</h2>
          <p>
            We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">7. Contact</h2>
          <p>
            Questions about our use of cookies:<br />
            Email: <a href="mailto:privacy@sparkleads.io" className="text-primary hover:underline">privacy@sparkleads.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
