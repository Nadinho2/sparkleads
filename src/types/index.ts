export interface Lead {
  id: string;
  search_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  status: 'new' | 'contacted' | 'interested' | 'closed' | 'not_interested';
  place_id: string;
  created_at: string;
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
