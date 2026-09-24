'use client';

import React, { useState } from 'react';
import { emailService } from '../../services/email';
import { CsvUploader } from './CsvUploader';
import { Send, Clock, Gauge, Timer, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ComposeEmailProps {
  onSuccess: () => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ onSuccess }) => {
  const [subject, setSubject] = useState('Outreach: Next Generation Cloud Infrastructure');
  const [body, setBody] = useState(
    'Hi {{name}},\n\nWe wanted to introduce our new distributed email delivery platform with zero-cron BullMQ delayed queues.\n\nLet us know if you would like a demo!\n\nBest regards,\nThe AutoMail Team'
  );
  const [recipients, setRecipients] = useState<string[]>([]);
  const [startType, setStartType] = useState<'immediate' | 'custom'>('immediate');
  const [startTime, setStartTime] = useState<string>(
    new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!subject.trim()) {
      setError('Please provide an email subject');
      return;
    }
    if (!body.trim()) {
      setError('Please provide email body text');
      return;
    }
    if (recipients.length === 0) {
      setError('Please provide at least one recipient email address');
      return;
    }

    try {
      setLoading(true);
      const computedStartTime =
        startType === 'immediate'
          ? new Date().toISOString()
          : new Date(startTime).toISOString();

      const response = await emailService.schedule({
        subject,
        body,
        recipients,
        startTime: computedStartTime,
        delayMs: delaySeconds * 1000,
        hourlyLimit,
      });

      setSuccessMessage(
        `🎉 Successfully scheduled ${response.campaign?.totalRecipients || recipients.length} emails with BullMQ delayed jobs!`
      );
      setRecipients([]);
      onSuccess();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: { message?: string } } } };
      setError(
        errObj.response?.data?.error?.message || 'Failed to schedule email campaign. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotalTimeSec = recipients.length > 0 ? (recipients.length - 1) * delaySeconds : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-400" />
            <span>Compose & Schedule Campaign</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Zero-Cron delayed job outreach powered by BullMQ & Redis.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Partnership Inquiry"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Recipients / CSV Upload */}
        <CsvUploader recipients={recipients} onChange={setRecipients} />

        {/* Email Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">Message Body</label>
            <span className="text-[11px] text-slate-500 font-mono">Use {'{{name}}'} for template replacement</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Hi {{name}},&#10;&#10;Your message here..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed"
          />
        </div>

        {/* Scheduling Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Start Time</span>
            </label>
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 mb-2 text-[11px]">
              <button
                type="button"
                onClick={() => setStartType('immediate')}
                className={`flex-1 rounded py-1 font-medium transition-all ${
                  startType === 'immediate'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Immediate
              </button>
              <button
                type="button"
                onClick={() => setStartType('custom')}
                className={`flex-1 rounded py-1 font-medium transition-all ${
                  startType === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Future Date
              </button>
            </div>
            {startType === 'custom' && (
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Delay between emails */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-indigo-400" />
              <span>Delay Between Sends</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="300"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white text-center focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">seconds ({delaySeconds * 1000}ms)</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Enforces inter-email rate pacing</p>
          </div>

          {/* Hourly Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-indigo-400" />
              <span>Hourly Sending Limit</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white text-center focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">emails / hour</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Atomic Redis sliding counter</p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            {recipients.length > 0 ? (
              <span>
                Plan: <strong className="text-slate-200">{recipients.length} jobs</strong> spanning ~
                <strong className="text-slate-200">{estimatedTotalTimeSec}s</strong> with BullMQ delayed timers.
              </span>
            ) : (
              <span>Upload CSV or paste recipients to compute delivery timeline.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || recipients.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Enqueuing Jobs...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Schedule Campaign ({recipients.length})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
