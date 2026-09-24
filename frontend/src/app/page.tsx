import Link from 'next/link';
import { Mail, ShieldCheck, Zap, Database, Search, Bell, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#0a0d14]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AutoMail Scheduler
              </span>
              <span className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                v1.0 (Phase 1 Ready)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="http://localhost:5000/health"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1.5 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Backend API Health</span>
            </a>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>BullMQ Delayed Queue &bull; PostgreSQL &bull; Redis &bull; Elasticsearch</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Production-Grade <br />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            Distributed Email Job Scheduler
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 leading-relaxed">
          Mini email outreach scheduler designed with zero cron dependencies. Powered by Redis-backed BullMQ delayed jobs, atomic rate limiters, multi-worker concurrency, and real-time Slack incident notifications.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <span>Launch Dashboard / Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:5000/health"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-medium border border-slate-700/80 transition-all flex items-center space-x-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Verify GET /health</span>
          </a>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">BullMQ Delayed Jobs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strictly no cron jobs. Redis-backed BullMQ persistent queues survive server restarts without losing scheduled emails.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Atomic Rate Limiting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Shared Redis rate limits with automatic job rescheduling when hourly limits are reached across concurrent workers.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Elasticsearch & Slack</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant full-text searching across recipients, subjects, and statuses alongside real Slack webhook alerts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Full-Stack Email Job Scheduler &bull; Phase 1 Initialized &bull; Ready for Phase 2</p>
      </footer>
    </main>
  );
}
