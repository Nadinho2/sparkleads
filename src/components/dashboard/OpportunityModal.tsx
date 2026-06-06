'use client';

import { X, MessageCircle, BarChart2, StickyNote } from 'lucide-react';
import type { Lead } from '@/types';
import { FREELANCER_TYPES_MAP } from '@/lib/freelancer-types';

const DETAIL_LABELS: Record<string, string> = {
  ssl: 'SSL/HTTPS',
  viewport: 'Viewport Meta',
  responsive: 'Responsive Design',
  modernCSS: 'Modern CSS',
  images: 'Sufficient Images',
  customFont: 'Custom Fonts',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  metaDescription: 'Meta Description',
  pageTitle: 'Page Title',
  h1Tag: 'H1 Tag',
  googleProfile: 'Google Business Profile',
  reviewCount: '10+ Reviews',
  wordCount: '300+ Words',
  hasCTA: 'Call to Action',
  hasTestimonial: 'Testimonials',
  imageCount: 'Image Count',
  hasVideo: 'Video Content',
  hasGBPPhotos: 'GBP Photos',
  hasEmailCapture: 'Email Capture',
  hasContactForm: 'Contact Form',
  hasMailchimp: 'Email Tool Setup',
  hasEmailAddress: 'Email Address',
  facebookPixel: 'Facebook Pixel',
  googleAds: 'Google Ads',
  retargeting: 'Retargeting',
  analytics: 'Analytics',
  hasWhatsApp: 'WhatsApp Link',
  hasAutomation: 'Automation',
  hasChatWidget: 'Chat Widget',
  hasBooking: 'Booking System',
  hasLogo: 'Logo',
  hasBrandColors: 'Brand Colors',
  hasGBPPhoto: 'GBP Photo',
  hasBookingSystem: 'Booking System',
  hasPricing: 'Pricing Page',
  hasProcessExplained: 'Process Explained',
  // New types
  hasYouTube: 'YouTube Channel',
  hasVideoEmbed: 'Embedded Video',
  hasReels: 'Reels/Short Video',
  hasYouTubeChannel: 'YouTube Channel',
  hasEmbeddedVideos: 'Embedded Videos',
  isHighValueTarget: 'High-Value Target',
  hasTikTokEmbed: 'TikTok Embed',
  isTikTokSuitableBusiness: 'TikTok-Suitable Business',
  hasPodcast: 'Podcast',
  isPodcastSuitableBusiness: 'Podcast-Suitable Business',
  hasAnimation: 'Animation',
  hasSVG: 'SVG Graphics',
  hasCSSAnimation: 'CSS Animations',
  hasOnlineStore: 'Online Store',
  hasPaymentGateway: 'Payment Gateway',
  hasProductPages: 'Product Pages',
  isEcommerceReadyBusiness: 'E-commerce Ready',
  hasAppStoreLink: 'App Store Link',
  customerBase: 'Customer Base',
  isAppSuitableBusiness: 'App-Suitable Business',
  hasCRMIntegration: 'CRM Integration',
  hasLeadCapture: 'Lead Capture',
  isHighValueCRM: 'High-Value CRM Target',
  estimatedLeadVolume: 'Lead Volume',
  hasChatbot: 'Chatbot',
  hasFAQ: 'FAQ Page',
  hasLinkedInPage: 'LinkedIn Page',
  hasTeamPresence: 'Team Page',
  isB2BBusiness: 'B2B Business',
  hasInfluencerProgram: 'Influencer Program',
  isVisualBusiness: 'Visual Business',
  hasNewsSection: 'News/Blog Section',
  hasMediaKit: 'Media Kit',
  hasAwards: 'Awards/Recognition',
  reputationRisk: 'Reputation Risk',
  noReviews: 'Zero Reviews',
  badRating: 'Bad Rating',
  hasPrintMaterials: 'Print Materials',
  hasPDFDownloads: 'PDF Downloads',
  needsPrintDesign: 'Needs Print Design',
  hasAccessibility: 'Accessibility',
  hasAnimations: 'CSS Animations',
  isFoodBusiness: 'Food Business',
  hasDigitalMenu: 'Digital Menu',
  hasOnlineOrdering: 'Online Ordering',
  hasPDFMenu: 'PDF Menu',
  hasFoodContent: 'Food Content',
  hasOnlineBooking: 'Online Booking',
  hasCalendly: 'Calendly',
  onlyWhatsAppOrPhone: 'WhatsApp/Phone Only',
  needsBookingSystem: 'Needs Booking',
  hasServices: 'Services Page',
  hasMultilingual: 'Multilingual',
  detectedLanguages: 'Languages Detected',
  hasFAQPage: 'FAQ Page',
  hasGallery: 'Photo Gallery',
  hasVirtualTour: 'Virtual Tour',
  isPropertyBusiness: 'Property Business',
  hasAerialContent: 'Aerial Content',
  needsAerial: 'Needs Aerial',
  hasBlog: 'Blog/Content',
  hasPrograms: 'Programs/Classes',
  hasSocial: 'Social Media',
  hasEvents: 'Events Page',
};

