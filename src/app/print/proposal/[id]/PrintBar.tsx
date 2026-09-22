'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Download, FileSignature, Loader2, X } from 'lucide-react';

interface PrintBarProps {
  proposalId: string;
  businessName: string;
  initialStatus?: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

export default function PrintBar({
  proposalId,
  businessName,
  initialStatus = 'sent',
  acceptedAt: initialAcceptedAt,
  acceptedBy: initialAcceptedBy,
}: PrintBarProps) {
  const [status, setStatus] = useState(initialStatus);
  const [acceptedAt, setAcceptedAt] = useState(initialAcceptedAt);
  const [acceptedBy, setAcceptedBy] = useState(initialAcceptedBy);
  const [showModal, setShowModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAccepted = status === 'accepted';

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree || !signerName.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept proposal');
      }

      setStatus('accepted');
      setAcceptedAt(data.acceptedAt);
      setAcceptedBy(data.acceptedBy);
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#111827',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #374151',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
            Proposal for <span style={{ color: '#60a5fa' }}>{businessName}</span>
          </span>
          {isAccepted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={14} />
              Accepted {acceptedBy ? `by ${acceptedBy}` : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#374151',
              color: '#f3f4f6',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
          >
            <Download size={15} />
            Download PDF
          </button>

          {!isAccepted ? (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'background 0.2s',
              }}
            >
              <FileSignature size={15} />
              Accept & Sign Proposal
            </button>
          ) : (
            <div
              style={{
                color: '#9ca3af',
                fontSize: '12px',
                fontStyle: 'italic',
              }}
            >
              Digitally Accepted {acceptedAt ? `on ${new Date(acceptedAt).toLocaleDateString()}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Acceptance Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              border: '1px solid #374151',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f9fafb' }}>
                  Accept Proposal
                </h3>
                <p style={{ fontSize: '12.5px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                  Digitally approve services and pricing for {businessName}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Your Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #4b5563',
                    background: '#111827',
                    color: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="e.g. sarah@business.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #4b5563',
                    background: '#111827',
                    color: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Additional Notes or Project Kickoff Date (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ready to begin next Monday."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #4b5563',
                    background: '#111827',
                    color: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: 'rgba(55, 65, 81, 0.5)',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '4px',
                }}
              >
                <input
                  type="checkbox"
                  id="agree-checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="agree-checkbox"
                  style={{ fontSize: '12.5px', color: '#d1d5db', cursor: 'pointer', lineHeight: 1.4 }}
                >
                  I confirm that I am authorized to accept this proposal on behalf of <strong>{businessName}</strong> and agree to the scope and terms described.
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={!agree || !signerName.trim() || submitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: agree && signerName.trim() ? '#10b981' : '#4b5563',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: agree && signerName.trim() && !submitting ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Recording Signature...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm & Sign Proposal
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    color: '#9ca3af',
                    border: '1px solid #4b5563',
                    padding: '11px 18px',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
