'use client';

import React from 'react';
import { User } from '../../types/auth';
import { SlackConnectButton } from '../slack/SlackConnectButton';
import { Mail, LogOut, Activity, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  slackConnected: boolean;
  onSlackChange: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  slackConnected,
  onSlackChange,
}) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Mail className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">AutoMail</span>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                  BullMQ Persistent
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Distributed Outreach Scheduler</p>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Bull Board Link */}
          <a
            href={`${apiBaseUrl}/admin/queues`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all shadow-sm"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Bull Board</span>
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>

          {/* Slack Connect Button */}
          <SlackConnectButton isConnected={slackConnected} onStatusChange={onSlackChange} />

          {/* User profile */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full ring-2 ring-indigo-500/30 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 font-semibold text-xs ring-2 ring-indigo-500/30">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
