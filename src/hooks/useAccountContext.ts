'use client';

import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  monthly_credits: number;
  credits_remaining: number;
  seats_limit: number;
  logo_url: string | null;
  brand_color: string;
}

interface WorkspaceMember {
  id: string;
  role: 'owner' | 'manager' | 'member';
  credit_limit: number;
  credits_used: number;
  name: string;
  email: string;
}

interface AccountContext {
  token: string;
  accountType: 'individual' | 'agency';
  workspaceId: string | null;
  workspace: Workspace | null;
  member: WorkspaceMember | null;
  role: 'owner' | 'manager' | 'member' | null;
  creditBalance: number;
  isOwner: boolean;
  isAgency: boolean;
}

export function useAccountContext(): AccountContext {
  const [context, setContext] = useState<AccountContext>({
    token: '',
    accountType: 'individual',
    workspaceId: null,
    workspace: null,
    member: null,
    role: null,
    creditBalance: 0,
    isOwner: false,
    isAgency: false,
  });

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setContext({
          token: data.token || '',
          accountType: data.accountType || 'individual',
          workspaceId: data.workspaceId || null,
          workspace: data.workspace || null,
          member: data.member || null,
          role: data.role || null,
          creditBalance: data.creditBalance || 0,
          isOwner: data.role === 'owner',
          isAgency: data.accountType === 'agency',
        });
      })
      .catch(() => {});
  }, []);

  return context;
}
