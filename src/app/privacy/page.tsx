import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'SparkLeads privacy policy. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-text">
      <nav className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text">SparkLeads</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-text transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text mb-3">1. Introduction</h2>
            <p className="text-sm">
              Welcome to SparkLeads (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and handling your data with transparency. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="text-sm mt-2">
              By using SparkLeads, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-text mb-2 mt-4">Personal Information</h3>
            <p className="text-sm">
              When you purchase SparkLeads, we collect your email address through our payment processor (Paystack). We do not store your credit card information — all payment data is handled securely by Paystack.
            </p>
            <h3 className="text-base font-semibold text-text mb-2 mt-4">Usage Data</h3>
            <p className="text-sm">
              We collect information about how you use SparkLeads, including search queries, the number of searches performed, and feature usage. This helps us improve the service.
            </p>
            <h3 className="text-base font-semibold text-text mb-2 mt-4">Business Data</h3>
            <p className="text-sm">
              SparkLeads retrieves publicly available business information from Google Places API, including business names, phone numbers, addresses, websites, and ratings. This data is sourced from public business listings and is not personal user data.
            </p>
            <h3 className="text-base font-semibold text-text mb-2 mt-4">Cookies</h3>
            <p className="text-sm">
              We use essential cookies to maintain your session and authentication status. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">3. How We Use Your Information</h2>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>To provide and maintain the SparkLeads service</li>
              <li>To process your one-time payment and activate your account</li>
              <li>To send you activation links and important service updates</li>
              <li>To track affiliate referrals and calculate commissions</li>
              <li>To improve and optimize the service based on usage patterns</li>
              <li>To prevent abuse and enforce rate limits</li>
              <li>To respond to your support requests and inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">4. Data Sharing & Third Parties</h2>
            <p className="text-sm">
              We do not sell, trade, or rent your personal information to third parties. We may share information with:
            </p>
            <ul className="text-sm space-y-2 list-disc pl-5 mt-2">
              <li><strong className="text-text">Paystack:</strong> For payment processing. Paystack handles all card data securely.</li>
              <li><strong className="text-text">Supabase:</strong> For database hosting. Your account and lead data is stored securely in Supabase.</li>
              <li><strong className="text-text">Google Places API:</strong> For retrieving publicly available business data.</li>
              <li><strong className="text-text">Legal Requirements:</strong> If required by law or in response to valid legal requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">5. Data Security</h2>
            <p className="text-sm">
              We implement appropriate technical and organizational measures to protect your personal information. These include encryption in transit (HTTPS), secure database access via Row Level Security (RLS), and server-side-only processing of sensitive API keys. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">6. Data Retention</h2>
            <p className="text-sm">
              We retain your account data for as long as your account is active. If you request deletion of your data, we will remove your personal information within 30 days. Search and lead data associated with your account will also be deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">7. Your Rights</h2>
            <p className="text-sm">You have the right to:</p>
            <ul className="text-sm space-y-2 list-disc pl-5 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="text-sm mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:support@sparkleads.dev" className="text-primary hover:underline">
                support@sparkleads.dev
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">8. Affiliate Program</h2>
            <p className="text-sm">
              If you participate in our affiliate program, we store your referral code, referral count, and earnings. Payout information (bank name, account number, account name) is collected only when you request a payout and is used solely for processing your payment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-sm">
              SparkLeads is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">10. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-3">11. Contact Us</h2>
            <p className="text-sm">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="text-sm space-y-1 mt-2">
              <li>
                Email:{' '}
                <a href="mailto:support@sparkleads.dev" className="text-primary hover:underline">
                  support@sparkleads.dev
                </a>
              </li>
              <li>
                Contact Page:{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  /contact
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
          >
            ← Back to SparkLeads
          </Link>
        </div>
      </div>
    </main>
  );
}