function getDetailLabel(key: string): string {
  return DETAIL_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function getDetailValue(key: string, value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (key === 'reviewCount' && typeof value === 'number') return value > 10;
  if (key === 'wordCount' && typeof value === 'number') return value > 300;
  if (key === 'imageCount' && typeof value === 'number') return value > 5;
  if (key === 'rating' && typeof value === 'number') return value >= 4;
  if (key === 'reviews' && typeof value === 'number') return value >= 20;
  if (key === 'customerBase' && typeof value === 'number') return value > 20;
  if (key === 'reviewVolume' && typeof value === 'number') return value > 20;
  if (key === 'detectedLanguages' && typeof value === 'number') return value > 1;
  if (key === 'estimatedLeadVolume' && typeof value === 'string') return value !== 'Low';
  return !!value;
}

interface OpportunityModalProps {
  lead: Lead;
  scoreData: {
    score: number;
    label: string;
    opportunity: 'high' | 'medium' | 'low';
    details: Record<string, unknown> | null;
  } | null;
  freelancerType: string;
  isOpen: boolean;
  onClose: () => void;
  onWhatsAppPitch: (lead: Lead, pitch: string) => void;
}

export function OpportunityModal({
  lead,
  scoreData,
  freelancerType,
  isOpen,
  onClose,
  onWhatsAppPitch,
}: OpportunityModalProps) {
  if (!isOpen || !scoreData) return null;

  const typeInfo = FREELANCER_TYPES_MAP[freelancerType] || { label: 'Freelancer', icon: '🎯', scoreLabel: 'Score' };
  const score = scoreData.score;
  const opportunity = scoreData.opportunity;
  const details = scoreData.details || {};

  // Filter out non-boolean detail keys for the checklist
  const checklistKeys = Object.keys(details).filter(
    (k) => k !== 'verdict' && typeof details[k] !== 'string'
  );

  const verdict = (details.verdict as string) || '';

  // Generate pitch angle
  const opportunityLabel = opportunity === 'high'
    ? 'strong prospect'
    : opportunity === 'medium'
      ? 'potential client'
      : 'possible upsell';

  const pitchText = verdict
    ? `${verdict} — pitch your ${typeInfo.label.toLowerCase()} services as a ${opportunityLabel}.`
    : `This business could benefit from ${typeInfo.label.toLowerCase()} services.`;

  // Score circle color
  const scoreColor = opportunity === 'high'
    ? 'text-red-400 border-red-500/40'
    : opportunity === 'medium'
      ? 'text-yellow-400 border-yellow-500/40'
      : 'text-green-400 border-green-500/40';

  const scoreBg = opportunity === 'high'
    ? 'bg-red-500/10'
    : opportunity === 'medium'
      ? 'bg-yellow-500/10'
      : 'bg-green-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-text">{lead.name}</h3>
              <p className="text-xs text-muted">{typeInfo.label} — {scoreData.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface2 text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Big Score Circle */}
          <div className="flex justify-center">
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${scoreBg} ${scoreColor}`}>
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">{typeInfo.scoreLabel}</span>
            </div>
          </div>

          {/* Opportunity Level */}
          <div className={`rounded-xl p-4 text-center ${
            opportunity === 'high'
              ? 'bg-red-500/10 border border-red-500/20'
              : opportunity === 'medium'
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-green-500/10 border border-green-500/20'
          }`}>
            <p className={`text-sm font-semibold ${
              opportunity === 'high'
                ? 'text-red-400'
                : opportunity === 'medium'
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}>
              {opportunity === 'high' && '🔴 High Opportunity'}
              {opportunity === 'medium' && '🟡 Medium Opportunity'}
              {opportunity === 'low' && '🟢 Low Opportunity'}
            </p>
            <p className="text-xs text-muted mt-1">
              {opportunity === 'high' && `This business is a strong prospect for ${typeInfo.label.toLowerCase()} services`}
              {opportunity === 'medium' && `There's room to improve their ${typeInfo.label.toLowerCase()} presence`}
              {opportunity === 'low' && 'They seem to have this covered — smaller opportunity'}
            </p>
          </div>

          {/* What We Found */}
          {checklistKeys.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-3">What We Found</h4>
              <div className="space-y-2">
                {checklistKeys.map((key) => {
                  const passed = getDetailValue(key, details[key]);
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className={passed ? 'text-green-400' : 'text-red-400'}>
                        {passed ? '✅' : '❌'}
                      </span>
                      <span className={passed ? 'text-text' : 'text-muted'}>
                        {getDetailLabel(key)}
                        {!passed && (
                          <span className="text-xs text-muted ml-1">— opportunity</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your Pitch Angle */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold text-primary mb-1">Your Pitch Angle</h4>
            <p className="text-sm text-muted">{pitchText}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onWhatsAppPitch(lead, `Based on our analysis of ${lead.name}: ${verdict || 'They need help with ' + typeInfo.label.toLowerCase()}. I can help improve this — let me show you what I'd do differently.`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
            >
              <MessageCircle size={16} />
              Send WhatsApp Pitch
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('sparkleads_grade_url', JSON.stringify({
                    url: lead.website,
                    businessName: lead.name,
                    leadId: lead.id,
                    location: lead.address,
                    phone: lead.phone,
                  }));
                  window.location.href = '/dashboard/audit/grade';
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface2 text-muted text-sm hover:text-text transition-colors"
              >
                <BarChart2 size={14} />
                Generate Audit
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface2 text-muted text-sm hover:text-text transition-colors"
              >
                <StickyNote size={14} />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
