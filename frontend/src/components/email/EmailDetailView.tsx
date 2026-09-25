'use client';

import React from 'react';
import { Email } from '../../types/email';
import { ArrowLeft, Star, Archive, Trash2, ChevronDown, Paperclip, Clock, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

import { User } from '../../types/auth';

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
  onCancelSchedule?: (id: string) => void;
  currentUser?: User | null;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({
  email,
  onBack,
  onCancelSchedule,
  currentUser,
}) => {
  const isScheduled = email.status === 'scheduled' || email.status === 'rate_limited';
  const senderName =
    currentUser?.name ||
    (email.sender?.email && !email.sender.email.startsWith('outreach')
      ? email.sender.email.split('@')[0]
      : 'Oliver Brown');
  const senderEmail =
    currentUser?.email ||
    (email.sender?.email && !email.sender.email.includes('outreach@')
      ? email.sender.email
      : 'oliver.brown@domain.io');

  const formattedDate = email.sentAt
    ? new Date(email.sentAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : new Date(email.scheduledAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[600px] flex flex-col">
      {/* Top action bar matching Figma Image 4 */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate max-w-xs sm:max-w-xl">
            {email.subject || 'No Subject'}
          </h2>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {isScheduled && onCancelSchedule && (
            <button
              onClick={() => onCancelSchedule(email.id)}
              className="px-2.5 sm:px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              Cancel Send
            </button>
          )}

          <button className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-lg transition-colors">
            <Star className="h-4 w-4" />
          </button>
          <button className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
            <Archive className="h-4 w-4" />
          </button>
          <button className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Sender Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar initial */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#009A49] text-white font-bold text-sm shadow-sm">
            {senderName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">{senderName}</span>
              <span className="text-xs text-slate-400 truncate">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <span className="truncate">to {email.recipient}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50">
          <span className="text-xs text-slate-400">{formattedDate}</span>
          {email.status === 'sent' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="h-3 w-3" />
              <span>Delivered</span>
            </span>
          )}
          {email.status === 'scheduled' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/60">
              <Clock className="h-3 w-3" />
              <span>Scheduled in BullMQ</span>
            </span>
          )}
          {email.status === 'rate_limited' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700 border border-orange-200/60">
              <AlertTriangle className="h-3 w-3" />
              <span>Rate Limited / Rescheduled</span>
            </span>
          )}
        </div>
      </div>

      {/* Email Body matching Figma Image 4 */}
      <div className="p-4 sm:p-8 space-y-6 flex-1 text-slate-800 text-sm leading-relaxed whitespace-pre-line">
        <div>{email.body}</div>

        {/* Demo attachment mock cards matching Figma */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
            <Paperclip className="h-3.5 w-3.5" />
            <span>Outreach Attachments</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-full sm:w-auto flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 pr-4 text-xs hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                PDF
              </div>
              <div>
                <div className="font-semibold text-slate-800">Campaign_Overview.pdf</div>
                <div className="text-[10px] text-slate-400">1.2 MB</div>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 pr-4 text-xs hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                PNG
              </div>
              <div>
                <div className="font-semibold text-slate-800">Proposal_Preview.png</div>
                <div className="text-[10px] text-slate-400">840 KB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
