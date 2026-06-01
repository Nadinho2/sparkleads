'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Share2, Palette, Settings, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (profile: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  leadId?: string | null;
}

const BRAND_VOICES = [
  { value: 'professional', label: 'Professional', icon: '💼', desc: 'Formal and authoritative' },
  { value: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm and approachable' },
  { value: 'fun', label: 'Fun & Playful', icon: '🎉', desc: 'Energetic and casual' },
  { value: 'luxury', label: 'Luxury', icon: '💎', desc: 'Premium and elegant' },
  { value: 'bold', label: 'Bold & Direct', icon: '⚡', desc: 'Confident and assertive' },
  { value: 'educational', label: 'Educational', icon: '📚', desc: 'Informative and helpful' },
];

const SERVICE_SUGGESTIONS: Record<string, string[]> = {
  'hair salon': ['Haircut', 'Coloring', 'Braiding', 'Treatment', 'Styling', 'Weaving'],
  restaurant: ['Dine In', 'Takeaway', 'Delivery', 'Catering', 'Private Events'],
  gym: ['Weight Training', 'Cardio', 'Personal Training', 'Group Classes', 'Sauna'],
  hotel: ['Rooms', 'Conference Hall', 'Restaurant', 'Pool', 'Spa'],
  pharmacy: ['Prescriptions', 'OTC Medications', 'Health Consultation', 'Delivery'],
  boutique: ['Ready to Wear', 'Custom Orders', 'Accessories', 'Styling'],
  'real estate': ['Sales', 'Rentals', 'Property Management', 'Valuation'],
  photography: ['Portraits', 'Events', 'Product Photography', 'Video'],
  spa: ['Massage', 'Facial', 'Manicure', 'Pedicure', 'Body Treatment'],
  bakery: ['Cakes', 'Pastries', 'Bread', 'Custom Orders', 'Catering'],
};

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E4405F', placeholder: 'handle' },
  { key: 'facebook', label: 'Facebook', icon: '👥', color: '#1877F2', placeholder: 'page name' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#010101', placeholder: 'handle' },
  { key: 'twitter', label: 'Twitter/X', icon: '🐦', color: '#1DA1F2', placeholder: 'handle' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2', placeholder: 'company name' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366', placeholder: 'phone number' },
];

export function ProfileEditor({ isOpen, onClose, onSaved, initialData, leadId }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [tagline, setTagline] = useState('');
  const [usp, setUsp] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [brandVoice, setBrandVoice] = useState('friendly');
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('#3B82F6');

  const [alwaysPhone, setAlwaysPhone] = useState(true);
  const [alwaysHandles, setAlwaysHandles] = useState(true);
  const [defaultPlatforms, setDefaultPlatforms] = useState(['instagram', 'facebook']);

  useEffect(() => {
    if (initialData) {
      setBusinessName((initialData.business_name as string) || '');
      setBusinessType((initialData.business_type as string) || '');
      setLocation((initialData.location as string) || '');
      setWebsite((initialData.website as string) || '');
      setPhone((initialData.phone as string) || '');
      setServices((initialData.services as string[]) || []);
      setTagline((initialData.tagline as string) || '');
      setUsp((initialData.usp as string) || '');
      setTargetAudience((initialData.target_audience as string) || '');
      setInstagram((initialData.instagram as string) || '');
      setFacebook((initialData.facebook as string) || '');
      setTiktok((initialData.tiktok as string) || '');
      setTwitter((initialData.twitter as string) || '');
      setLinkedin((initialData.linkedin as string) || '');
      setWhatsapp((initialData.whatsapp as string) || '');
      setBrandVoice((initialData.brand_voice as string) || 'friendly');
      setBrandColors((initialData.brand_colors as string[]) || []);
      setAlwaysPhone(initialData.always_include_phone !== false);
      setAlwaysHandles(initialData.always_include_handles !== false);
      setDefaultPlatforms((initialData.default_platforms as string[]) || ['instagram', 'facebook']);
    }
  }, [initialData]);

  const addService = () => {
    if (serviceInput.trim() && !services.includes(serviceInput.trim())) {
      setServices([...services, serviceInput.trim()]);
      setServiceInput('');
    }
  };

  const removeService = (s: string) => {
    setServices(services.filter((x) => x !== s));
  };

  const addColor = () => {
    if (brandColors.length < 4 && !brandColors.includes(colorInput)) {
      setBrandColors([...brandColors, colorInput]);
    }
  };

  const removeColor = (c: string) => {
    setBrandColors(brandColors.filter((x) => x !== c));
  };

  const toggleDefaultPlatform = (p: string) => {
    setDefaultPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const suggestions = SERVICE_SUGGESTIONS[businessType.toLowerCase()] || [];

  const handleSave = async () => {
    if (!businessName.trim() || !businessType.trim()) {
      toast.error('Business name and type are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/content/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id || undefined,
          lead_id: leadId || initialData?.lead_id || null,
          business_name: businessName,
          business_type: businessType,
          location,
          website,
          phone,
          instagram,
          facebook,
          tiktok,
          twitter,
          linkedin,
          whatsapp,
          services,
          tagline,
          brand_voice: brandVoice,
          target_audience: targetAudience,
          usp,
          brand_colors: brandColors,
          default_platforms: defaultPlatforms,
          always_include_phone: alwaysPhone,
          always_include_handles: alwaysHandles,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Profile saved for ${businessName}`);
        onSaved(data.profile);
        onClose();
      } else {
        toast.error(data.error || 'Failed to save profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { label: 'Business Info', icon: Building2 },
    { label: 'Social Handles', icon: Share2 },
    { label: 'Brand Details', icon: Palette },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-surface border-l border-border h-full overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            {initialData?.id ? 'Edit Profile' : 'New Client Profile'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border px-6">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {activeTab === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Business Name *</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Glamour Touch Salon" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Business Type *</label>
                <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Hair Salon" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lekki, Lagos" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Website</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Services</label>
                <div className="flex gap-2 mb-2">
                  <input value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())} placeholder="Type and press Enter" className="flex-1 rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
                  <button onClick={addService} className="px-3 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">Add</button>
                </div>
                {suggestions.length > 0 && services.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => { if (!services.includes(s)) setServices([...services, s]); }} className="px-2 py-1 rounded-full bg-surface2 text-xs text-muted hover:text-text border border-border transition-colors">+ {s}</button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {s}
                      <button onClick={() => removeService(s)} className="hover:text-white"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Tagline</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your brand slogan" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Unique Selling Point</label>
                <input value={usp} onChange={(e) => setUsp(e.target.value)} placeholder="What makes you different?" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Target Audience</label>
                <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Young professionals in Lagos" className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border" />
              </div>
            </>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              {PLATFORMS.map((p) => {
                const val = { instagram, facebook, tiktok, twitter, linkedin, whatsapp }[p.key] || '';
                const setter = { instagram: setInstagram, facebook: setFacebook, tiktok: setTiktok, twitter: setTwitter, linkedin: setLinkedin, whatsapp: setWhatsapp }[p.key];
                const urlPrefix = p.key === 'instagram' ? 'instagram.com/' : p.key === 'facebook' ? 'facebook.com/' : p.key === 'tiktok' ? 'tiktok.com/@' : p.key === 'twitter' ? 'x.com/' : p.key === 'linkedin' ? 'linkedin.com/company/' : '';

                return (
                  <div key={p.key} className="p-4 rounded-lg bg-surface2 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-sm font-medium text-text">{p.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={val}
                        onChange={(e) => setter?.(e.target.value)}
                        placeholder={p.placeholder}
                        className="flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border"
                      />
                      {val && (
                        <a
                          href={`https://${urlPrefix}${val}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg bg-surface text-muted hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {val && <p className="text-xs text-muted mt-1">{urlPrefix}{val}</p>}
                    {!val && <p className="text-xs text-muted mt-1">Not set</p>}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text mb-3">Brand Voice</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BRAND_VOICES.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setBrandVoice(v.value)}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        brandVoice === v.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-surface2 hover:border-primary/30'
                      }`}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <p className="text-sm font-medium text-text mt-2">{v.label}</p>
                      <p className="text-xs text-muted mt-0.5">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Brand Colors</label>
                <div className="flex items-center gap-2 mb-2">
                  <input type="color" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <button onClick={addColor} disabled={brandColors.length >= 4} className="px-3 py-2 rounded-lg bg-surface2 text-sm text-text hover:bg-surface2/80 border border-border disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted">{brandColors.length}/4 colors</span>
                </div>
                <div className="flex gap-2">
                  {brandColors.map((c) => (
                    <button key={c} onClick={() => removeColor(c)} className="w-10 h-10 rounded-full border-2 border-white/20 hover:border-white/50 transition-colors" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">These will influence content tone and emoji usage</p>
              </div>
            </>
          )}

          {activeTab === 3 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface2">
                <div>
                  <p className="text-sm font-medium text-text">Always include phone number</p>
                  <p className="text-xs text-muted">Add phone/WhatsApp to every generated post</p>
                </div>
                <button onClick={() => setAlwaysPhone(!alwaysPhone)} className={`w-12 h-6 rounded-full transition-colors ${alwaysPhone ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${alwaysPhone ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface2">
                <div>
                  <p className="text-sm font-medium text-text">Always include social handles</p>
                  <p className="text-xs text-muted">Mention @handles in captions where natural</p>
                </div>
                <button onClick={() => setAlwaysHandles(!alwaysHandles)} className={`w-12 h-6 rounded-full transition-colors ${alwaysHandles ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${alwaysHandles ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Default Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => toggleDefaultPlatform(p.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        defaultPlatforms.includes(p.key)
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-muted border border-border hover:text-text'
                      }`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !businessName.trim() || !businessType.trim()} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? <Spinner size="sm" /> : null}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
