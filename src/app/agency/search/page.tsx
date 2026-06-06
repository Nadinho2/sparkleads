'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2, Globe, Star } from 'lucide-react';
import { Spinner } from '@/components/ui';
import type { Lead } from '@/types';

export default function AgencySearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<Lead[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !location.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} in ${location}`, location, radius: 50000, type: query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch { /* silent */ }
    setSearching(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Lead Search</h1>
      <p className="text-sm text-muted">Searches are shared with all team members.</p>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. restaurants, salons, gyms"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Location"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button onClick={handleSearch} disabled={searching || !query.trim() || !location.trim()} className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>

      {/* Results */}
      {searching && <div className="flex justify-center py-10"><Spinner size="lg" /></div>}

      {!searching && searched && results.length === 0 && (
        <div className="text-center py-10 text-muted">No results found.</div>
      )}

      {!searching && results.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {['Business', 'Address', 'Phone', 'Website', 'Rating'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((lead) => (
                <tr key={lead.place_id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{lead.name}</td>
                  <td className="px-4 py-3 text-sm text-muted truncate max-w-[200px]">{lead.address}</td>
                  <td className="px-4 py-3 text-sm text-muted">{lead.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1"><Globe size={12} />Visit</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {lead.rating ? <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" />{lead.rating}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
