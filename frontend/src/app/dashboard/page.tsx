'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScheduledEmails } from '../../components/email/ScheduledEmails';
import { SentEmails } from '../../components/email/SentEmails';
import { ComposeEmail } from '../../components/email/ComposeEmail';
import { EmailDetailView } from '../../components/email/EmailDetailView';
import { authService } from '../../services/auth';
import { emailService } from '../../services/email';
import { slackService } from '../../services/slack';
import { User } from '../../types/auth';
import { Email } from '../../types/email';
import {
  Clock,
  Send,
  Search,
  SlidersHorizontal,
  RotateCw,
  LogOut,
  ChevronDown,
  Activity,
  Slack,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent' | 'compose'>('scheduled');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Parse token from URL if redirected from OAuth
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      localStorage.setItem('token', tokenParam);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // Load User and Slack status
  const loadUserAndStatus = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);

    const slackStatus = await slackService.getStatus();
    setSlackConnected(slackStatus.connected);
  }, []);

  // Fetch Scheduled Emails
  const fetchScheduled = useCallback(async () => {
    try {
      setLoadingScheduled(true);
      const res = await emailService.getScheduled();
      setScheduledEmails(res.emails);
    } catch (err) {
      console.error('Failed to load scheduled emails', err);
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  // Fetch Sent Emails
  const fetchSent = useCallback(async () => {
    try {
      setLoadingSent(true);
      const res = await emailService.getSent();
      setSentEmails(res.emails);
    } catch (err) {
      console.error('Failed to load sent emails', err);
    } finally {
      setLoadingSent(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadUserAndStatus();
    fetchScheduled();
    fetchSent();
  }, [loadUserAndStatus, fetchScheduled, fetchSent]);

  // Handle Elasticsearch Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await emailService.search(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const handleCancelEmail = async (id: string) => {
    try {
      await emailService.cancelEmail(id);
      fetchScheduled();
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Cancel failed', err);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleCampaignScheduled = () => {
    fetchScheduled();
    fetchSent();
    setActiveTab('scheduled');
    setSelectedEmail(null);
  };

  const handleRefresh = () => {
    fetchScheduled();
    fetchSent();
  };

  const handleSlackConnect = () => {
    if (user?.id) {
      window.location.href = slackService.getConnectUrl(user.id);
    }
  };

  const handleSlackTestAlert = async () => {
    try {
      await slackService.sendTestAlert();
      alert('📢 Real Slack incident alert dispatched to your connected channel!');
    } catch (err) {
      alert('Please connect your Slack workspace first.');
    }
  };

  const displayScheduled = searchResults || scheduledEmails;
  const displaySent = searchResults || sentEmails;

  const currentUserName = user?.name || 'Oliver Brown';
  const currentUserEmail = user?.email || 'oliver.brown@domain.io';

  return (
    <div className="min-h-screen bg-white flex text-slate-900">
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR MATCHING FIGMA IMAGES 2 & 3              */}
      {/* ======================================================== */}
      <aside className="w-64 border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 bg-white">
        <div className="space-y-6">
          {/* Brand Logo "ONB" matching Figma */}
          <div className="px-2 pt-1">
            <Link href="/dashboard" className="text-2xl font-black tracking-tight text-slate-900">
              ONB
            </Link>
          </div>

          {/* User Profile Pill matching Figma */}
          <div className="relative">
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center justify-between p-2 rounded-xl bg-[#F3F4F6] border border-slate-200/60 cursor-pointer hover:bg-slate-200/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={currentUserName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUserName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUserName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {currentUserEmail}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>

            {/* Dropdown menu */}
            {showUserDropdown && (
              <div className="absolute top-14 left-0 w-full bg-white rounded-xl border border-slate-100 shadow-xl p-2 z-50 space-y-1">
                <button
                  onClick={handleSlackConnect}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Slack className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{slackConnected ? 'Slack: Connected' : 'Connect Slack'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Green Outline "Compose" Button matching Figma */}
          <button
            onClick={() => {
              setActiveTab('compose');
              setSelectedEmail(null);
            }}
            className="w-full rounded-xl border border-[#009A49] bg-white hover:bg-emerald-50 text-[#009A49] font-semibold py-2.5 text-xs shadow-sm transition-all text-center flex items-center justify-center gap-2"
          >
            <span>Compose</span>
          </button>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Core
            </div>

            {/* Scheduled Navigation Item */}
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'scheduled' && !selectedEmail
                  ? 'bg-[#E6F4EA] text-[#008744]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4" />
                <span>Scheduled</span>
              </div>
              <span className="text-[11px] font-bold">{scheduledEmails.length}</span>
            </button>

            {/* Sent Navigation Item */}
            <button
              onClick={() => {
                setActiveTab('sent');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sent' && !selectedEmail
                  ? 'bg-[#E6F4EA] text-[#008744]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="h-4 w-4" />
                <span>Sent</span>
              </div>
              <span className="text-[11px] font-bold">{sentEmails.length}</span>
            </button>
          </div>
        </div>

        {/* Bottom Sidebar Tools (Bull Board & Slack Incident Test) */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {/* Bull Board Quick Link */}
          <a
            href={`${apiBaseUrl}/admin/queues`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-50 border border-slate-200/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>Bull Board UI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live</span>
          </a>

          {/* Test Slack Alert Button */}
          {slackConnected && (
            <button
              onClick={handleSlackTestAlert}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Send Slack Test Alert</span>
            </button>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA MATCHING FIGMA                      */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Bar with Pill Search matching Figma */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          {/* Pill Search Input */}
          <div className="relative w-full max-w-lg">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search (Elasticsearch 8.11 full-text search)"
              className="w-full rounded-full bg-[#F3F4F6] pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent transition-all"
            />
          </div>

          {/* Header Action Icons matching Figma (Filter, Refresh) */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title="Refresh Queue"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title="Filter"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selectedEmail ? (
            /* Email Detail View matching Image 4 */
            <EmailDetailView
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onCancelSchedule={handleCancelEmail}
              currentUser={user}
            />
          ) : activeTab === 'compose' ? (
            /* Compose Email Form matching Image 5 */
            <ComposeEmail
              onSuccess={handleCampaignScheduled}
              onBack={() => setActiveTab('scheduled')}
              userEmail={currentUserEmail}
            />
          ) : activeTab === 'scheduled' ? (
            /* Scheduled Emails List matching Image 2 */
            <div className="space-y-4">
              {searchResults && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  Elasticsearch Results for &quot;{searchQuery}&quot; ({searchResults.length} matches)
                </div>
              )}
              <ScheduledEmails
                emails={displayScheduled}
                loading={loadingScheduled}
                onCancel={handleCancelEmail}
                onSelectEmail={(email) => setSelectedEmail(email)}
              />
            </div>
          ) : (
            /* Sent Emails List matching Image 3 */
            <div className="space-y-4">
              {searchResults && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  Elasticsearch Results for &quot;{searchQuery}&quot; ({searchResults.length} matches)
                </div>
              )}
              <SentEmails
                emails={displaySent}
                loading={loadingSent}
                onSelectEmail={(email) => setSelectedEmail(email)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Loading Onebox Dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
