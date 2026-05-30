'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Trash2,
  MessageCircle,
  Copy,
  ExternalLink,
  Zap,
  Lightbulb,
  Check,
} from 'lucide-react';
import { useSearchStream } from '@/hooks/useSearchStream';
import { Spinner } from '@/components/ui';
import type { Lead } from '@/types';

type LeadStatus = Lead['status'];

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'closed', label: 'Closed' },
  { value: 'not_interested', label: 'Not Interested' },
];

function generateSuggestions(query: string): string[] {
  const parts = query.trim().split(/\s+in\s+/i);
  if (parts.length < 2) return [];

  const businessType = parts[0].trim();
  const locationPart = parts[1].trim();
  const locationWords = locationPart.split(/[,\s]+/).filter(Boolean);
  const city = locationWords[0] || '';

  if (!city) return [];

  const cityLower = city.toLowerCase();

  const lagosAreas: Record<string, string[]> = {
    lagos: ['Lekki', 'Victoria Island', 'Ikeja', 'Ikoyi'],
    abuja: ['Wuse', 'Garki', 'Maitama', 'Jabi'],
    london: ['Shoreditch', 'Camden', 'Soho', 'Brixton'],
    nairobi: ['Westlands', 'Kilimani', 'CBD', 'Karen'],
    dubai: ['Downtown', 'Marina', 'JBR', 'Business Bay'],
    accra: ['Osu', 'Labone', 'Cantonments', 'Airport City'],
  };

  const areas = lagosAreas[cityLower];
  if (areas) {
    return areas.map((area) => `${businessType} in ${area}`);
  }

  return [
    `${businessType} in ${city} CBD`,
    `${businessType} in ${city} Downtown`,
    `${businessType} in ${city} Main Area`,
    `${businessType} near ${city}`,
  ];
}

export default function DashboardPage() {
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { leads, isSearching, error, search, reset } = useSearchStream({
    sessionId,
    isPaid: true,
  });

  useEffect(() => {
    let id = localStorage.getItem('sparkleads_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('sparkleads_session_id', id);
    }
    setSessionId(id);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;
    setCurrentQuery(query);
    setSuggestions([]);
    await search(query);
  }, [query, isSearching, search]);

  useEffect(() => {
    if (!isSearching && leads.length > 0 && currentQuery) {
      setSuggestions(generateSuggestions(currentQuery));
    }
  }, [isSearching, leads.length, currentQuery]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setCurrentQuery(suggestion);
      setSuggestions([]);
      search(suggestion);
    },
    [search]
  );

  const handleClear = useCallback(() => {
    reset();
    setQuery('');
    setCurrentQuery('');
    setSuggestions([]);
  }, [reset]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
    } catch {
      // Silent fail
    }
  }, []);

  const handleCopyPhone = useCallback(async (phone: string, leadId: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) return;

    try {
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, query: currentQuery }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkleads-${currentQuery.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  }, [leads, currentQuery]);

  const cleanPhone = (phone: string | null): string | null => {
    if (!phone) return null;
    return phone.replace(/[^+\d]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. restaurants in Lagos Nigeria"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isSearching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-6 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Spinner size="sm" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Results Header */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">
              Found {leads.length} businesses
            </span>
            {isSearching && <Spinner size="sm" className="text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-text hover:border-primary/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-danger hover:border-danger/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && !isSearching && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Lightbulb className="w-4 h-4" />
            Try:
          </span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-full border border-border bg-surface2 text-sm text-muted hover:text-text hover:border-primary/50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {leads.length === 0 && !isSearching && !currentQuery && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Start finding leads
          </h2>
          <p className="text-muted mb-6">
            Search for any business type in any city to get started
          </p>
          <p className="text-sm text-muted">
            Try:{' '}
            <button
              onClick={() => {
                setQuery('salons in Lagos Nigeria');
                search('salons in Lagos Nigeria');
                setCurrentQuery('salons in Lagos Nigeria');
              }}
              className="text-primary hover:underline"
            >
              salons in Lagos Nigeria
            </button>
          </p>
        </div>
      )}

      {/* Loading State */}
      {isSearching && leads.length === 0 && (
        <div className="text-center py-16">
          <Spinner size="lg" className="mx-auto mb-4 text-primary" />
          <p className="text-muted">Searching for businesses...</p>
        </div>
      )}

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Website
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-surface2/50 transition-colors animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <td className="py-3 px-4 text-sm text-muted">{i + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-text">
                      {lead.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {lead.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {lead.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {lead.website
                            .replace(/^https?:\/\/(www\.)?/, '')
                            .slice(0, 30)}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.rating ? (
                        <span className="text-warning">{lead.rating} ★</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(
                            lead.id,
                            e.target.value as LeadStatus
                          )
                        }
                        className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                      >
                        {statusOptions.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-surface text-text"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {lead.phone && cleanPhone(lead.phone) && (
                          <a
                            href={`https://wa.me/${cleanPhone(lead.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {lead.phone && (
                          <button
                            onClick={() =>
                              handleCopyPhone(lead.phone!, lead.id)
                            }
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Copy phone"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Visit website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && error !== 'free_limit_reached' && (
        <div className="text-center py-8">
          <p className="text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
