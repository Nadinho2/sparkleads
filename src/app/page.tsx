'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Zap,
  Search,
  Download,
  Globe,
  Phone,
  Mail,
  Star,
  BarChart3,
  FileSpreadsheet,
  MessageCircle,
  Users,
  Palette,
  Megaphone,
  Code,
  Pen,
  TrendingUp,
  Bot,
  ChevronDown,
  Menu,
  X,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';

function useInView() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = ref.current?.querySelectorAll('.fade-in-section');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Affiliate', href: '#affiliate' },
];

const stats = [
  { value: '200+', label: 'leads per search' },
  { value: '60s', label: 'to first result' },
  { value: '195+', label: 'countries' },
  { value: '$0', label: 'monthly fee' },
];

const steps = [
  {
    icon: Search,
    title: 'Type what you\'re looking for',
    description: 'Enter any business type and city — "Plumbers in Lagos", "Restaurants in London", "Dentists in Dubai"',
  },
  {
    icon: Zap,
    title: 'Watch businesses stream in live',
    description: 'Results appear in real-time with names, phones, emails, addresses, and Google ratings',
  },
  {
    icon: Download,
    title: 'Export and start outreach today',
    description: 'Download your leads as CSV and start calling, emailing, or WhatsApp messaging immediately',
  },
];

const features = [
  { icon: Zap, title: 'Live Real-Time Results', description: 'Watch leads stream in as they\'re found. No waiting, no batch processing.' },
  { icon: Phone, title: 'Direct Phone Numbers', description: 'Get real phone numbers you can call today. Start conversations that convert.' },
  { icon: Mail, title: 'Email Discovery', description: 'Automatically find business emails from websites. Build your email list instantly.' },
  { icon: Globe, title: '195+ Countries', description: 'Search any business in any city worldwide. Global lead generation at your fingertips.' },
  { icon: Star, title: 'Ratings & Reviews', description: 'See Google ratings to prioritize quality leads. Focus on the best businesses first.' },
  { icon: FileSpreadsheet, title: 'One-Click CSV Export', description: 'Download all leads as CSV instantly. Import into any CRM or spreadsheet tool.' },
  { icon: BarChart3, title: 'Lead Status Tracking', description: 'Mark leads as contacted, interested, or closed. Track your entire sales pipeline.' },
  { icon: MessageCircle, title: 'WhatsApp Ready', description: 'Phone numbers are formatted for WhatsApp. Start messaging leads immediately.' },
];

const personas = [
  { icon: Palette, title: 'Web Designers', description: 'Find local businesses that need websites' },
  { icon: Megaphone, title: 'SMMA Owners', description: 'Discover clients for social media management' },
  { icon: Code, title: 'SEO Agencies', description: 'Find businesses that need better search rankings' },
  { icon: Pen, title: 'Copywriters', description: 'Locate businesses that need content and copy' },
  { icon: TrendingUp, title: 'Sales Teams', description: 'Build targeted prospect lists in seconds' },
  { icon: MessageCircle, title: 'WhatsApp Marketers', description: 'Get phone numbers for WhatsApp outreach' },
  { icon: Users, title: 'Consultants', description: 'Find businesses that need your expertise' },
  { icon: Bot, title: 'Virtual Assistants', description: 'Build lead lists for your clients fast' },
];

const testimonials = [
  {
    stars: 5,
    quote: 'Found 340 plumbers in Lagos in under a minute. Closed 12 new clients in the first week. This tool paid for itself 100x over.',
    name: 'Tunde A.',
    location: 'Lagos, Nigeria',
    result: '12 new clients',
  },
  {
    stars: 5,
    quote: 'I run an SMMA and this saves me hours of manual research. I just type the niche and city, export, and start calling. Game changer.',
    name: 'Sarah K.',
    location: 'London, UK',
    result: '5 hours saved daily',
  },
  {
    stars: 5,
    quote: 'The email discovery feature is incredible. I found 200+ business emails for my outreach campaign in minutes, not days.',
    name: 'James M.',
    location: 'Nairobi, Kenya',
    result: '200+ emails found',
  },
  {
    stars: 5,
    quote: 'As a web designer in Dubai, finding leads was always a struggle. SparkLeads changed everything. I now have a steady pipeline of clients.',
    name: 'Ahmed R.',
    location: 'Dubai, UAE',
    result: '8 websites sold',
  },
];

