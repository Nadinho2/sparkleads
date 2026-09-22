import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { createSupabaseAdmin } from './supabase';
import {
  OutreachCampaign,
  OutreachSequenceStep,
  OutreachQueueItem,
  OutreachSequenceStats,
} from '@/types';

const LOCAL_STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'outreach_store.json')
  : path.join(process.cwd(), 'data', 'outreach_store.json');

interface LocalStoreData {
  campaigns: OutreachCampaign[];
  steps: OutreachSequenceStep[];
  queue: OutreachQueueItem[];
}

function ensureLocalStore(): LocalStoreData {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const initial: LocalStoreData = { campaigns: [], steps: [], queue: [] };
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { campaigns: [], steps: [], queue: [] };
  }
}

function saveLocalStore(data: LocalStoreData) {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Store] Failed to save local store:', e);
  }
}

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    (typeof error.message === 'string' && error.message.includes('Could not find the table'))
  );
}

export async function getCampaigns(userToken: string): Promise<OutreachCampaign[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false });

  if (!error && data) {
    return data as OutreachCampaign[];
  }

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    return local.campaigns.filter((c) => c.user_token === userToken);
  }

  return [];
}

export async function getCampaignById(
  campaignId: string
): Promise<{ campaign: OutreachCampaign; steps: OutreachSequenceStep[] } | null> {
  const supabase = createSupabaseAdmin();
  const { data: campaign, error: campError } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campError && campaign) {
    const { data: steps } = await supabase
      .from('outreach_sequence_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('step_number', { ascending: true });

    return {
      campaign: campaign as OutreachCampaign,
      steps: (steps || []) as OutreachSequenceStep[],
    };
  }

  if (isTableNotFoundError(campError)) {
    const local = ensureLocalStore();
    const c = local.campaigns.find((item) => item.id === campaignId);
    if (!c) return null;
    const steps = local.steps
      .filter((s) => s.campaign_id === campaignId)
      .sort((a, b) => a.step_number - b.step_number);
    return { campaign: c, steps };
  }

  return null;
}

export async function createCampaign(
  userToken: string,
  name: string,
  steps: Array<{ step_number: number; delay_days: number; subject: string; body: string }>,
  recipients: Array<{
    email: string;
    name?: string;
    company?: string;
    website?: string;
    audit_score?: number | string;
    audit_issue?: string;
    client_id?: string;
    lead_id?: string;
  }>,
  clientId?: string | null,
  clientName?: string | null
): Promise<{ campaign: OutreachCampaign; steps: OutreachSequenceStep[]; queue: OutreachQueueItem[] }> {
  const campaignId = uuidv4();
  const now = new Date().toISOString();

  const newCampaign: OutreachCampaign = {
    id: campaignId,
    user_token: userToken,
    name,
    status: 'active',
    client_id: clientId || null,
    client_name: clientName || null,
    created_at: now,
    updated_at: now,
  };

  const newSteps: OutreachSequenceStep[] = steps.map((s) => ({
    id: uuidv4(),
    campaign_id: campaignId,
    step_number: s.step_number,
    delay_days: s.delay_days,
    subject: s.subject,
    body: s.body,
    created_at: now,
  }));

  const newQueue: OutreachQueueItem[] = recipients.map((r) => ({
    id: uuidv4(),
    campaign_id: campaignId,
    user_token: userToken,
    recipient_email: r.email.toLowerCase().trim(),
    recipient_name: r.name?.trim() || '',
    company_name: r.company?.trim() || '',
    website: r.website?.trim() || null,
    audit_score: r.audit_score || null,
    audit_issue: r.audit_issue || null,
    client_id: r.client_id || clientId || null,
    lead_id: r.lead_id || null,
    current_step: 1,
    status: 'scheduled',
    last_sent_at: null,
    next_run_at: now, // Ready to send immediately for step 1
    original_message_id: null,
    last_message_id: null,
    error_message: null,
    created_at: now,
    updated_at: now,
  }));

  const supabase = createSupabaseAdmin();
  const { error: campError } = await supabase.from('outreach_campaigns').insert(newCampaign);

  if (!campError) {
    await supabase.from('outreach_sequence_steps').insert(newSteps);
    await supabase.from('outreach_queue').insert(newQueue);
    return { campaign: newCampaign, steps: newSteps, queue: newQueue };
  }

  // Fallback to local store if Supabase table is not yet migrated
  const local = ensureLocalStore();
  local.campaigns.unshift(newCampaign);
  local.steps.push(...newSteps);
  local.queue.push(...newQueue);
  saveLocalStore(local);

  return { campaign: newCampaign, steps: newSteps, queue: newQueue };
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'active' | 'paused' | 'completed'
) {
  const now = new Date().toISOString();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('outreach_campaigns')
    .update({ status, updated_at: now })
    .eq('id', campaignId);

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    const c = local.campaigns.find((item) => item.id === campaignId);
    if (c) {
      c.status = status;
      c.updated_at = now;
      saveLocalStore(local);
    }
  }
}

