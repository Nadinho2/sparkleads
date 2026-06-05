'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface PipelineData {
  businessName: string;
  websiteScore?: number;
  gbpScore?: number;
  auditId?: string;
  gradeId?: string;
  gbpId?: string;
  competitorId?: string;
  proposalId?: string;
  leadId?: string;
}

interface NextStepBannerProps {
  currentStep: 'grade' | 'gbp' | 'audit' | 'competitor' | 'proposal';
  data: PipelineData;
  onWhatsApp?: () => void;
}

const PIPELINE_STEPS: Record<string, {
  next: string;
  label: string;
  title: (d: PipelineData) => string;
  description: (d: PipelineData) => string;
  cta: string;
  credits: number;
  icon: string;
  urgency: (d: PipelineData) => 'high' | 'medium';
  navigateTo: ((d: PipelineData) => string) | null;
}> = {
  grade: {
    next: 'audit',
    label: 'Next Step',
    title: (d) => d.websiteScore && d.websiteScore < 70
      ? `${d.businessName} scored ${d.websiteScore}/100 \u2014 they need help`
      : `${d.businessName} scored ${d.websiteScore}/100`,
    description: (d) => d.websiteScore && d.websiteScore < 70
      ? "Turn this into a full audit report to show them exactly what's wrong and how you can fix it."
      : 'Create a full audit report combining this with their Google Business Profile score.',
    cta: 'Generate Full Audit Report',
    credits: 10,
    icon: '\ud83d\udccb',
    urgency: (d) => d.websiteScore && d.websiteScore < 50 ? 'high' : 'medium',
    navigateTo: (d) =>
      `/dashboard/audit/report?gradeId=${d.gradeId}&name=${encodeURIComponent(d.businessName)}&leadId=${d.leadId || ''}`,
  },
  gbp: {
    next: 'audit',
    label: 'Next Step',
    title: (d) => `Google Profile scored ${d.gbpScore}/100`,
    description: () => 'Combine with a website audit to create a complete digital presence report.',
    cta: 'Generate Full Audit Report',
    credits: 10,
    icon: '\ud83d\udccb',
    urgency: (d) => d.gbpScore && d.gbpScore < 50 ? 'high' : 'medium',
    navigateTo: (d) =>
      `/dashboard/audit/report?gbpId=${d.gbpId}&name=${encodeURIComponent(d.businessName)}&leadId=${d.leadId || ''}`,
  },
  competitor: {
    next: 'proposal',
    label: 'Use This Analysis',
    title: (d) => `${d.businessName} is behind their competitors`,
    description: () => 'Turn this competitive analysis into a proposal showing them exactly how you can help them catch up.',
    cta: 'Create Proposal from This Analysis',
    credits: 5,
    icon: '\ud83d\udcc4',
    urgency: () => 'high',
    navigateTo: (d) =>
      `/dashboard/proposals/new?competitorId=${d.competitorId}&name=${encodeURIComponent(d.businessName)}&leadId=${d.leadId || ''}`,
  },
  audit: {
    next: 'proposal',
    label: 'Next Step',
    title: (d) => `Audit report for ${d.businessName} is ready`,
    description: () => 'Convert this into a professional proposal and send it to the business. Most agencies charge \u20a630,000-\u20a6500,000 for fixing these issues.',
    cta: 'Generate Proposal',
    credits: 5,
    icon: '\ud83d\udcc4',
    urgency: () => 'high',
    navigateTo: (d) =>
      `/dashboard/proposals/new?auditId=${d.auditId}&name=${encodeURIComponent(d.businessName)}&leadId=${d.leadId || ''}`,
  },
  proposal: {
    next: 'whatsapp',
    label: 'Send It',
    title: (d) => `Proposal for ${d.businessName} is ready`,
    description: () => 'Send it directly via WhatsApp with a personalized message based on what you found in their audit.',
    cta: 'Send via WhatsApp',
    credits: 1,
    icon: '\ud83d\udcf1',
    urgency: () => 'high',
    navigateTo: null,
  },
};

const PIPELINE_ORDER = ['grade', 'audit', 'proposal', 'whatsapp'];

export default function NextStepBanner({ currentStep, data, onWhatsApp }: NextStepBannerProps) {
  const router = useRouter();
  const step = PIPELINE_STEPS[currentStep];
  if (!step) return null;

  const urgencyColors: Record<string, string> = {
    high: 'border-orange-500/30 bg-orange-500/5',
    medium: 'border-primary/30 bg-primary/5',
  };

  return (
    <div className={`rounded-xl border p-5 mt-6 ${urgencyColors[step.urgency(data)]}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{step.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                {step.label}
              </span>
              {step.urgency(data) === 'high' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  Recommended
                </span>
              )}
            </div>
            <h3 className="font-bold text-text text-lg">{step.title(data)}</h3>
            <p className="text-sm text-muted mt-1 max-w-lg">{step.description(data)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => {
              if (step.navigateTo) {
                router.push(step.navigateTo(data));
              } else {
                onWhatsApp?.();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
          >
            {step.cta}
            <ArrowRight size={16} />
          </button>
          <span className="text-xs text-muted">
            Uses {step.credits} credit{step.credits > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Pipeline progress dots */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted mr-2">Pipeline:</p>
        {PIPELINE_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                s === currentStep
                  ? 'bg-primary scale-125'
                  : PIPELINE_ORDER.indexOf(s) < PIPELINE_ORDER.indexOf(currentStep)
                    ? 'bg-green-400'
                    : 'bg-surface2'
              }`}
            />
            <span
              className={`text-xs capitalize ${
                s === currentStep ? 'text-primary font-medium' : 'text-muted'
              }`}
            >
              {s === 'whatsapp' ? 'Send' : s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <ChevronRight size={12} className="text-muted" />}
          </div>
        ))}
      </div>
    </div>
  );
}
