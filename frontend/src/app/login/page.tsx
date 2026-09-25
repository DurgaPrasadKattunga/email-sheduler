'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleGoogleLogin = () => {
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  const handleDevLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      await authService.devLogin(email);
      router.push('/dashboard');
    } catch (err) {
      console.error('Dev login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.05)] p-8 sm:p-10 space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight">
          Login
        </h1>

        {/* Real Google Login Button matching Figma */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#E6F4EA] hover:bg-[#D9F2E0] px-4 py-3 text-sm font-medium text-slate-800 transition-all border border-emerald-100/60 shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
          <span>Login with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-[11px] text-slate-400 absolute font-normal">
            or sign up through email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleDevLogin} className="space-y-3.5">
          <div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Primary Green Login Button matching Figma */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009A49] hover:bg-[#00823E] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={handleDevLogin}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>One-Click Test / Demo Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
