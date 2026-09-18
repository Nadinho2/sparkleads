'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Building2,
  Coins,
  KeyRound,
  Search,
  Lock,
  RefreshCw,
  LogOut,
  Activity,
  ChevronRight,
  Banknote,
  Copy,
  Check,
  Crown,
  Sliders,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalTeamMembers: number;
  totalCreditsCirculating: number;
  userCreditsPool: number;
  workspaceCreditsPool: number;
  totalSearches: number;
  totalLeadsFound: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmount: number;
}

interface AdminUser {
  token: string;
  email: string;
  plan: string;
  used: boolean;
  activatedAt?: string;
  createdAt: string;
  creditBalance: number;
  totalPurchased: number;
  referralCode?: string | null;
  agency?: {
    id: string;
    name: string;
    plan: string;
    status: string;
  } | null;
}

interface WorkspaceMember {
  id: string;
  userToken: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  creditLimit: number;
  creditsUsed: number;
  joinedAt: string;
}

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  ownerToken: string;
  ownerEmail: string;
  plan: string;
  status: string;
  monthlyCredits: number;
  creditsRemaining: number;
  seatsLimit: number;
  createdAt: string;
  membersCount: number;
  activeMembersCount: number;
}

interface AdminTransaction {
  id: string;
  userToken: string;
  userEmail: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  createdAt: string;
}

interface AdminPayout {
  id: string;
  userToken: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
}

type TabType = 'overview' | 'users' | 'agencies' | 'transactions' | 'payouts';

