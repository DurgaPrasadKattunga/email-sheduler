'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Check, Users, Sparkles } from 'lucide-react';

interface CsvUploaderProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ recipients, onChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  const extractEmails = (text: string): string[] => {
    const regex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;
    const matches = text.match(regex) || [];
    const normalized = matches.map((e) => e.toLowerCase().trim());
    return Array.from(new Set([...recipients, ...normalized]));
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const extracted = extractEmails(content);
        onChange(extracted);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;
    const extracted = extractEmails(manualInput);
    onChange(extracted);
    setManualInput('');
  };

  const handleRemove = (emailToRemove: string) => {
    onChange(recipients.filter((e) => e !== emailToRemove));
  };

  const handleLoadSample = () => {
    const sample = [
      'sarah.connor@cyberdyne.io',
      'john.wick@continental.org',
      'bruce.wayne@waynecorp.com',
      'clark.kent@dailyplanet.news',
      'tony.stark@starkindustries.com',
      'peter.parker@dailybugle.nyc',
      'diana.prince@themyscira.gov',
      'barry.allen@star-labs.io',
    ];
    onChange(Array.from(new Set([...recipients, ...sample])));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <span>Recipients</span>
          {recipients.length > 0 && (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
              {recipients.length} detected
            </span>
          )}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>Load Sample CSV</span>
          </button>

          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              CSV File
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <Upload className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-300">
            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">CSV or plain text file containing email addresses</p>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste emails separated by commas, spaces, or newlines..."
            rows={3}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />
          <button
            type="button"
            onClick={handleManualAdd}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Extract & Add Emails
          </button>
        </div>
      )}

      {/* Recipient preview chips */}
      {recipients.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span>Extracted Email Queue ({recipients.length})</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-rose-400 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto pr-1">
            {recipients.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-slate-300"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(email)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
