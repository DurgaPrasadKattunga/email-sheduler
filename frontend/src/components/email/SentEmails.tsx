'use client';

import React from 'react';
import { Email } from '../../types/email';
import { CheckCircle2, Star, Send } from 'lucide-react';

interface SentEmailsProps {
  emails: Email[];
  loading: boolean;
  onSelectEmail?: (email: Email) => void;
}

export const SentEmails: React.FC<SentEmailsProps> = ({ emails, loading, onSelectEmail }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mb-2" />
        <p className="text-xs text-slate-400">Loading sent history...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Sent Emails Yet</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Dispatched emails sent via Ethereal SMTP will appear here once workers process them.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
      {emails.map((email) => {
        const recipientDisplay = email.recipient.includes('@')
          ? email.recipient.split('@')[0]
          : email.recipient;

        return (
          <div
            key={email.id}
            onClick={() => onSelectEmail && onSelectEmail(email)}
            className="p-4 sm:px-6 sm:py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
          >
            {/* Top row on mobile / Left on desktop */}
            <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 sm:w-56 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-slate-400 font-normal">To:</span>
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {recipientDisplay}
                </span>
              </div>
              {/* Mobile-only badge */}
              <span className="sm:hidden inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[10px] font-medium text-slate-600 shrink-0 border border-slate-200/60">
                <span>Sent</span>
              </span>
            </div>

            {/* Middle: Desktop badge + Subject + Snippet */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-0.5 text-[11px] font-medium text-slate-600 shrink-0 border border-slate-200/60">
                <span>Sent</span>
              </span>

              <div className="truncate text-xs">
                <span className="font-semibold text-slate-900">{email.subject}</span>
                <span className="text-slate-400 mx-1.5">-</span>
                <span className="text-slate-500">{email.body.replace(/\n/g, ' ')}</span>
              </div>
            </div>

            {/* Right: Star */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-slate-300 hover:text-amber-400 transition-colors p-1"
              >
                <Star className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
