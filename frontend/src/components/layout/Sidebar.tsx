import React from 'react';
import { Send, Clock, PlusCircle, Slack } from 'lucide-react';
import { cn } from '../../lib/utils';

export type TabType = 'compose' | 'scheduled' | 'sent';

export interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  slackConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  slackConnected,
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'compose', label: 'Compose & Schedule', icon: PlusCircle },
    { id: 'scheduled', label: 'Scheduled Queue', icon: Clock },
    { id: 'sent', label: 'Sent History', icon: Send },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 p-4 flex flex-col justify-between bg-[#0c101a]/50">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 mb-1">
          <Slack className="w-4 h-4 text-emerald-400" />
          <span>Slack Alert Status</span>
        </div>
        <p className="text-[11px] text-slate-400">
          {slackConnected ? 'Connected & active' : 'Not connected'}
        </p>
      </div>
    </aside>
  );
};
