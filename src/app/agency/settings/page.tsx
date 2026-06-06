'use client';

import { useState, useEffect } from 'react';
import { FREELANCER_TYPES } from '@/lib/freelancer-types';
import { Spinner } from '@/components/ui';

export default function AgencySettingsPage() {
  const [workspace, setWorkspace] = useState<{ name: string; brand_color: string } | null>(null);
  const [freelancerType, setFreelancerType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data.workspace);
      });
    const saved = localStorage.getItem('sparkleads_freelancer_type') || '';
    setFreelancerType(saved);
  }, []);

  const saveFreelancerType = async (typeId: string) => {
    setFreelancerType(typeId);
    localStorage.setItem('sparkleads_freelancer_type', typeId);
    setSaving(true);
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerType: typeId }),
      });
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Workspace Info */}
      {workspace && (
        <div className="p-6 rounded-xl border border-border bg-surface">
          <h2 className="text-lg font-semibold text-text mb-4">Workspace</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Name</p>
              <p className="text-sm font-medium text-text">{workspace.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Brand Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: workspace.brand_color }} />
                <span className="text-sm font-mono text-muted">{workspace.brand_color}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Type */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-2">Service Type</h2>
        <p className="text-xs text-muted mb-4">Pick your service type for opportunity scoring.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FREELANCER_TYPES.map((type) => (
            <button key={type.id} onClick={() => saveFreelancerType(type.id)} className={`p-4 rounded-xl border text-left transition-all ${freelancerType === type.id ? 'border-primary bg-primary/10' : 'border-border bg-surface2 hover:border-primary/50'}`}>
              <div className="text-2xl mb-2">{type.icon}</div>
              <p className="text-sm font-semibold text-text">{type.label}</p>
              <p className="text-xs text-muted mt-1">Shows {type.scoreLabel}</p>
            </button>
          ))}
        </div>
        {saving && <p className="text-xs text-muted mt-3 flex items-center gap-2"><Spinner size="sm" /> Saving...</p>}
      </div>
    </div>
  );
}