const pricingFeatures = [
  'Unlimited searches forever',
  '200+ leads per search',
  'Real phone numbers & emails',
  'One-click CSV export',
  'Lead status tracking',
  'Email discovery engine',
  '195+ countries supported',
  'Priority support',
  'Lifetime updates included',
];

const faqItems = [
  {
    question: 'What exactly do I get?',
    answer: 'You get lifetime access to SparkLeads — unlimited searches, 200+ leads per search with real phone numbers, emails, addresses, and ratings. Plus CSV export, lead tracking, and email discovery.',
  },
  {
    question: 'Is this a subscription?',
    answer: 'No! It\'s a one-time payment of $15 for lifetime access. No monthly fees, no hidden charges, no upsells. Pay once, use forever.',
  },
  {
    question: 'Where does the data come from?',
    answer: 'We pull business data from publicly available sources including Google Maps, business directories, and company websites. All data is publicly accessible information.',
  },
  {
    question: 'Can I export the leads?',
    answer: 'Yes! One-click CSV export is included. Download your leads and import them into any CRM, spreadsheet, or outreach tool.',
  },
  {
    question: 'Does it work in my country?',
    answer: 'SparkLeads works in 195+ countries worldwide. Whether you\'re in Nigeria, UK, US, Kenya, Dubai, or anywhere else — it works.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! You can try SparkLeads for free with a limited number of searches. Once you see the results, you\'ll want full access.',
  },
  {
    question: 'What if I\'m not satisfied?',
    answer: 'We offer a 7-day money-back guarantee. If you\'re not happy with SparkLeads for any reason, we\'ll refund you — no questions asked.',
  },
  {
    question: 'How do I get support?',
    answer: 'You can reach us via WhatsApp or email. We typically respond within a few hours and are committed to helping you succeed.',
  },
];

const socialProofNotifications = [
  { name: 'Tunde', location: 'Lagos, Nigeria', action: 'just activated SparkLeads' },
  { name: 'Sarah', location: 'London, UK', action: 'just activated SparkLeads' },
  { name: 'James', location: 'Nairobi, Kenya', action: 'just activated SparkLeads' },
  { name: 'Ahmed', location: 'Dubai, UAE', action: 'just activated SparkLeads' },
  { name: 'Chioma', location: 'Abuja, Nigeria', action: 'just activated SparkLeads' },
  { name: 'David', location: 'Accra, Ghana', action: 'just activated SparkLeads' },
  { name: 'Fatima', location: 'Cape Town, SA', action: 'just activated SparkLeads' },
  { name: 'Emeka', location: 'Port Harcourt, Nigeria', action: 'just activated SparkLeads' },
  { name: 'Aisha', location: 'Manchester, UK', action: 'just activated SparkLeads' },
  { name: 'Kofi', location: 'Kumasi, Ghana', action: 'just activated SparkLeads' },
  { name: 'Wanjiku', location: 'Mombasa, Kenya', action: 'just activated SparkLeads' },
  { name: 'Oluwaseun', location: 'Ibadan, Nigeria', action: 'just activated SparkLeads' },
];

