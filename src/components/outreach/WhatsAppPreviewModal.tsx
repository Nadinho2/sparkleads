'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  message: string;
  businessName: string;
  phone: string;
  source: 'proposal' | 'audit' | 'competitor';
  onSend: () => void;
  onEdit: (newMessage: string) => void;
  onClose: () => void;
}

export default function WhatsAppPreviewModal({
  isOpen,
  message,
  businessName,
  phone,
  source,
  onSend,
  onEdit,
  onClose,
}: WhatsAppPreviewModalProps) {
  const [editing, setEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  useEffect(() => {
    setEditedMessage(message);
    setEditing(false);
  }, [message, isOpen]);

  if (!isOpen) return null;

  const sourceLabel: Record<string, string> = {
    proposal: 'proposal',
    audit: 'audit report',
    competitor: 'competitor analysis',
  };

  function handleSend() {
    if (editing) {
      onEdit(editedMessage);
    }
    onSend();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-bold text-text">Send WhatsApp to {businessName}</h3>
            <p className="text-xs text-muted">{phone || 'No phone number'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface2 text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4">
          <div className="bg-[#005c4b] rounded-xl p-3 max-w-[85%] ml-auto">
            {editing ? (
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={5}
                className="w-full bg-transparent text-white text-sm resize-none focus:outline-none"
              />
            ) : (
              <p className="text-white text-sm whitespace-pre-line">{message}</p>
            )}
            <p className="text-[10px] text-green-200/60 text-right mt-1">9:41 AM</p>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted">
              {(editing ? editedMessage : message).length}/300 characters
            </span>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs text-primary hover:underline"
            >
              {editing ? 'Preview' : 'Edit message'}
            </button>
          </div>

          <div className="mt-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-muted">
              Generated from {sourceLabel[source]} report
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!phone}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            <ExternalLink size={16} />
            Send WhatsApp
            <span className="text-xs opacity-75">(1 credit)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