export async function getQueueItems(
  userToken: string,
  campaignId?: string
): Promise<OutreachQueueItem[]> {
  const supabase = createSupabaseAdmin();
  let query = supabase.from('outreach_queue').select('*').eq('user_token', userToken);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (!error && data) {
    return data as OutreachQueueItem[];
  }

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    return local.queue
      .filter((q) => q.user_token === userToken && (!campaignId || q.campaign_id === campaignId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return [];
}

export async function getDueQueueItems(userToken?: string): Promise<OutreachQueueItem[]> {
  const now = new Date().toISOString();
  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('outreach_queue')
    .select('*')
    .eq('status', 'scheduled')
    .lte('next_run_at', now);

  if (userToken) {
    query = query.eq('user_token', userToken);
  }

  const { data, error } = await query;
  if (!error && data) {
    return data as OutreachQueueItem[];
  }

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    return local.queue.filter(
      (q) =>
        q.status === 'scheduled' &&
        new Date(q.next_run_at).getTime() <= Date.now() &&
        (!userToken || q.user_token === userToken)
    );
  }

  return [];
}

export async function updateQueueItem(
  id: string,
  updates: Partial<OutreachQueueItem>
): Promise<void> {
  const now = new Date().toISOString();
  const payload = { ...updates, updated_at: now };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('outreach_queue').update(payload).eq('id', id);

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    const item = local.queue.find((q) => q.id === id);
    if (item) {
      Object.assign(item, payload);
      saveLocalStore(local);
    }
  }
}

export async function getSequenceSteps(campaignId: string): Promise<OutreachSequenceStep[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('outreach_sequence_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_number', { ascending: true });

  if (!error && data) {
    return data as OutreachSequenceStep[];
  }

  if (isTableNotFoundError(error)) {
    const local = ensureLocalStore();
    return local.steps
      .filter((s) => s.campaign_id === campaignId)
      .sort((a, b) => a.step_number - b.step_number);
  }

  return [];
}

export async function getCampaignStats(
  userToken: string,
  campaignId?: string
): Promise<OutreachSequenceStats> {
  const items = await getQueueItems(userToken, campaignId);
  const totalLeads = items.length;
  const activeCount = items.filter((i) => i.status === 'scheduled' || i.status === 'sent').length;
  const repliedCount = items.filter((i) => i.status === 'replied').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const step1Sent = items.filter((i) => i.current_step >= 1 && (i.status === 'sent' || i.status === 'completed' || i.status === 'replied' || i.last_sent_at)).length;
  const step2Sent = items.filter((i) => i.current_step >= 2 && (i.status === 'sent' || i.status === 'completed' || i.status === 'replied')).length;
  const step3Sent = items.filter((i) => i.current_step >= 3 && (i.status === 'sent' || i.status === 'completed' || i.status === 'replied')).length;

  return {
    totalLeads,
    activeCount,
    repliedCount,
    completedCount,
    step1Sent,
    step2Sent,
    step3Sent,
  };
}

export async function enrollLeadsIntoCampaign(
  campaignId: string,
  userToken: string,
  leads: Array<{
    email: string;
    name?: string;
    company?: string;
    website?: string;
    audit_score?: number | string;
    audit_issue?: string;
    client_id?: string;
    lead_id?: string;
  }>,
  clientId?: string | null
): Promise<{ added: number }> {
  const now = new Date().toISOString();
  const queueItems: OutreachQueueItem[] = leads.map((l) => ({
    id: uuidv4(),
    campaign_id: campaignId,
    user_token: userToken,
    recipient_email: l.email.trim().toLowerCase(),
    recipient_name: l.name || '',
    company_name: l.company || '',
    website: l.website?.trim() || null,
    audit_score: l.audit_score || null,
    audit_issue: l.audit_issue || null,
    client_id: l.client_id || clientId || null,
    lead_id: l.lead_id || null,
    current_step: 1,
    status: 'scheduled',
    last_sent_at: null,
    next_run_at: now,
    original_message_id: null,
    last_message_id: null,
    error_message: null,
    created_at: now,
    updated_at: now,
  }));

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('outreach_queue').insert(queueItems);
  if (!error) {
    return { added: queueItems.length };
  }

  const local = ensureLocalStore();
  local.queue.push(...queueItems);
  saveLocalStore(local);
  return { added: queueItems.length };
}

export async function getActiveUserTokens(): Promise<string[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('outreach_queue')
    .select('user_token')
    .in('status', ['scheduled', 'sent']);

  if (!error && data) {
    const set = new Set(data.map((d: any) => d.user_token));
    return Array.from(set);
  }

  const local = ensureLocalStore();
  const set = new Set(
    local.queue
      .filter((q) => q.status === 'scheduled' || q.status === 'sent')
      .map((q) => q.user_token)
  );
  return Array.from(set);
}

