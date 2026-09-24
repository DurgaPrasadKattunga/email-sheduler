import Link from 'next/link';
import { Mail, ArrowRight, Clock, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-white text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              ONB
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ReachInbox Scheduler
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#009A49] hover:bg-[#00823E] text-white shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section matching Figma palette */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>BullMQ Zero-Cron Architecture &bull; PostgreSQL &bull; Upstash Redis</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Production-Grade <br />
          <span className="text-[#009A49]">
            Distributed Email Job Scheduler
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base text-slate-500 mb-8 leading-relaxed">
          High-throughput email outreach scheduling platform built to Figma specifications with BullMQ delayed queues, Redis Lua rate limiting, atomic CAS idempotency, and Elasticsearch 8.11 full-text search.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-[#009A49] hover:bg-[#00823E] text-white font-semibold shadow-sm flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <span>Open Dashboard / Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 transition-all flex items-center space-x-2 shadow-sm"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>View Scheduled Queue</span>
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Zero-Cron Persistent Queues</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              BullMQ delayed jobs in Redis sorted sets. Survives full server crashes and restarts without re-sending or dropping jobs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Atomic Lua Rate Limiting</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enforces hourly quotas and inter-send delays with automatic rescheduling to the next hour window.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Elasticsearch & Slack Bridge</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-match fuzzy search queries with field boosting alongside real-time Slack OAuth 2.0 incident alerts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>AutoMail Onebox &bull; Outbox Labs ReachInbox Hiring Assignment</p>
      </footer>
    </main>
  );
}
