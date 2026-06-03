import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  Search,
  Download,
  CreditCard,
  Users,
  BarChart3,
  ChevronRight,
  ArrowRight,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Get help with SparkLeads. Find answers to common questions about searching, exporting leads, payments, and more.',
};

const gettingStarted = [
  {
    icon: Search,
    title: 'Run your first search',
    steps: [
      'Go to the Dashboard after activating your account',
      'Type a business type and city (e.g. "restaurants in Lagos Nigeria")',
      'Hit Search or press Enter',
      'Watch results stream in live with names, phones, emails, and ratings',
    ],
  },
  {
    icon: Download,
    title: 'Export leads to CSV',
    steps: [
      'After a search completes, click the "Export CSV" button in the results header',
      'Your file will download instantly with all lead data',
      'Open in Excel, Google Sheets, or import into any CRM',
      'Columns: Name, Phone, Email, Website, Address, Rating, Status',
    ],
  },
  {
    icon: BarChart3,
    title: 'Track lead status',
    steps: [
      'Each lead has a status dropdown: New, Contacted, Interested, Closed, Not Interested',
      'Change the status as you work through your leads',
      'Your statuses are saved automatically',
      'Use this to track your entire sales pipeline',
    ],
  },
  {
    icon: CreditCard,
    title: 'Activate your account',
    steps: [
      'Purchase SparkLeads from the checkout page (₦19,900 one-time)',
      'Check your email for the activation link',
      'Click the link to activate your account',
      'You\'ll be redirected to the dashboard — ready to search',
    ],
  },
  {
    icon: Users,
    title: 'Join the affiliate program',
    steps: [
      'After activation, go to the Affiliate page in your dashboard',
      'Copy your unique referral link',
      'Share it on social media, WhatsApp, or with friends',
      'Earn ₦9,950 (50%) for every sale made through your link',
    ],
  },
];

const faqSections = [
  {
    category: 'Search & Results',
    items: [
      {
        q: 'How many results do I get per search?',
        a: 'You typically get 200+ business leads per search, depending on the business type and location. Some niches in larger cities return more results.',
      },
      {
        q: 'Can I search in any country?',
        a: 'Yes! SparkLeads works in 195+ countries worldwide. Just type the business type and city — it works globally.',
      },
      {
        q: 'Why are some emails missing?',
        a: 'We automatically discover emails from business websites. Some businesses don\'t have publicly listed emails. We\'re constantly improving our email discovery engine.',
      },
      {
        q: 'How fresh is the data?',
        a: 'We pull data from Google Maps via SerpAPI in real-time when you search. The results reflect the latest available information on Google.',
      },
    ],
  },
  {
    category: 'Payments & Billing',
    items: [
      {
        q: 'Is this a subscription?',
        a: 'No. SparkLeads is a one-time payment of ₦19,900 for lifetime access. No monthly fees, no hidden charges.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major debit and credit cards through Paystack, including Visa, Mastercard, and Verve.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes! We offer a 7-day money-back guarantee. If you\'re not satisfied, contact us and we\'ll refund you — no questions asked.',
      },
      {
        q: 'I paid but didn\'t get my activation email',
        a: 'Check your spam/junk folder first. If you still don\'t see it, contact us with your payment email and we\'ll send a new activation link.',
      },
    ],
  },
  {
    category: 'Account & Technical',
    items: [
      {
        q: 'Can I use SparkLeads on multiple devices?',
        a: 'Yes! Your account is tied to your activation. Once activated, you can use it on any device with the same browser session.',
      },
      {
        q: 'My search is not returning results',
        a: 'Try being more specific with your query. Use the format "business type in city". For example, "dentists in Abuja Nigeria" works better than just "dentists".',
      },
      {
        q: 'How do I export my leads?',
        a: 'After a search, click the "Export CSV" button above the results table. The file downloads instantly with all your lead data.',
      },
      {
        q: 'How do affiliate payouts work?',
        a: 'Once you reach ₦13,300 in earnings, you can request a payout from the Affiliate page. We process payouts within 24-48 hours to your bank account.',
      },
    ],
  },
];

export default function HelpPage() {
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
            How can we help you?
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Everything you need to know about using SparkLeads to find and manage business leads.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text mb-8">Getting Started</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gettingStarted.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-text mb-3">{item.title}</h3>
                <ol className="space-y-2">
                  {item.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface2 flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text mb-8">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqSections.map((section) => (
              <div key={section.category}>
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <details
                      key={item.q}
                      className="group border border-border rounded-xl bg-surface overflow-hidden"
                    >
                      <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-medium text-text hover:bg-surface2/50 transition-colors list-none">
                        {item.q}
                        <ChevronRight className="w-4 h-4 text-muted transition-transform group-open:rotate-90 flex-shrink-0 ml-2" />
                      </summary>
                      <div className="px-5 pb-5 text-sm text-muted leading-relaxed">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center p-8 sm:p-12 rounded-2xl border border-border bg-surface">
          <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-3">Still need help?</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll get back to you within a few hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-muted font-medium hover:text-text hover:bg-surface2 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
