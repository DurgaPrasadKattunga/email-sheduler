'use client';

import React, { useState, useRef } from 'react';
import { emailService } from '../../services/email';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Upload,
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
  Sparkles,
  ArrowUpToLine,
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
  const [delayMs, setDelayMs] = useState<number | string>('00');
  const [hourlyLimit, setHourlyLimit] = useState<number | string>('00');
  const [startTime, setStartTime] = useState<string>('');
  const [showSendLater, setShowSendLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachmentsCount, setAttachmentsCount] = useState<number>(0);
  const [showAllRecipients, setShowAllRecipients] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse emails from raw string or CSV
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
        if (found.length > 0) {
          setRecipients((prev) => Array.from(new Set([...prev, ...found])));
          setAttachmentsCount(1);
        }
      }
    };
    reader.readAsText(file);
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

    let finalRecipients = [...recipients];
    if (rawInput.trim()) {
      const extra = parseEmails(rawInput);
      finalRecipients = Array.from(new Set([...finalRecipients, ...extra]));
    }

    if (finalRecipients.length === 0) {
      setError('Please provide recipient email(s) or click "Upload List".');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject line.');
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

  const displayedRecipients = showAllRecipients ? recipients : recipients.slice(0, 3);
  const hiddenCount = recipients.length - 3;

  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[600px] flex flex-col">
      {/* Top Header Bar matching Figma Images 5, 6, 7 */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Attachment Icon with badge matching Image 6 & 7 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Attach file / CSV leads"
          >
            <Paperclip className="h-4 w-4" />
            {attachmentsCount > 0 && (
              <span className="text-[11px] font-bold text-emerald-600">
                {attachmentsCount}
              </span>
            )}
          </button>

          {/* Clock / Schedule Icon */}
          <button
            type="button"
            onClick={() => setShowSendLater(!showSendLater)}
            className={`p-2 rounded-lg transition-colors relative ${
              showSendLater || startTime
                ? 'text-[#009A49] bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Schedule Date & Time"
          >
            <Clock className="h-4 w-4" />
            {startTime && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Primary Green "Send Later" Pill Button matching Figma Images 6 & 7 */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="rounded-full border border-[#009A49] bg-white hover:bg-[#009A49] text-[#009A49] hover:text-white px-3.5 sm:px-5 py-1.5 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send Later'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col">
        {/* From Field */}
        <div className="flex items-center gap-4 text-xs">
          <span className="w-12 text-slate-400 font-medium shrink-0">From</span>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#F3F4F6] px-3 py-1.5 font-medium text-slate-800 border border-slate-200/60">
            <span>{userEmail}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* To Field with "Upload List" button matching Images 6 & 7 */}
        <div className="flex items-start gap-4 text-xs border-b border-slate-100 pb-3">
          <span className="w-12 text-slate-400 font-medium shrink-0 pt-2">To</span>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {/* Recipient Chips matching Image 7 */}
            {displayedRecipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] border border-emerald-400/80 px-3 py-1 text-xs font-medium text-slate-800"
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

            {/* "+N" Count Pill matching Image 7 */}
            {recipients.length > 3 && !showAllRecipients && (
              <button
                type="button"
                onClick={() => setShowAllRecipients(true)}
                className="inline-flex items-center justify-center rounded-full bg-[#E6F4EA] border border-emerald-400/80 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-[#D9F2E0]"
              >
                +{hiddenCount}
              </button>
            )}

            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onKeyDown={handleAddManualRecipient}
              placeholder={recipients.length === 0 ? "recipient@example.com" : ""}
              className="flex-1 min-w-[150px] text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-1"
            />
          </div>

          {/* "Upload List" Link Button matching Images 6 & 7 */}
          <div className="shrink-0 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#009A49] hover:underline"
            >
              <ArrowUpToLine className="h-3.5 w-3.5" />
              <span>Upload List</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
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

        {/* Inline Throttling & Rate Limit Settings matching Figma */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 py-1">
          <div className="flex items-center gap-2">
            <span>Delay between 2 emails</span>
            <input
              type="text"
              value={delayMs}
              onChange={(e) => setDelayMs(e.target.value)}
              className="w-14 rounded-lg bg-[#F3F4F6] px-2 py-1 text-center font-mono font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Hourly Limit</span>
            <input
              type="text"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-14 rounded-lg bg-[#F3F4F6] px-2 py-1 text-center font-mono font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
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

        {/* Rich Formatting Toolbar matching Figma */}
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

        {/* Message Body Area */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type Your Reply..."
          rows={10}
          className="w-full flex-1 resize-none text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none leading-relaxed"
        />

        {/* Attached thumbnail preview matching Images 6 & 7 */}
        {attachmentsCount > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
              <div className="h-10 w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700 font-bold text-xs">
                CSV
              </div>
              <div>
                <div className="font-semibold text-slate-800">{recipients.length} Email Leads Detected</div>
                <div className="text-[10px] text-slate-400">Ready for BullMQ dispatch</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* "Send Later" Popover Modal */}
      {showSendLater && (
        <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:top-14 sm:right-6 sm:w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Send Later</h3>
            <button
              onClick={() => setShowSendLater(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

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
