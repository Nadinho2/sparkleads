export interface FreelancerType {
  id: string;
  label: string;
  icon: string;
  scoreLabel: string;
  color: string;
}

export const FREELANCER_TYPES: FreelancerType[] = [
  // ORIGINAL 10
  { id: 'web_designer', label: 'Web Designer', icon: '🌐', scoreLabel: 'Web Score', color: 'orange' },
  { id: 'smma', label: 'Social Media Manager', icon: '📱', scoreLabel: 'Social Score', color: 'pink' },
  { id: 'seo', label: 'SEO Freelancer', icon: '🔍', scoreLabel: 'SEO Score', color: 'green' },
  { id: 'copywriter', label: 'Copywriter', icon: '✍️', scoreLabel: 'Copy Score', color: 'blue' },
  { id: 'photographer', label: 'Photographer/Videographer', icon: '📸', scoreLabel: 'Visual Score', color: 'purple' },
  { id: 'email_marketer', label: 'Email Marketer', icon: '📧', scoreLabel: 'Email Score', color: 'yellow' },
  { id: 'ads_specialist', label: 'Ads Specialist', icon: '🎯', scoreLabel: 'Ads Score', color: 'red' },
  { id: 'whatsapp_dev', label: 'WhatsApp/Chatbot Developer', icon: '💬', scoreLabel: 'Automation Score', color: 'green' },
  { id: 'brand_designer', label: 'Brand/Graphic Designer', icon: '🎨', scoreLabel: 'Brand Score', color: 'indigo' },
  { id: 'consultant', label: 'Business Consultant', icon: '📊', scoreLabel: 'Ops Score', color: 'teal' },

  // VIDEO & CONTENT
  { id: 'video_editor', label: 'Video Editor / Creator', icon: '🎬', scoreLabel: 'Video Score', color: 'red' },
  { id: 'youtube_specialist', label: 'YouTube Specialist', icon: '▶️', scoreLabel: 'YouTube Score', color: 'red' },
  { id: 'tiktok_specialist', label: 'TikTok Specialist', icon: '🎵', scoreLabel: 'TikTok Score', color: 'pink' },
  { id: 'podcast_editor', label: 'Podcast Producer/Editor', icon: '🎙️', scoreLabel: 'Podcast Score', color: 'purple' },
  { id: 'animator', label: 'Animator / Motion Designer', icon: '✨', scoreLabel: 'Motion Score', color: 'indigo' },

  // E-COMMERCE & TECH
  { id: 'ecommerce_dev', label: 'E-commerce Developer', icon: '🛒', scoreLabel: 'Store Score', color: 'green' },
  { id: 'app_developer', label: 'Mobile App Developer', icon: '📱', scoreLabel: 'App Score', color: 'blue' },
  { id: 'crm_specialist', label: 'CRM Specialist', icon: '🗂️', scoreLabel: 'CRM Score', color: 'teal' },
  { id: 'chatbot_dev', label: 'Chatbot / AI Developer', icon: '🤖', scoreLabel: 'Bot Score', color: 'cyan' },

  // MARKETING SPECIALISTS
  { id: 'linkedin_specialist', label: 'LinkedIn Specialist', icon: '💼', scoreLabel: 'LinkedIn Score', color: 'blue' },
  { id: 'influencer_marketer', label: 'Influencer Marketer', icon: '⭐', scoreLabel: 'Influence Score', color: 'yellow' },
  { id: 'pr_specialist', label: 'PR / Reputation Manager', icon: '📰', scoreLabel: 'Reputation Score', color: 'orange' },
  { id: 'review_manager', label: 'Review Manager', icon: '⭐', scoreLabel: 'Review Score', color: 'yellow' },

  // DESIGN SPECIALISTS
  { id: 'logo_designer', label: 'Logo / Brand Designer', icon: '🎨', scoreLabel: 'Brand Score', color: 'pink' },
  { id: 'print_designer', label: 'Print Designer', icon: '🖨️', scoreLabel: 'Print Score', color: 'gray' },
  { id: 'ui_ux_designer', label: 'UI/UX Designer', icon: '🖥️', scoreLabel: 'UX Score', color: 'purple' },

  // FOOD & HOSPITALITY TECH
  { id: 'menu_designer', label: 'Menu / Food Designer', icon: '🍽️', scoreLabel: 'Menu Score', color: 'orange' },
  { id: 'food_photographer', label: 'Food Photographer', icon: '🍕', scoreLabel: 'Food Visual Score', color: 'red' },
  { id: 'booking_specialist', label: 'Booking System Specialist', icon: '📅', scoreLabel: 'Booking Score', color: 'green' },

  // PROFESSIONAL SERVICES
  { id: 'accountant', label: 'Accountant / Bookkeeper', icon: '💰', scoreLabel: 'Finance Score', color: 'green' },
  { id: 'hr_consultant', label: 'HR Consultant', icon: '👥', scoreLabel: 'HR Score', color: 'blue' },
  { id: 'legal_consultant', label: 'Legal / Compliance Consultant', icon: '⚖️', scoreLabel: 'Compliance Score', color: 'gray' },
  { id: 'translation', label: 'Translator / Localisation', icon: '🌍', scoreLabel: 'Language Score', color: 'teal' },
  { id: 'virtual_assistant', label: 'Virtual Assistant', icon: '🤝', scoreLabel: 'Operations Score', color: 'purple' },

  // REAL ESTATE & PROPERTY
  { id: 'property_photographer', label: 'Real Estate Photographer', icon: '🏠', scoreLabel: 'Property Visual Score', color: 'orange' },
  { id: 'drone_operator', label: 'Drone Operator', icon: '🚁', scoreLabel: 'Aerial Score', color: 'sky' },
  { id: 'property_videographer', label: 'Property Videographer', icon: '🎥', scoreLabel: 'Property Video Score', color: 'blue' },

  // HEALTH & WELLNESS
  { id: 'nutrition_coach', label: 'Nutrition / Wellness Coach', icon: '🥗', scoreLabel: 'Wellness Score', color: 'green' },
  { id: 'fitness_consultant', label: 'Fitness Consultant', icon: '💪', scoreLabel: 'Fitness Score', color: 'orange' },

  // EVENTS
  { id: 'event_photographer', label: 'Event Photographer', icon: '📷', scoreLabel: 'Event Visual Score', color: 'purple' },
  { id: 'event_videographer', label: 'Event Videographer', icon: '🎥', scoreLabel: 'Event Video Score', color: 'red' },
  { id: 'mc_entertainer', label: 'MC / Entertainer', icon: '🎤', scoreLabel: 'Entertainment Score', color: 'yellow' },
];

export const FREELANCER_TYPES_MAP: Record<string, { label: string; icon: string; scoreLabel: string }> =
  Object.fromEntries(FREELANCER_TYPES.map((t) => [t.id, { label: t.label, icon: t.icon, scoreLabel: t.scoreLabel }]));
