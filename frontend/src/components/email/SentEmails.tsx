'use client';

import React from 'react';
import { Email } from '../../types/email';
import { CheckCircle, AlertCircle, RefreshCw, Send, ExternalLink } from 'lucide-react';

interface SentEmailsProps {
  emails: Email[];
  loading: boolean;
  onRefresh: () => void;
}

export const SentEmails: React.FC<SentEmailsProps> = ({ emails, loading, onRefresh }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string, errorMessage?: string | null) => {
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          <span>Sent</span>
        </span>
      );
    }

    return (
      <span
        title={errorMessage || 'Sending failed'}
        className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20 cursor-help"
      >
        <AlertCircle className="h-3 w-3" />
        <span>Failed</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Sent History</span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {emails.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live record of emails dispatched via Nodemailer & Ethereal SMTP.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh History"
          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      {emails.length === 0 ? (
        <div className="py-12 text-center">
          <Send className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-300">No sent emails recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched emails will appear here once processed by workers</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Dispatched Time</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {emails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-200">{email.recipient}</td>
                  <td className="px-5 py-3.5 text-slate-300 max-w-[240px] truncate" title={email.subject}>
                    {email.subject}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                    {formatDate(email.sentAt || email.updatedAt)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{email.attempts}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(email.status, email.errorMessage)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <a
                      href="https://ethereal.email/messages"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                    >
                      <span>Ethereal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
