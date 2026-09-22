import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      typescript: true,
    })
  : null;

export interface PlanConfig {
  id: string;
  name: string;
  priceMonthly: number; // in cents ($19.00 = 1900)
  priceAnnual: number; // in cents ($180.00 = 18000)
  monthlyCredits: number;
  seats: number;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  solo: {
    id: 'solo',
    name: 'Solo / Starter',
    priceMonthly: 1900,
    priceAnnual: 18000,
    monthlyCredits: 300,
    seats: 1,
    features: [
      '300 verified leads / month',
      '500 AI email generation credits',
      '1 connected email account',
      'Unlimited lead searches',
      'One-click CSV export',
      'Lead tracking & CRM pipeline',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 5900,
    priceAnnual: 58800,
    monthlyCredits: 2000,
    seats: 5,
    features: [
      '2,000 verified leads / month',
      '3,000 AI email generation credits',
      '5 connected email accounts',
      'Automated email sequences & drips',
      'Priority email support',
      'Lead status tracking & CRM',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency / Scale',
    priceMonthly: 19900,
    priceAnnual: 190800,
    monthlyCredits: 10000,
    seats: 999,
    features: [
      '10,000 verified leads / month',
      '15,000 AI email generation credits',
      'Unlimited connected email accounts',
      'Multi-client agency workspaces',
      'Team seats & shared credit pool',
      'Custom white-label branding',
      'Dedicated priority support',
    ],
  },
};

export interface CreditPackConfig {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents ($9.99 = 999)
  popular?: boolean;
}

export const CREDIT_PACKS: Record<string, CreditPackConfig> = {
  booster: {
    id: 'booster',
    name: 'Starter Booster',
    credits: 250,
    price: 999,
    popular: false,
  },
  growth: {
    id: 'growth',
    name: 'Growth Pack',
    credits: 1000,
    price: 2500,
    popular: true,
  },
  power: {
    id: 'power',
    name: 'Power Pack',
    credits: 3000,
    price: 6000,
    popular: false,
  },
  agency_mega: {
    id: 'agency_mega',
    name: 'Agency Mega Pack',
    credits: 10000,
    price: 15000,
    popular: false,
  },
};
