'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export function WelcomeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [memberData, setMemberData] = useState<{
    name: string;
    role: string;
    credit_limit: number;
    workspaceName: string;
  } | null>(null);

  useEffect(() => {
    // Check if the new_member cookie is set
    const hasNewMemberCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sparkleads_new_member='));

    if (hasNewMemberCookie) {
      // Fetch member info from context API
      fetch('/api/account/context')
        .then((r) => r.json())
        .then((data) => {
          if (data.workspace) {
            setMemberData({
              name: data.member?.name || 'Team Member',
              role: data.member?.role || 'member',
              credit_limit: data.member?.credit_limit || 0,
              workspaceName: data.workspace.name || 'Agency',
            });
            setIsOpen(true);
          }
        })
        .catch(() => {
          // Still show the modal with default info
          setIsOpen(true);
        });
      // Remove the cookie
      document.cookie = 'sparkleads_new_member=; max-age=0; path=/';
    }
  }, []);

  if (!isOpen || !memberData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl border border-border p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setIsOpen(false)} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-text">
            Welcome to {memberData.workspaceName}!
          </h2>
          <p className="text-sm text-muted mt-2">
            You&apos;re all set. Here are your account details.
          </p>
        </div>

        <div className="rounded-xl bg-surface2 p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted">Your Name</span>
            <span className="text-sm font-medium text-text">{memberData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Role</span>
            <span className="text-sm font-medium text-text capitalize">{memberData.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Monthly Credits</span>
            <span className="text-sm font-medium text-text">
              {memberData.credit_limit === 0 ? 'Shared pool' : memberData.credit_limit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Workspace</span>
            <span className="text-sm font-medium text-text">{memberData.workspaceName}</span>
          </div>
        </div>

        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
          <p className="text-xs text-yellow-400">
            💡 Bookmark this page. Your session lasts 30 days. After that, ask your admin for a new invite link to log back in.
          </p>
        </div>

        <button
          onClick={() => {
            setIsOpen(false);
            router.refresh();
          }}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
        >
          Got it, let&apos;s go!
        </button>
      </div>
    </div>
  );
}
