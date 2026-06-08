import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy — SparkLeads',
  description: 'SparkLeads refund and cancellation policy.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm hover:underline mb-8 inline-block">&larr; Back to SparkLeads</Link>
        <h1 className="text-3xl font-bold text-text mb-2">Refund Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: June 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-text/80 text-sm leading-relaxed">

          <h2 className="text-xl font-semibold text-text mt-8">1. Credit Pack Purchases</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Unused credits:</strong> Refund requests for unused credit packs must be made within 7 days of purchase. A full refund will be issued minus payment processing fees.</li>
            <li><strong>Partially used credits:</strong> If you have used some credits from a pack, a prorated refund may be issued for unused credits within 7 days of purchase.</li>
            <li><strong>Fully used credits:</strong> No refund is available once credits have been fully consumed.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">2. Agency Subscriptions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Monthly plans:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial-month refunds.</li>
            <li><strong>Annual plans:</strong> Refund requests within 14 days of purchase are eligible for a full refund minus processing fees. After 14 days, no refund is available.</li>
            <li><strong>Downgrades:</strong> Plan downgrades take effect at the next billing cycle. No prorated refund for the difference.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">3. Non-Refundable Items</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Credits that have already been used to generate content or access services.</li>
            <li>Account suspensions or terminations due to Terms of Service violations.</li>
            <li>Third-party service fees (Paystack processing fees) are non-refundable.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-8">4. Technical Issues</h2>
          <p>
            If a service action fails due to a technical error on our end (e.g., AI generation timeout, server error), the credits used for that action will be automatically restored to your account. If credits are not automatically restored within 24 hours, contact support.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">5. How to Request a Refund</h2>
          <p>To request a refund:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Email <a href="mailto:support@sparkleads.io" className="text-primary hover:underline">support@sparkleads.io</a> with your account email and transaction reference.</li>
            <li>Include the reason for your refund request.</li>
            <li>Refund requests are processed within 5 business days.</li>
            <li>Approved refunds are credited back through the original payment method via Paystack within 7-14 business days.</li>
          </ol>

          <h2 className="text-xl font-semibold text-text mt-8">6. Disputes</h2>
          <p>
            If you believe a charge was made in error, please contact us first at <a href="mailto:support@sparkleads.io" className="text-primary hover:underline">support@sparkleads.io</a>. We will work with you to resolve the issue. Chargebacks filed without prior contact may result in account suspension.
          </p>

          <h2 className="text-xl font-semibold text-text mt-8">7. Contact</h2>
          <p>
            For refund requests or questions:<br />
            Email: <a href="mailto:support@sparkleads.io" className="text-primary hover:underline">support@sparkleads.io</a><br />
            Website: <a href="https://sparkleads.io" className="text-primary hover:underline">sparkleads.io</a>
          </p>
        </div>
      </div>
    </div>
  );
}
