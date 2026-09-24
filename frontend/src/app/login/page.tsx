'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { Mail, Zap, Shield, Search, Slack, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleGoogleLogin = () => {
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  const handleDevLogin = async () => {
    try {
      setLoading(true);
      await authService.devLogin();
      router.push('/dashboard');
    } catch (err) {
      console.error('Dev login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <Mail className="h-7 w-7 text-indigo-400" />
            </div>
          </div>
        </div>

        <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          AutoMail Scheduler
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          Zero-Cron Distributed Email Outreach Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white">Welcome Back</h2>
            <p className="text-xs text-slate-400">Sign in to manage campaigns and monitor dispatch queues</p>
          </div>

          <div className="space-y-3">
            {/* Real Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs font-bold text-white hover:bg-slate-700 hover:border-slate-600 transition-all shadow-md group"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick Demo Login Button */}
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-xs font-bold text-white hover:from-indigo-500 hover:to-blue-500 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300" />
                  <span>One-Click Demo Access</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Core Architectural Guarantees
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Zero Cron Schedulers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>BullMQ + Redis Delayed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Elasticsearch Search</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Slack className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Slack Incident Alerts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
            ← Back to Architecture Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