const sampleLeads = [
  { name: 'Lagos Plumbing Co.', phone: '+234 801 *** ****', email: '***@gmail.com', rating: 4.8 },
  { name: 'QuickFix Services', phone: '+234 802 *** ****', email: '***@yahoo.com', rating: 4.5 },
  { name: 'ProPipe Solutions', phone: '+234 803 *** ****', email: '***@outlook.com', rating: 4.9 },
  { name: 'AquaFlow Plumbing', phone: '+234 804 *** ****', email: '***@gmail.com', rating: 4.7 },
  { name: 'DrainMaster NG', phone: '+234 805 *** ****', email: '***@gmail.com', rating: 4.6 },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const containerRef = useInView();

  useEffect(() => {
    fetch('/api/auth/check')
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main ref={containerRef} className="min-h-screen bg-background text-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'SparkLeads',
            description:
              'Find 200+ business leads in 60 seconds. Get real phone numbers, emails, addresses instantly.',
            image: '/opengraph-image',
            brand: { '@type': 'Brand', name: 'SparkLeads' },
            offers: {
              '@type': 'Offer',
              price: '15.00',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '127',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
      {/* ==================== NAVBAR ==================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-text">SparkLeads</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted hover:text-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-muted hover:text-text transition-colors rounded-lg hover:bg-surface2"
                  >
                    Log in
                  </Link>
                  <a
                    href="#pricing"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Get Access $15
                  </a>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 text-muted hover:text-text"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-t border-border">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-muted hover:text-text py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block w-full text-center px-4 py-2 text-sm text-muted hover:text-text rounded-lg hover:bg-surface2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <a
                      href="#pricing"
                      className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Access $15
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background animate-gradient" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border bg-surface/50 text-xs sm:text-sm text-muted mb-6 sm:mb-8 animate-fade-in-up">
            <span>🌍</span>
            <span>Live across 195 countries</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-text mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Find 200+ Business Leads
            <br />
            <span className="text-primary">in 60 Seconds</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-muted max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Type any business type and city. Get real phone numbers, emails, addresses instantly. Start outreach today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-8 py-3.5 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <a
                  href="#pricing"
                  className="px-8 py-3.5 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
                >
                  Try it free
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="px-8 py-3.5 text-base font-medium text-muted hover:text-text border border-border rounded-xl hover:bg-surface2 transition-colors"
                >
                  See how it works
                </a>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LIVE PREVIEW DEMO ==================== */}
      <section className="py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="flex-1 text-center text-sm text-muted">
                SparkLeads — Search: &quot;Plumbers in Lagos&quot;
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted">Business Name</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted">Phone</th>
                      <th className="hidden sm:table-cell text-left py-3 px-4 text-sm font-medium text-muted">Email</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleLeads.map((lead, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-text">{lead.name}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted blur-[2px]">{lead.phone}</td>
                        <td className="hidden sm:table-cell py-3 px-4 text-sm text-muted blur-[2px]">{lead.email}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-warning">{lead.rating} ★</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-muted">
                Showing 5 of 342 results • <span className="text-primary blur-[2px]">Unlock all leads →</span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
              <div className="text-center">
                <p className="text-lg font-medium text-text mb-2">
                  {isAuthenticated ? 'Search live from your dashboard →' : 'Try the live version below →'}
                </p>
                <Link
                  href={isAuthenticated ? '/dashboard' : '#pricing'}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Full Access'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="py-16 sm:py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Three simple steps to fill your pipeline with qualified leads
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative p-6 sm:p-8 rounded-2xl border border-border bg-surface text-center hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 mt-2">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">{step.title}</h3>
                <p className="text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES GRID ==================== */}
      <section id="features" className="py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Everything You Need</h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Powerful features to find, manage, and close more leads
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHO IT'S FOR ==================== */}
      <section className="py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Who It&apos;s For</h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Built for anyone who needs a steady flow of business leads
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-surface text-center hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <persona.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{persona.title}</h3>
                <p className="text-sm text-muted">{persona.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">What Users Are Saying</h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Real results from real users across the globe
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-surface hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-text mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-text">{testimonial.name}</p>
                  <p className="text-xs text-muted">{testimonial.location}</p>
                  <p className="text-xs text-success mt-1">{testimonial.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isAuthenticated ? (
            <div className="max-w-lg mx-auto text-center">
              <div className="p-8 rounded-2xl border-2 border-primary bg-surface">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-3">Welcome back!</h2>
                <p className="text-muted mb-6">
                  You already have full access to SparkLeads. Start searching for leads now.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Simple, Transparent Pricing</h2>
                <p className="text-lg text-muted max-w-xl mx-auto">
                  No subscriptions. No hidden fees. Pay once, use forever.
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <div className="relative p-8 rounded-2xl border-2 border-primary bg-surface animate-pulse-glow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-full">
                    LIFETIME ACCESS
                  </div>

                  <div className="text-center mt-4 mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl text-muted line-through">$45</span>
                      <span className="text-5xl font-bold text-text">$15</span>
                    </div>
                    <p className="text-sm text-muted">One-time payment &bull; Lifetime access</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {pricingFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-sm text-text">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/checkout"
                    className="block w-full text-center px-6 py-4 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 mb-4"
                  >
                    Pay with Card — $15
                  </Link>

                  <p className="text-center text-sm text-muted">
                    <a href="#" className="text-primary hover:underline">
                      Pay via bank transfer (Nigeria)
                    </a>
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted">
                    <Shield className="w-4 h-4 text-success" />
                    <span>7-day money-back guarantee</span>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10 text-danger text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Only 20 slots remaining
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ==================== AFFILIATE TEASER ==================== */}
      <section id="affiliate" className="py-16 sm:py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-6 sm:p-8 lg:p-12 rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Affiliate Program
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
                  Earn 50% Commission
                </h2>
                <p className="text-lg text-muted mb-6">
                  Share SparkLeads with your audience and earn $7.50 for every sale. It&apos;s that simple.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Join Affiliate Program
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-6 rounded-xl bg-surface2 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">50%</div>
                  <div className="text-xs sm:text-sm text-muted">Commission</div>
                </div>
                <div className="p-4 sm:p-6 rounded-xl bg-surface2 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">$7.50</div>
                  <div className="text-xs sm:text-sm text-muted">Per Referral</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="py-20 fade-in-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted">
              Everything you need to know about SparkLeads
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface2/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-base font-medium text-text pr-4">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-5 pb-5 text-sm text-muted leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER CTA ==================== */}
      <section className="py-16 sm:py-20 fade-in-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Stop searching. Start closing.
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto mb-8">
              Join thousands of businesses using SparkLeads to find leads and grow revenue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <a
                    href="#pricing"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    Get Started Now
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-muted hover:text-text border border-border rounded-xl hover:bg-surface2 transition-colors text-center"
                  >
                    Learn More
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-text">SparkLeads</span>
                </div>
                <p className="text-sm text-muted">Find business leads in seconds.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-sm text-muted hover:text-text transition-colors">Features</a></li>
                  <li><a href="#pricing" className="text-sm text-muted hover:text-text transition-colors">Pricing</a></li>
                  <li><a href="#affiliate" className="text-sm text-muted hover:text-text transition-colors">Affiliate</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-sm text-muted hover:text-text transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="text-sm text-muted hover:text-text transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-sm text-muted hover:text-text transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text mb-4">Connect</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Support
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@sparkleads.dev" className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors">
                      <Mail className="w-4 h-4" />
                      Email Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border mt-12 pt-8 text-center">
              <p className="text-sm text-muted">
                © {new Date().getFullYear()} SparkLeads. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SOCIAL PROOF TICKER ==================== */}
      <div className="hidden sm:block fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-border overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-3">
          {[...socialProofNotifications, ...socialProofNotifications].map((notification, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-medium text-text">{notification.name}</span>
              <span>in {notification.location}</span>
              <span>{notification.action}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom spacer for ticker */}
      <div className="hidden sm:block h-12" />
    </main>
  );
}
