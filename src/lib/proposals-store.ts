import fs from 'fs';
import path from 'path';
import { createSupabaseAdmin } from './supabase';

const LOCAL_STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'proposals_store.json')
  : path.join(process.cwd(), 'data', 'proposals_store.json');

export interface ProposalItem {
  id: string;
  user_token: string;
  business_name: string;
  services: string[];
  pricing: { service: string; price: number; currency: string }[];
  status: string;
  proposal_data?: any;
  created_at: string;
}

function ensureLocalStore(): ProposalItem[] {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(LOCAL_STORE_PATH)) {
    const initial: ProposalItem[] = [
      {
        id: 'demo-proposal-1',
        user_token: '0b0e6f6f',
        business_name: 'Apex Growth Studio',
        services: ['SEO Optimization', 'Cold Email Sequences'],
        pricing: [
          { service: 'SEO Technical & Local Optimization', price: 1500, currency: 'USD' },
          { service: 'Automated Cold Email Sequences', price: 2000, currency: 'USD' },
        ],
        status: 'sent',
        created_at: new Date().toISOString(),
        proposal_data: {
          agency_name: 'UltimaSpark Agency',
          agency_contact: 'team@ultimaspark.com',
          opening: 'We are thrilled to present this comprehensive outbound acquisition and growth proposal for Apex Growth Studio.',
          problem_statement: 'Inconsistent lead flow and under-optimized outbound channels limiting client pipeline velocity.',
          solution_overview: 'Deploying high-intent automated lead discovery combined with multi-touch personalization sequences.',
          services: [
            {
              name: 'SEO Technical & Local Optimization',
              description: 'Comprehensive technical audit, Core Web Vitals remediation, and high-intent keyword mapping.',
              value_prop: 'Rank in top Google search results and drive organic high-ticket inbound inquiries.',
              deliverables: ['Full technical site audit', 'Speed optimization', 'Conversion-focused keyword mapping'],
            },
            {
              name: 'Automated Cold Email Sequences',
              description: 'Multi-step targeted cold email sequences tailored to validated B2B decision makers with AI reply handling.',
              value_prop: 'Generate 15-25 qualified discovery calls per month predictably.',
              deliverables: ['Custom sequence copywriting', 'Domain authentication & warmup', 'Automated follow-ups and AI sentiment alerts'],
            },
          ],
          total_price: 3500,
          currency: 'USD',
          timeline_overview: '4 weeks onboarding and initial campaign ramp-up, followed by monthly continuous optimization.',
          why_us: [
            'Proprietary B2B data intelligence with verified direct phone & email contacts',
            'AI-assisted buyer sentiment classification and instant CRM syncing',
            'Proven track record scaling client pipelines from scratch',
          ],
          next_steps: [
            'Review and digitally accept this proposal via the button above',
            'Onboarding kickoff call within 48 hours to align on Ideal Customer Profile (ICP)',
            'Campaign deployment and live pipeline monitoring',
          ],
          closing: 'We look forward to accelerating your revenue pipeline and partnering on your outbound growth.',
          ps_line: 'We guarantee initial sequence deployment within 10 business days of proposal acceptance.',
        },
      },
    ];
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }

    const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalStore(items: ProposalItem[]) {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(items, null, 2));
  } catch (e) {
    console.error('[Proposals Store] Failed to save local file:', e);
  }
}

export async function getProposalById(id: string): Promise<ProposalItem | null> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from('proposals').select('*').eq('id', id).single();
    if (!error && data) return data as ProposalItem;
  } catch {
    // Fall back to local store
  }

  const items = ensureLocalStore();
  return items.find((p) => p.id === id) || null;
}

export async function updateProposal(
  id: string,
  updates: Partial<ProposalItem>
): Promise<ProposalItem | null> {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from('proposals').update(updates).eq('id', id);
  } catch {
    // Fall back to local
  }

  const items = ensureLocalStore();
  const index = items.findIndex((p) => p.id === id);
  if (index >= 0) {
    items[index] = { ...items[index], ...updates };
    saveLocalStore(items);
    return items[index];
  }
  return null;
}

export async function listProposals(userToken: string): Promise<ProposalItem[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_token', userToken)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as ProposalItem[];
  } catch {
    // Fall back
  }

  const items = ensureLocalStore();
  return items.filter((p) => !userToken || p.user_token === userToken || p.user_token === '0b0e6f6f');
}
