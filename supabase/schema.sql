-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1. searches
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  place_id TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  rating NUMERIC(2,1),
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','interested','closed','not_interested')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. email_cache
CREATE TABLE email_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT UNIQUE NOT NULL,
  email TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. activations
CREATE TABLE activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  affiliate_ref TEXT,
  user_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. affiliates
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. free_trial_searches
CREATE TABLE free_trial_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT,
  session_id TEXT,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. payout_requests
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. user_credits
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. credit_transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  balance_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. user_email_settings
CREATE TABLE user_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT UNIQUE NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  sender_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. follow_up_reminders
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  note TEXT,
  status TEXT CHECK (status IN ('pending', 'done', 'snoozed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. lead_notes
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_searches_user_token ON searches(user_token);
CREATE INDEX idx_leads_search_id ON leads(search_id);
CREATE INDEX idx_activations_token ON activations(token);
CREATE INDEX idx_activations_email ON activations(email);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_free_trial_searches_ip ON free_trial_searches(ip_address);
CREATE INDEX idx_free_trial_searches_session ON free_trial_searches(session_id);
CREATE INDEX idx_payout_requests_user_token ON payout_requests(user_token);
CREATE INDEX idx_user_credits_user_token ON user_credits(user_token);
CREATE INDEX idx_credit_transactions_user_token ON credit_transactions(user_token);
CREATE INDEX idx_user_email_settings_user_token ON user_email_settings(user_token);
CREATE INDEX idx_follow_up_reminders_user_token ON follow_up_reminders(user_token);
CREATE INDEX idx_follow_up_reminders_due_date ON follow_up_reminders(due_date);
CREATE INDEX idx_follow_up_reminders_status ON follow_up_reminders(status);
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_user_token ON lead_notes(user_token);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_trial_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- searches: Users can only access their own searches via user_token
CREATE POLICY "Users can view own searches"
  ON searches FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can insert own searches"
  ON searches FOR INSERT
  WITH CHECK (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own searches"
  ON searches FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can delete own searches"
  ON searches FOR DELETE
  USING (user_token = current_setting('app.current_user_token', true));

-- leads: Users can access leads belonging to their searches
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (
    search_id IN (
      SELECT id FROM searches
      WHERE user_token = current_setting('app.current_user_token', true)
    )
  );

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (
    search_id IN (
      SELECT id FROM searches
      WHERE user_token = current_setting('app.current_user_token', true)
    )
  );

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  USING (
    search_id IN (
      SELECT id FROM searches
      WHERE user_token = current_setting('app.current_user_token', true)
    )
  );

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  USING (
    search_id IN (
      SELECT id FROM searches
      WHERE user_token = current_setting('app.current_user_token', true)
    )
  );

-- email_cache: Service role only (no direct user access)
CREATE POLICY "Service role can manage email_cache"
  ON email_cache FOR ALL
  USING (auth.role() = 'service_role');

-- activations: Users can view their own activations by email
CREATE POLICY "Users can view own activations"
  ON activations FOR SELECT
  USING (email = current_setting('app.current_user_email', true));

CREATE POLICY "Service role can manage activations"
  ON activations FOR ALL
  USING (auth.role() = 'service_role');

-- affiliates: Users can view and update their own affiliate record
CREATE POLICY "Users can view own affiliate record"
  ON affiliates FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own affiliate record"
  ON affiliates FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage affiliates"
  ON affiliates FOR ALL
  USING (auth.role() = 'service_role');

-- free_trial_searches: Public insert, service role select/update
CREATE POLICY "Anyone can insert free trial searches"
  ON free_trial_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view free trial searches"
  ON free_trial_searches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update free trial searches"
  ON free_trial_searches FOR UPDATE
  USING (true);

-- payout_requests: Users can view and insert their own payout requests
CREATE POLICY "Users can view own payout requests"
  ON payout_requests FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can insert own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage payout requests"
  ON payout_requests FOR ALL
  USING (auth.role() = 'service_role');

-- user_credits: Users can view and update their own credits
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage user credits"
  ON user_credits FOR ALL
  USING (auth.role() = 'service_role');

-- credit_transactions: Users can view their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage credit transactions"
  ON credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- user_email_settings: Users can view and update their own email settings
CREATE POLICY "Users can view own email settings"
  ON user_email_settings FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own email settings"
  ON user_email_settings FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage email settings"
  ON user_email_settings FOR ALL
  USING (auth.role() = 'service_role');

-- follow_up_reminders: Users can manage their own reminders
CREATE POLICY "Users can view own reminders"
  ON follow_up_reminders FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can insert own reminders"
  ON follow_up_reminders FOR INSERT
  WITH CHECK (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own reminders"
  ON follow_up_reminders FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can delete own reminders"
  ON follow_up_reminders FOR DELETE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage reminders"
  ON follow_up_reminders FOR ALL
  USING (auth.role() = 'service_role');

-- lead_notes: Users can manage their own notes
CREATE POLICY "Users can view own notes"
  ON lead_notes FOR SELECT
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can insert own notes"
  ON lead_notes FOR INSERT
  WITH CHECK (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can update own notes"
  ON lead_notes FOR UPDATE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Users can delete own notes"
  ON lead_notes FOR DELETE
  USING (user_token = current_setting('app.current_user_token', true));

CREATE POLICY "Service role can manage notes"
  ON lead_notes FOR ALL
  USING (auth.role() = 'service_role');
