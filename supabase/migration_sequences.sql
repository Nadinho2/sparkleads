-- =============================================================================
-- AUTOMATED OUTREACH SEQUENCES & FOLLOW-UP ENGINE
-- =============================================================================

-- 1. outreach_campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_user ON outreach_campaigns(user_token);

-- 2. outreach_sequence_steps
CREATE TABLE IF NOT EXISTS outreach_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_campaign ON outreach_sequence_steps(campaign_id);

-- 3. outreach_queue
CREATE TABLE IF NOT EXISTS outreach_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  user_token TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  current_step INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('scheduled', 'sent', 'replied', 'completed', 'failed', 'paused')) DEFAULT 'scheduled',
  last_sent_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ DEFAULT NOW(),
  original_message_id TEXT,
  last_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_queue_campaign ON outreach_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_user ON outreach_queue(user_token);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_status_next ON outreach_queue(status, next_run_at);

-- Enable RLS
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_queue ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
CREATE POLICY "Service role can manage outreach campaigns"
  ON outreach_campaigns FOR ALL
  USING (true);

CREATE POLICY "Service role can manage sequence steps"
  ON outreach_sequence_steps FOR ALL
  USING (true);

CREATE POLICY "Service role can manage queue"
  ON outreach_queue FOR ALL
  USING (true);
