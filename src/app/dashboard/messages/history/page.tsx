'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Copy, ExternalLink, MessageSquare,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface HistoryMessage {
  id: string;
  message_type: string;
  subject: string | null;
  body: string;
  used: boolean;
  sent: boolean;
  created_at: string;
  leads: {
    name: string;
    type: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export default function MessageHistoryPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        if (filter === 'whatsapp' || filter === 'email') {
          params.set('type', filter);
        } else {
          params.set('status', filter);
        }
      }
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/messages?${params}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  function openWhatsApp(phone: string, message: string) {
    const clean = phone?.replace(/[^0-9+]/g, '') || '';
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function openEmail(email: string, subject: string, body: string) {
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  const filteredMessages = messages.filter((m) => {
    if (!search.trim()) return true;
    const name = m.leads?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/messages')}
          className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Message History</h1>
          <p className="text-sm text-muted">All your AI-generated messages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'whatsapp', 'email', 'used', 'unused', 'sent'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-surface2 text-muted border border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Messages Table */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted">Loading messages...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-surface/50">
          <MessageSquare className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">No messages found</p>
          <p className="text-xs text-muted">Generate some messages from the AI Message Writer</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Business</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Preview</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => {
                const isExpanded = expandedId === msg.id;
                return (
                  <>
                    <tr
                      key={msg.id}
                      className="border-b border-border/50 hover:bg-surface2/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-text">
                        {msg.leads?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          msg.message_type === 'whatsapp'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {msg.message_type === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted max-w-[200px] truncate">
                        {msg.body?.slice(0, 60)}...
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {msg.used && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Used</span>}
                          {msg.sent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Sent</span>}
                          {!msg.used && !msg.sent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface2 text-muted">New</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${msg.id}-expanded`} className="bg-surface2/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                            <div>
                              <p className="text-xs text-muted mb-1">
                                {msg.leads?.type} · {msg.leads?.address}
                              </p>
                            </div>

                            {msg.subject && (
                              <div>
                                <p className="text-xs font-medium text-muted mb-0.5">Subject:</p>
                                <p className="text-sm text-text">{msg.subject}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-medium text-muted mb-1">Message:</p>
                              <p className="text-sm text-text whitespace-pre-line p-3 rounded-lg bg-surface2 border border-border">
                                {msg.body}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); copyText(msg.body); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 text-text text-xs border border-border hover:bg-surface"
                              >
                                <Copy size={12} /> Copy
                              </button>
                              {msg.message_type === 'whatsapp' && msg.leads?.phone && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openWhatsApp(msg.leads!.phone!, msg.body); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-500"
                                >
                                  <ExternalLink size={12} /> Send WhatsApp
                                </button>
                              )}
                              {msg.message_type === 'email' && msg.leads?.email && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEmail(msg.leads!.email!, msg.subject || '', msg.body); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-500"
                                >
                                  <ExternalLink size={12} /> Send Email
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
