'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Send, Mail, MessageCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    // TODO: Wire up to email service (Resend / SendGrid)
    console.log('Contact form submission:', { name, email, subject, message });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setSubmitting(false);
  };

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
            <Mail className="w-4 h-4" />
            Contact Us
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
            Get in Touch
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Have a question, feedback, or need help? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {submitted ? (
              <div className="p-8 rounded-2xl border border-border bg-surface text-center">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-text mb-2">Message Sent!</h2>
                <p className="text-muted mb-6">
                  Thank you for reaching out. We&apos;ll get back to you within a few hours.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-2xl border border-border bg-surface"
              >
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm cursor-pointer"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Question</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="affiliate">Affiliate Program</option>
                      <option value="refund">Refund Request</option>
                      <option value="feedback">Feedback & Suggestions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Message <span className="text-danger">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border bg-surface">
              <Mail className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-base font-semibold text-text mb-1">Email</h3>
              <p className="text-sm text-muted mb-2">For general inquiries and support</p>
              <a
                href="mailto:support@sparkleads.dev"
                className="text-sm text-primary hover:underline"
              >
                support@sparkleads.dev
              </a>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface">
              <MessageCircle className="w-8 h-8 text-success mb-3" />
              <h3 className="text-base font-semibold text-text mb-1">WhatsApp</h3>
              <p className="text-sm text-muted mb-2">Quick support via WhatsApp</p>
              <span className="text-sm text-muted">Available on request</span>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface">
              <h3 className="text-base font-semibold text-text mb-2">Response Time</h3>
              <p className="text-sm text-muted">
                We typically respond within a few hours during business days. For urgent issues, reach out via WhatsApp.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface">
              <h3 className="text-base font-semibold text-text mb-2">Common Topics</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-sm text-primary hover:underline">
                    → Visit Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-primary hover:underline">
                    → Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
