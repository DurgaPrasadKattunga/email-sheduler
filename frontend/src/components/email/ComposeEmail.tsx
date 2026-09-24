'use client';

import React, { useState } from 'react';
import { emailService } from '../../services/email';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Send,
  Upload,
  Sparkles,
  ChevronDown,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Undo,
  Redo,
  Calendar,
} from 'lucide-react';

interface ComposeEmailProps {
  onSuccess: () => void;
  onBack?: () => void;
  userEmail?: string;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({
  onSuccess,
  onBack,
  userEmail = 'oliver.brown@domain.io',
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [delayMs, setDelayMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [startTime, setStartTime] = useState<string>('');
  const [showSendLater, setShowSendLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse emails from raw string
  const parseEmails = (text: string) => {
    const regex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;
    const matches = text.match(regex) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase().trim())));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const found = parseEmails(content);
        setRecipients((prev) => Array.from(new Set([...prev, ...found])));
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sample = [
      'sarah.connor@cyberdyne.io',
      'john.wick@continental.org',
      'bruce.wayne@waynecorp.com',
      'clark.kent@dailyplanet.news',
      'tony.stark@starkindustries.com',
    ];
    setRecipients((prev) => Array.from(new Set([...prev, ...sample])));
  };

  const handleAddManualRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (!rawInput.trim()) return;
      const found = parseEmails(rawInput);
      if (found.length > 0) {
        setRecipients((prev) => Array.from(new Set([...prev, ...found])));
        setRawInput('');
      }
    }
  };

  const handlePresetTime = (preset: string) => {
    const now = new Date();
    if (preset === 'now') {
      setStartTime(now.toISOString().slice(0, 16));
    } else if (preset === '5m') {
      setStartTime(new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16));
    } else if (preset === 'tomorrow_10am') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setStartTime(tomorrow.toISOString().slice(0, 16));
    } else if (preset === 'tomorrow_11am') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      setStartTime(tomorrow.toISOString().slice(0, 16));
    } else if (preset === 'tomorrow_3pm') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);
      setStartTime(tomorrow.toISOString().slice(0, 16));
    }
    setShowSendLater(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Merge any pending raw input
    let finalRecipients = [...recipients];
    if (rawInput.trim()) {
      const extra = parseEmails(rawInput);
      finalRecipients = Array.from(new Set([...finalRecipients, ...extra]));
    }

    if (finalRecipients.length === 0) {
      setError('Please provide at least one recipient email or upload a CSV.');
      return;
    }

    if (!subject.trim()) {
      setError('Please provide a subject line.');
      return;
    }

    try {
      setLoading(true);
      await emailService.schedule({
        subject,
        body,
        recipients: finalRecipients,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        delayMs: Number(delayMs) || 2000,
        hourlyLimit: Number(hourlyLimit) || 100,
      });

      onSuccess();
    } catch (err: unknown) {
      const errMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message || 'Failed to schedule campaign'
          : 'Failed to schedule campaign';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[650px] flex flex-col">
      {/* Top Header Bar matching Image 5 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-base font-bold text-slate-900">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Attachment Icon */}
          <label className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Attach CSV leads or file">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Clock / Send Later trigger icon */}
          <button
            type="button"
            onClick={() => setShowSendLater(!showSendLater)}
            className={`p-2 rounded-lg transition-colors relative ${
              showSendLater || startTime
                ? 'text-[#009A49] bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Schedule / Send Later"
          >
            <Clock className="h-4 w-4" />
            {startTime && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Primary Green Send Button matching Image 5 */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-[#009A49] bg-white hover:bg-[#009A49] text-[#009A49] hover:text-white px-6 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Scheduling...</span>
            ) : (
              <>
                <span>{startTime ? 'Schedule' : 'Send'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* From Field */}
        <div className="flex items-center gap-4 text-xs">
          <span className="w-12 text-slate-400 font-medium shrink-0">From</span>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#F3F4F6] px-3 py-1.5 font-medium text-slate-800 border border-slate-200/60">
            <span>{userEmail}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* To / Recipients Field */}
        <div className="flex items-start gap-4 text-xs border-b border-slate-100 pb-3">
          <span className="w-12 text-slate-400 font-medium shrink-0 pt-2">To</span>
          <div className="flex-1 flex flex-wrap items-center gap-1.5">
            {recipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200/60"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => setRecipients(recipients.filter((e) => e !== email))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onKeyDown={handleAddManualRecipient}
              placeholder={recipients.length === 0 ? "recipient@example.com (or press Enter)" : "Add more..."}
              className="flex-1 min-w-[200px] text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-1.5"
            />

            <button
              type="button"
              onClick={handleLoadSample}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <Sparkles className="h-3 w-3" />
              <span>Load 5 Leads</span>
            </button>
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center gap-4 text-xs border-b border-slate-100 pb-3">
          <span className="w-12 text-slate-400 font-medium shrink-0">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        {/* Inline Throttling & Rate Limit Settings matching Image 5 */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 py-1">
          <div className="flex items-center gap-2">
            <span>Delay between 2 emails</span>
            <input
              type="number"
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              className="w-16 rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-center font-mono font-semibold text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400">ms</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Hourly Limit</span>
            <input
              type="number"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              className="w-16 rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-center font-mono font-semibold text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400">/hr</span>
          </div>

          {startTime && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] font-medium">
              <Clock className="h-3 w-3" />
              <span>Scheduled: {new Date(startTime).toLocaleString()}</span>
              <button
                type="button"
                onClick={() => setStartTime('')}
                className="text-emerald-500 hover:text-rose-600 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Rich Formatting Toolbar matching Image 5 */}
        <div className="flex items-center gap-1 py-2 px-1 border-t border-b border-slate-100 text-slate-500 text-xs">
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Undo"><Undo className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Redo"><Redo className="h-3.5 w-3.5" /></button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded font-bold text-slate-700" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded italic text-slate-700" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded underline text-slate-700" title="Underline"><Underline className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded line-through text-slate-700" title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Align"><AlignLeft className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Quote"><Quote className="h-3.5 w-3.5" /></button>
        </div>

        {/* Message Body Textarea */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type Your Reply... (Supports {{name}}, {{company}} variable tags)"
          rows={12}
          className="w-full flex-1 resize-none text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none leading-relaxed"
        />
      </div>

      {/* "Send Later" Popover Modal matching Image 5 */}
      {showSendLater && (
        <div className="absolute top-14 right-6 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Send Later</h3>
            <button
              onClick={() => setShowSendLater(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Custom Date & Time Picker */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
              Pick date & time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl bg-[#F3F4F6] px-3 py-2 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preset Shortcuts matching Image 5 */}
          <div className="space-y-1 pt-1 border-t border-slate-100 text-xs text-slate-700">
            <button
              type="button"
              onClick={() => handlePresetTime('now')}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              Immediate (Now)
            </button>
            <button
              type="button"
              onClick={() => handlePresetTime('5m')}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              In 5 minutes
            </button>
            <button
              type="button"
              onClick={() => handlePresetTime('tomorrow_10am')}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              Tomorrow, 10:00 AM
            </button>
            <button
              type="button"
              onClick={() => handlePresetTime('tomorrow_11am')}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              Tomorrow, 11:00 AM
            </button>
            <button
              type="button"
              onClick={() => handlePresetTime('tomorrow_3pm')}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              Tomorrow, 3:00 PM
            </button>
          </div>

          {/* Actions matching Image 5 */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSendLater(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowSendLater(false)}
              className="rounded-full border border-[#009A49] bg-white hover:bg-[#009A49] text-[#009A49] hover:text-white px-5 py-1 text-xs font-semibold transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
