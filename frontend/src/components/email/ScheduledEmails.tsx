'use client';

import React, { useState } from 'react';
import { Email } from '../../types/email';
import { emailService } from '../../services/email';
import { Clock, Search, RefreshCw, XCircle, AlertTriangle, Play, Sparkles } from 'lucide-react';

interface ScheduledEmailsProps {
  emails: Email[];
  loading: boolean;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({
  emails,
  loading,
  onRefresh,
  onSearch,
  searchQuery,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      setCancellingId(id);
      await emailService.cancelEmail(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel email', err);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
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
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
            <Clock className="h-3 w-3" />
            <span>Scheduled</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20 animate-pulse">
            <Play className="h-3 w-3" />
            <span>Processing</span>
          </span>
        );
      case 'rate_limited':
        return (
          <span
            title={errorMessage || 'Hourly limit exceeded. Rescheduled to next clock hour.'}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20 cursor-help"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Rate Limited</span>
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>Scheduled Queue</span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {emails.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">BullMQ persistent delayed jobs awaiting worker dispatch.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Elasticsearch Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search recipient, subject..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Queue"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {emails.length === 0 ? (
        <div className="py-12 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-300">No scheduled emails in queue</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {searchQuery
              ? 'Try changing your search keywords'
              : 'Compose a new campaign above to schedule emails'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Scheduled Time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
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
                    {formatDate(email.scheduledAt)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(email.status, email.errorMessage)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleCancel(email.id)}
                      disabled={cancellingId === email.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
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