export default function AdminPage() {
  // Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users Tab
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<'all' | 'agency_only' | 'independent_only'>('all');

  // Agencies Tab
  const [agencies, setAgencies] = useState<AdminWorkspace[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);

  // Transactions Tab
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Payouts Tab
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Modals state
  // 1. Credit Adjust Modal
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditTargetUser, setCreditTargetUser] = useState<AdminUser | null>(null);
  const [creditAction, setCreditAction] = useState<'add' | 'deduct' | 'set'>('add');
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditNote, setCreditNote] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);

  // 2. Password Reset Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // 3. Edit Agency Workspace Modal
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [targetAgency, setTargetAgency] = useState<AdminWorkspace | null>(null);
  const [agencyPlan, setAgencyPlan] = useState('starter');
  const [agencyStatus, setAgencyStatus] = useState('active');
  const [agencySeatsLimit, setAgencySeatsLimit] = useState(5);
  const [agencyCreditsRemaining, setAgencyCreditsRemaining] = useState(500);
  const [agencyAddCredits, setAgencyAddCredits] = useState<number>(0);
  const [agencySubmitting, setAgencySubmitting] = useState(false);

  // 4. Create / Provision Agency Modal
  const [createAgencyModalOpen, setCreateAgencyModalOpen] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyOwnerEmail, setNewAgencyOwnerEmail] = useState('');
  const [newAgencyPlan, setNewAgencyPlan] = useState('starter');
  const [newAgencySeats, setNewAgencySeats] = useState(5);
  const [newAgencyCredits, setNewAgencyCredits] = useState(500);
  const [createAgencySubmitting, setCreateAgencySubmitting] = useState(false);

  // 5. View / Manage Agency Members Modal
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersAgency, setMembersAgency] = useState<AdminWorkspace | null>(null);
  const [activeMembers, setActiveMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Check auth on load
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthChecking(true);
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to verify admin status:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Authenticate with secret key
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKeyInput.trim()) {
      toast.error('Please enter the Admin Secret Key');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: secretKeyInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsAuthenticated(true);
      toast.success('Admin authentication successful');
      setSecretKeyInput('');
    } catch (err: any) {
      toast.error(err.message || 'Invalid admin key');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      toast.info('Logged out of Admin console');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        query: userSearch,
        agencyFilter,
        limit: '100',
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUsersTotal(data.pagination?.total || data.users?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, agencyFilter]);

  // Fetch Agencies
  const loadAgencies = useCallback(async () => {
    try {
      setAgenciesLoading(true);
      const res = await fetch('/api/admin/agencies');
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.workspaces || []);
      }
    } catch (err) {
      console.error('Error fetching agencies:', err);
    } finally {
      setAgenciesLoading(false);
    }
  }, []);

  // Fetch Transactions
  const loadTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const res = await fetch('/api/admin/transactions?limit=100');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Fetch Payouts
  const loadPayouts = useCallback(async () => {
    try {
      setPayoutsLoading(true);
      const res = await fetch('/api/admin/payouts?limit=100');
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  // Load data when tab changes or auth updates
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'overview') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'agencies') {
      loadAgencies();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'payouts') {
      loadPayouts();
    }
  }, [isAuthenticated, activeTab, loadStats, loadUsers, loadAgencies, loadTransactions, loadPayouts]);

  // Trigger users search with debounce
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'users') return;
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, agencyFilter, isAuthenticated, activeTab, loadUsers]);

  // Handle User Credit Adjustment
  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditTargetUser) return;
    try {
      setCreditSubmitting(true);
      const res = await fetch('/api/admin/users/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: creditTargetUser.token,
          action: creditAction,
          amount: creditAmount,
          note: creditNote || 'Admin manual credit adjustment',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust credits');

      toast.success(`Updated credits for ${creditTargetUser.email}. New balance: ${data.balance}`);
      setCreditModalOpen(false);
      loadUsers();
      if (activeTab === 'overview') loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Credit adjustment failed');
    } finally {
      setCreditSubmitting(false);
    }
  };

  // Handle Password Reset
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordSubmitting(true);
      const res = await fetch('/api/admin/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: passwordTargetUser.token,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success(`Password reset successfully for ${passwordTargetUser.email}`);
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle Provisioning New Agency
  const handleCreateAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName.trim() || !newAgencyOwnerEmail.trim()) {
      toast.error('Please enter agency name and owner email');
      return;
    }

    const matchingUser = users.find(
      (u) => u.email.toLowerCase() === newAgencyOwnerEmail.trim().toLowerCase()
    );

    try {
      setCreateAgencySubmitting(true);
      const res = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newAgencyName.trim(),
          ownerEmail: newAgencyOwnerEmail.trim().toLowerCase(),
          ownerToken: matchingUser?.token || undefined,
          plan: newAgencyPlan,
          seatsLimit: Number(newAgencySeats),
          creditsRemaining: Number(newAgencyCredits),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create agency');

      toast.success(`Agency workspace "${newAgencyName}" provisioned successfully!`);
      setCreateAgencyModalOpen(false);
      setNewAgencyName('');
      setNewAgencyOwnerEmail('');
      loadAgencies();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Agency provisioning failed');
    } finally {
      setCreateAgencySubmitting(false);
    }
  };

  // Handle Agency Edit Submit
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAgency) return;

    try {
      setAgencySubmitting(true);
      const body: any = {
        workspaceId: targetAgency.id,
        plan: agencyPlan,
        status: agencyStatus,
        seatsLimit: Number(agencySeatsLimit),
        creditsRemaining: Number(agencyCreditsRemaining),
      };

      if (agencyAddCredits && agencyAddCredits > 0) {
        body.addCredits = Number(agencyAddCredits);
      }

      const res = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update agency');

      toast.success(`Updated agency workspace: ${targetAgency.name}`);
      setAgencyModalOpen(false);
      loadAgencies();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Agency update failed');
    } finally {
      setAgencySubmitting(false);
    }
  };

  // Open Manage Members Modal
  const openMembersModal = async (workspace: AdminWorkspace) => {
    setMembersAgency(workspace);
    setActiveMembers([]);
    setMembersModalOpen(true);
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/admin/agencies/${workspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setActiveMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  // Update Agency Member (role, status, creditLimit)
  const handleUpdateMember = async (
    memberId: string,
    updates: { role?: string; status?: string; creditLimit?: number }
  ) => {
    if (!membersAgency) return;
    try {
      setUpdatingMemberId(memberId);
      const res = await fetch(`/api/admin/agencies/${membersAgency.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          ...updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member');

      toast.success('Member updated');
      setActiveMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...data.member } : m))
      );
      loadAgencies();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update member');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Handle Affiliate Payout Action
  const handlePayoutAction = async (payoutId: string, status: 'completed' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process payout');

      toast.success(`Payout marked as ${status}`);
      loadPayouts();
      if (activeTab === 'overview') loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Copied to clipboard');
  };

  // ----------------------------------------------------
  // Render: Loading Screen
  // ----------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-gray-400 text-sm">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Passcode / Login Gate
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#111726]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/10">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SparkLeads Admin</h1>
            <p className="text-sm text-gray-400 mt-1">
              Superadmin Command Center & Agency Controller
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder="Enter administrator key..."
                  className="w-full px-4 py-3 pl-11 bg-[#0B0F19] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                />
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Enter Command Center</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
            <span>SparkLeads Cloud Engine v2.4</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Secured Node
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Authenticated Admin Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0E1322]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight">SparkLeads</span>
                <span className="ml-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  SuperAdmin
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-white/10 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span>Production Node</span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#13192B] p-1 rounded-xl border border-white/5">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'agencies', label: 'Agencies & Admins', icon: Building2 },
              { id: 'transactions', label: 'Credit Ledger', icon: Coins },
              { id: 'payouts', label: 'Affiliates & Payouts', icon: Banknote },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'overview') loadStats();
                if (activeTab === 'users') loadUsers();
                if (activeTab === 'agencies') loadAgencies();
                if (activeTab === 'transactions') loadTransactions();
                if (activeTab === 'payouts') loadPayouts();
                toast.success('Data refreshed');
              }}
              title="Refresh Data"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-white/5 gap-2 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'agencies', label: 'Agencies' },
            { id: 'transactions', label: 'Ledger' },
            { id: 'payouts', label: 'Payouts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW & STATS                                      */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Platform Command Overview</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Real-time operational statistics, credit flows, and multi-tenant workspace metrics
              </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Users */}
              <div className="bg-[#13192B]/70 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : (stats?.totalUsers ?? 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{stats?.activeUsers ?? 0} activated accounts</span>
                  </div>
                </div>
              </div>

              {/* Circulating Credits */}
              <div className="bg-[#13192B]/70 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Circulating Credits
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : (stats?.totalCreditsCirculating ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Users: {stats?.userCreditsPool?.toLocaleString() ?? 0} | Workspaces: {stats?.workspaceCreditsPool?.toLocaleString() ?? 0}
                  </div>
                </div>
              </div>

              {/* Agency Workspaces */}
              <div className="bg-[#13192B]/70 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Agency Workspaces
                  </span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.totalWorkspaces ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-cyan-400">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{stats?.totalTeamMembers ?? 0} agency team members</span>
                  </div>
                </div>
              </div>

              {/* Pending Payouts */}
              <div className="bg-[#13192B]/70 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pending Affiliate Cashouts
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : `₦${(stats?.pendingPayoutsAmount ?? 0).toLocaleString()}`}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    {stats?.pendingPayoutsCount ?? 0} requests awaiting transfer
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & System Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agency & User Management Card */}
              <div className="bg-[#13192B]/50 border border-white/10 rounded-2xl p-6 lg:col-span-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Agency Workspace Administration
                </h3>
                <p className="text-sm text-gray-400 mt-1 mb-5">
                  SparkLeads enables multi-tenant agency teams. You have master authority over agency admins, pooled credit caps, and user team permissions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setAgencyFilter('agency_only');
                      setActiveTab('users');
                    }}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm">Agency Admins</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-gray-400">
                      View all registered agency owners, their plans, and their pooled credit pools.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('agencies')}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm">Workspaces & Seats</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-gray-400">
                      Configure seats, upgrade workspace tiers, or manage team member access.
                    </p>
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Total Searches: <strong className="text-white">{stats?.totalSearches ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Discovered Leads: <strong className="text-white">{stats?.totalLeadsFound ?? 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Master Security Status */}
              <div className="bg-[#13192B]/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Access Security
                  </h3>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-gray-400">Auth Mechanism:</span>
                      <span className="font-mono text-indigo-300">ADMIN_SECRET_KEY</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-gray-400">Active Session:</span>
                      <span className="text-emerald-400 font-medium">Verified Cookie</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-gray-400">Database Engine:</span>
                      <span className="text-gray-200">Supabase Postgres</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-xs font-medium text-indigo-300 rounded-lg border border-indigo-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>View Credit Audit Log</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: USERS MANAGEMENT                                      */}
        {/* ============================================================ */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform Users</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Manage accounts, inject or deduct credits, reset credentials, and inspect agency associations
                </p>
              </div>

              <div className="text-xs text-gray-400">
                Total Found: <strong className="text-white">{usersTotal}</strong>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#13192B]/70 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by email, plan, or token..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-gray-400 whitespace-nowrap">Filter:</span>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value as any)}
                  className="px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Accounts</option>
                  <option value="agency_only">Agency Admins (Owners)</option>
                  <option value="independent_only">Independent Users</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#13192B]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0E1322] border-b border-white/10 text-[11px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5">User Identity</th>
                      <th className="px-5 py-3.5">Role / Agency</th>
                      <th className="px-5 py-3.5">Credit Balance</th>
                      <th className="px-5 py-3.5">Plan</th>
                      <th className="px-5 py-3.5">Registered</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                          Loading user directory...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          No users found matching your query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const isAgencyAdmin = !!u.agency;

                        return (
                          <tr key={u.token} className="hover:bg-white/[0.02] transition">
                            <td className="px-5 py-4">
                              <div className="font-medium text-white text-sm">{u.email}</div>
                              <div className="flex items-center gap-2 mt-1 text-gray-400 font-mono text-[11px]">
                                <span>{u.token.slice(0, 14)}...</span>
                                <button
                                  onClick={() => copyToClipboard(u.token, u.token)}
                                  className="text-gray-500 hover:text-white transition cursor-pointer"
                                  title="Copy user token"
                                >
                                  {copiedToken === u.token ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {isAgencyAdmin ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>Agency Admin ({u.agency?.name})</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Individual Account</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-white">
                                  {u.creditBalance.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-400">credits</span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="capitalize px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px]">
                                {u.plan || 'Free'}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-gray-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setCreditTargetUser(u);
                                    setCreditAction('add');
                                    setCreditAmount(100);
                                    setCreditNote('');
                                    setCreditModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
                                  title="Adjust Credits"
                                >
                                  Credits
                                </button>

                                <button
                                  onClick={() => {
                                    setPasswordTargetUser(u);
                                    setNewPassword('');
                                    setPasswordModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium transition cursor-pointer"
                                  title="Reset Password"
                                >
                                  Password
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: AGENCIES & WORKSPACE ADMINS                           */}
        {/* ============================================================ */}
        {activeTab === 'agencies' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Agency Workspaces & Admins</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Manage agency owners, configure multi-seat workspaces, inject agency credits, and inspect team members
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setNewAgencyName('');
                    setNewAgencyOwnerEmail(users[0]?.email || '');
                    setNewAgencyPlan('starter');
                    setNewAgencySeats(5);
                    setNewAgencyCredits(500);
                    setCreateAgencyModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Provision Agency Workspace</span>
                </button>
              </div>
            </div>

            {/* Agency Workspaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agenciesLoading ? (
                <div className="col-span-full py-16 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  Loading agency workspaces...
                </div>
              ) : agencies.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-400 bg-[#13192B]/30 border border-white/10 rounded-2xl p-8">
                  <Building2 className="w-10 h-10 text-gray-500 mx-auto mb-3 opacity-60" />
                  <p className="text-white font-semibold">No agency workspaces provisioned yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    You can provision an agency workspace for any registered user using the button above.
                  </p>
                </div>
              ) : (
                agencies.map((agency) => (
                  <div
                    key={agency.id}
                    className="bg-[#13192B]/70 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                          {agency.plan}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                            agency.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {agency.status}
                        </span>
                      </div>

                      {/* Workspace Title */}
                      <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                        {agency.name}
                      </h3>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">/{agency.slug}</div>

                      {/* Agency Admin Profile Info */}
                      <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Agency Admin (Owner)</span>
                        </div>
                        <div className="text-sm font-medium text-white truncate">{agency.ownerEmail}</div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                          <span>Token: {agency.ownerToken?.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(agency.ownerToken, agency.id)}
                            className="text-gray-400 hover:text-white transition cursor-pointer"
                            title="Copy owner token"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Capacity & Credits */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <div className="text-xs text-gray-400">Pooled Credits</div>
                          <div className="text-base font-bold text-amber-400 mt-0.5">
                            {agency.creditsRemaining.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5">
                          <div className="text-xs text-gray-400">Team Seats</div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {agency.membersCount} / {agency.seatsLimit}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openMembersModal(agency)}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Team ({agency.membersCount})</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetAgency(agency);
                          setAgencyPlan(agency.plan);
                          setAgencyStatus(agency.status);
                          setAgencySeatsLimit(agency.seatsLimit);
                          setAgencyCreditsRemaining(agency.creditsRemaining);
                          setAgencyAddCredits(0);
                          setAgencyModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Configure</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CREDIT LEDGER TRANSACTIONS                            */}
        {/* ============================================================ */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Credit Ledger & Audit Trail</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Real-time chronological record of credit debits, refunds, activation bonuses, and admin injections
              </p>
            </div>

            <div className="bg-[#13192B]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0E1322] border-b border-white/10 text-[11px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">User Email</th>
                      <th className="px-5 py-3.5">Delta</th>
                      <th className="px-5 py-3.5">Balance After</th>
                      <th className="px-5 py-3.5">Operation Type</th>
                      <th className="px-5 py-3.5">Description / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactionsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                          Loading transaction records...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          No credit transactions logged yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-400">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 font-medium text-white">
                            {tx.userEmail}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`font-semibold ${
                                tx.amount > 0
                                  ? 'text-emerald-400'
                                  : tx.amount < 0
                                  ? 'text-red-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-gray-300 font-mono">
                            {tx.balanceAfter}
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-indigo-300 font-mono text-[10px] uppercase">
                              {tx.type}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-gray-400 truncate max-w-xs">
                            {tx.description}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: AFFILIATE PAYOUTS                                     */}
        {/* ============================================================ */}
        {activeTab === 'payouts' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Affiliate Cashout Requests</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Review affiliate commission withdrawal requests, view banking details, and mark transfers completed
              </p>
            </div>

            <div className="bg-[#13192B]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0E1322] border-b border-white/10 text-[11px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5">Request Date</th>
                      <th className="px-5 py-3.5">Affiliate</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Banking Information</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payoutsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                          Loading payout requests...
                        </td>
                      </tr>
                    ) : payouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                          No affiliate payout requests submitted.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-5 py-4 whitespace-nowrap text-gray-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-white">{p.userEmail}</div>
                            {p.accountName && <div className="text-gray-400 text-[11px]">{p.accountName}</div>}
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-emerald-400">
                              ₦{Number(p.amount).toLocaleString()}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-mono text-[11px] text-gray-300">
                            <div>Bank: <strong className="text-white">{p.bankName || '—'}</strong></div>
                            <div>Acct: {p.accountNumber || '—'}</div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                p.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : p.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handlePayoutAction(p.id, 'completed')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handlePayoutAction(p.id, 'rejected')}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-medium transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs italic">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: ADJUST USER CREDITS                                 */}
      {/* ============================================================ */}
      <Modal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        title="Adjust User Credits"
      >
        {creditTargetUser && (
          <form onSubmit={handleCreditSubmit} className="space-y-4 text-gray-200">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Target User</div>
              <div className="font-semibold text-white text-sm mt-0.5">{creditTargetUser.email}</div>
              <div className="text-xs text-indigo-400 mt-1">
                Current Balance: <strong>{creditTargetUser.creditBalance}</strong> credits
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add', label: '+ Add' },
                  { id: 'deduct', label: '- Deduct' },
                  { id: 'set', label: '= Set Exact' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setCreditAction(act.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      creditAction === act.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Credit Amount
              </label>
              <input
                type="number"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Reason / Internal Note (Optional)
              </label>
              <input
                type="text"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                placeholder="e.g. VIP upgrade bonus, dispute correction..."
                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creditSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {creditSubmitting ? 'Updating...' : 'Confirm Credit Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: RESET USER PASSWORD                                 */}
      {/* ============================================================ */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Reset User Password"
      >
        {passwordTargetUser && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-gray-200">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Account</div>
              <div className="font-semibold text-white text-sm mt-0.5">{passwordTargetUser.email}</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)..."
                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                minLength={6}
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {passwordSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: PROVISION NEW AGENCY WORKSPACE                      */}
      {/* ============================================================ */}
      <Modal
        isOpen={createAgencyModalOpen}
        onClose={() => setCreateAgencyModalOpen(false)}
        title="Provision Agency Workspace"
      >
        <form onSubmit={handleCreateAgencySubmit} className="space-y-4 text-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
              Agency Name
            </label>
            <input
              type="text"
              value={newAgencyName}
              onChange={(e) => setNewAgencyName(e.target.value)}
              placeholder="e.g. Apex Growth Marketing"
              className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
              Agency Admin (Owner Email)
            </label>
            <input
              type="email"
              value={newAgencyOwnerEmail}
              onChange={(e) => setNewAgencyOwnerEmail(e.target.value)}
              placeholder="user@example.com"
              list="user-emails-list"
              className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <datalist id="user-emails-list">
              {users.map((u) => (
                <option key={u.token} value={u.email} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Plan Tier
              </label>
              <select
                value={newAgencyPlan}
                onChange={(e) => setNewAgencyPlan(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="starter">Starter (500 Credits)</option>
                <option value="growth">Growth (1,500 Credits)</option>
                <option value="pro">Pro (5,000 Credits)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Seats Limit
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newAgencySeats}
                onChange={(e) => setNewAgencySeats(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
              Initial Pooled Credits
            </label>
            <input
              type="number"
              min="0"
              value={newAgencyCredits}
              onChange={(e) => setNewAgencyCredits(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateAgencyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAgencySubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {createAgencySubmitting ? 'Provisioning...' : 'Provision Workspace'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 4: CONFIGURE EXISTING AGENCY WORKSPACE                 */}
      {/* ============================================================ */}
      <Modal
        isOpen={agencyModalOpen}
        onClose={() => setAgencyModalOpen(false)}
        title="Configure Agency Workspace"
      >
        {targetAgency && (
          <form onSubmit={handleAgencySubmit} className="space-y-4 text-gray-200">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Workspace</div>
              <div className="font-semibold text-white text-sm mt-0.5">{targetAgency.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                Admin: <span className="text-indigo-300">{targetAgency.ownerEmail}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Plan Tier
                </label>
                <select
                  value={agencyPlan}
                  onChange={(e) => setAgencyPlan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={agencyStatus}
                  onChange={(e) => setAgencyStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="past_due">Past Due / Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Max Seats Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={agencySeatsLimit}
                  onChange={(e) => setAgencySeatsLimit(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Pooled Credits
                </label>
                <input
                  type="number"
                  min="0"
                  value={agencyCreditsRemaining}
                  onChange={(e) => setAgencyCreditsRemaining(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                Quick Credit Top-up (+ Add Credits)
              </label>
              <input
                type="number"
                min="0"
                value={agencyAddCredits}
                onChange={(e) => setAgencyAddCredits(parseInt(e.target.value) || 0)}
                placeholder="0 to keep as is"
                className="w-full px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAgencyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={agencySubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {agencySubmitting ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 5: MANAGE AGENCY TEAM MEMBERS                          */}
      {/* ============================================================ */}
      <Modal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        title={`Team Members: ${membersAgency?.name || ''}`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="text-xs text-gray-400">
            Workspace Owner & Admin:{' '}
            <strong className="text-white">{membersAgency?.ownerEmail}</strong>
          </div>

          {membersLoading ? (
            <div className="py-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
              Loading team roster...
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="py-8 text-center text-gray-400 bg-white/5 rounded-xl">
              No team members have been invited to this workspace yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-white text-sm flex items-center gap-2">
                      <span>{member.email}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          member.role === 'owner' || member.role === 'manager'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>Credit Cap: <strong className="text-gray-200">{member.creditLimit}</strong></span>
                      <span>Used: <strong className="text-gray-200">{member.creditsUsed}</strong></span>
                      <span
                        className={
                          member.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                        }
                      >
                        ● {member.status}
                      </span>
                    </div>
                  </div>

                  {/* Member controls */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={updatingMemberId === member.id}
                      onClick={() =>
                        handleUpdateMember(member.id, {
                          role: member.role === 'manager' ? 'member' : 'manager',
                        })
                      }
                      className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition cursor-pointer"
                      title="Toggle role between manager and member"
                    >
                      {member.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
                    </button>

                    <button
                      disabled={updatingMemberId === member.id}
                      onClick={() =>
                        handleUpdateMember(member.id, {
                          status: member.status === 'active' ? 'suspended' : 'active',
                        })
                      }
                      className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                        member.status === 'active'
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {member.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setMembersModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
