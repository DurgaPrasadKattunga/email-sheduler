'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { ComposeEmail } from '../../components/email/ComposeEmail';
import { ScheduledEmails } from '../../components/email/ScheduledEmails';
import { SentEmails } from '../../components/email/SentEmails';
import { authService } from '../../services/auth';
import { emailService } from '../../services/email';
import { slackService } from '../../services/slack';
import { User } from '../../types/auth';
import { Email } from '../../types/email';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'sent' | 'campaigns'>('compose');

  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [campaigns, setCampaigns] = useState<unknown[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);

  // Parse token from URL if redirected from OAuth
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      localStorage.setItem('token', tokenParam);
      // Clean query parameter from URL
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

  // Fetch Campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await emailService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadUserAndStatus();
    fetchScheduled();
    fetchSent();
    fetchCampaigns();
  }, [loadUserAndStatus, fetchScheduled, fetchSent, fetchCampaigns]);

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

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleCampaignCreated = () => {
    fetchScheduled();
    fetchCampaigns();
    setActiveTab('scheduled');
  };

  // Metrics aggregation
  const rateLimitedCount = scheduledEmails.filter((e) => e.status === 'rate_limited').length;
  const activeScheduledCount = scheduledEmails.filter((e) => e.status === 'scheduled' || e.status === 'processing').length;
  const totalSentCount = sentEmails.filter((e) => e.status === 'sent').length;

  const displayScheduled = searchResults || scheduledEmails;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        slackConnected={slackConnected}
        onSlackChange={loadUserAndStatus}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome & Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Scheduled */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Scheduled Queue</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {activeScheduledCount}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">BullMQ delayed jobs</p>
          </div>

          {/* Stat 2: Sent */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Dispatched Emails</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {totalSentCount}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">Sent via Ethereal SMTP</p>
          </div>

          {/* Stat 3: Rate Limited */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Rate Limited</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {rateLimitedCount}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">Auto-rescheduled for next hour</p>
          </div>

          {/* Stat 4: Search & Index Status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Search Engine</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-bold text-slate-200">Elasticsearch 8.11</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">Full-text query active</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'compose'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Compose Campaign</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'scheduled'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Scheduled Queue ({scheduledEmails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Sent History ({sentEmails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Campaigns ({campaigns.length})</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'compose' && <ComposeEmail onSuccess={handleCampaignCreated} />}

        {activeTab === 'scheduled' && (
          <ScheduledEmails
            emails={displayScheduled}
            loading={loadingScheduled}
            onRefresh={fetchScheduled}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'sent' && (
          <SentEmails emails={sentEmails} loading={loadingSent} onRefresh={fetchSent} />
        )}

        {activeTab === 'campaigns' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>All Outreach Campaigns</span>
            </h2>
            {campaigns.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No campaigns created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">{camp.subject}</h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {camp.id}</p>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-indigo-400">
                        {camp.stats?.total || 0} emails
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                      <div>
                        <span className="text-slate-500">Scheduled:</span>{' '}
                        <strong className="text-indigo-400">{camp.stats?.scheduled || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Sent:</span>{' '}
                        <strong className="text-emerald-400">{camp.stats?.sent || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Rate Limited:</span>{' '}
                        <strong className="text-amber-400">{camp.stats?.rate_limited || 0}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span>Loading AutoMail Dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
