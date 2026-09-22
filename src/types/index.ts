export interface Lead {
  id: string;
  search_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  type: string | null;
  thumbnail: string | null;
  status: 'new' | 'contacted' | 'interested' | 'closed' | 'not_interested';
  place_id: string;
  created_at: string;
  hasReminder?: boolean;
  note?: string | null;
}

export interface Search {
  id: string;
  user_token: string;
  query: string;
  result_count: number;
  created_at: string;
}

export interface Activation {
  id: string;
  token: string;
  email: string;
  used: boolean;
  affiliate_ref: string | null;
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_token: string;
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
}

export interface OutreachCampaign {
  id: string;
  user_token: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  client_id?: string | null;
  client_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachSequenceStep {
  id: string;
  campaign_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
  created_at: string;
}

export interface OutreachQueueItem {
  id: string;
  campaign_id: string;
  user_token: string;
  recipient_email: string;
  recipient_name: string;
  company_name: string;
  website?: string | null;
  audit_score?: number | string | null;
  audit_issue?: string | null;
  client_id?: string | null;
  lead_id?: string | null;
  current_step: number;
  status: 'scheduled' | 'sent' | 'replied' | 'completed' | 'failed' | 'paused';
  last_sent_at: string | null;
  next_run_at: string;
  original_message_id: string | null;
  last_message_id: string | null;
  reply_sentiment?: 'interested' | 'neutral' | 'not_interested' | 'out_of_office' | null;
  reply_summary?: string | null;
  suggested_reply?: string | null;
  open_count?: number;
  opened_at?: string | null;
  clicked_at?: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachSequenceStats {
  totalLeads: number;
  activeCount: number;
  repliedCount: number;
  completedCount: number;
  step1Sent: number;
  step2Sent: number;
  step3Sent: number;
}
