'use client';

import React from 'react';
import { Email } from '../../types/email';
import { Clock, Star, AlertCircle, Sparkles } from 'lucide-react';

interface ScheduledEmailsProps {
  emails: Email[];
  loading: boolean;
  onCancel: (id: string) => Promise<void>;
  onSelectEmail?: (email: Email) => void;
}

export const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({
  emails,
  loading,
  onCancel,
  onSelectEmail,
}) => {
  const formatScheduledTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mb-2" />
        <p className="text-xs text-slate-400">Loading scheduled queue...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Scheduled Emails</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Your BullMQ queue is currently clear. Click &quot;Compose&quot; to schedule a new campaign.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
      {emails.map((email) => {
        const timeDisplay = formatScheduledTime(email.scheduledAt);
        const recipientDisplay = email.recipient.includes('@')
          ? email.recipient.split('@')[0]
          : email.recipient;

        return (
          <div
            key={email.id}
            onClick={() => onSelectEmail && onSelectEmail(email)}
            className="p-4 sm:px-6 sm:py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
          >
            {/* Top row on mobile / Left column on desktop: Recipient & Badge */}
            <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 sm:w-56 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-slate-400 font-normal">To:</span>
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {recipientDisplay}
                </span>
              </div>
              {/* Mobile-only time badge */}
              <span className="sm:hidden inline-flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2.5 py-0.5 text-[10px] font-medium text-[#D97706] shrink-0 border border-amber-200/50">
                <Clock className="h-2.5 w-2.5" />
                <span>{timeDisplay}</span>
              </span>
            </div>

            {/* Desktop badge & Subject + Body Snippet */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              {/* Desktop time badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E0] px-3 py-1 text-[11px] font-medium text-[#D97706] shrink-0 border border-amber-200/50">
                <Clock className="h-3 w-3" />
                <span>{timeDisplay}</span>
              </span>

              {/* Subject & Snippet */}
              <div className="truncate text-xs">
                <span className="font-semibold text-slate-900">{email.subject}</span>
                <span className="text-slate-400 mx-1.5">-</span>
                <span className="text-slate-500">{email.body.replace(/\n/g, ' ')}</span>
              </div>
            </div>

            {/* Actions / Cancel button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(email.id);
                }}
                className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded transition-all sm:opacity-0 sm:group-hover:opacity-100"
              >
                Cancel Send
              </button>
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
