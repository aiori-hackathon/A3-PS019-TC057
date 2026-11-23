import React from 'react';
import {
  LayoutDashboard,
  Database,
  SearchCode,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  LineChart,
  CheckSquare,
  Sliders,
  Shield,
  Activity
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'datasources'
  | 'scandata'
  | 'inventory'
  | 'purposeretention'
  | 'evidencegaps'
  | 'evaluation'
  | 'reviewcenter'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, backendHealthy }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasources', label: 'Data Sources', icon: Database },
    { id: 'scandata', label: 'Scan Data', icon: SearchCode },
    { id: 'inventory', label: 'Evidence Inventory', icon: FileSpreadsheet },
    { id: 'purposeretention', label: 'Purpose & Retention', icon: ShieldCheck },
    { id: 'evidencegaps', label: 'Evidence Gaps', icon: AlertTriangle },
    { id: 'evaluation', label: 'Evaluation & Accuracy', icon: LineChart },
    { id: 'reviewcenter', label: 'Review Center', icon: CheckSquare },
    { id: 'settings', label: 'Configurable Rules', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-[#042023] text-teal-100 flex flex-col shrink-0 border-r border-[#114449] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#114449] flex items-center space-x-3">
        <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-500">
          <img src="/logo.png" alt="PrivacyLens Logo" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            PrivacyLens
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-teal-900 text-teal-300 border border-teal-700">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-teal-400 font-medium">PII Discovery & Inventory</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-teal-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/40 font-semibold'
                  : 'text-teal-100 hover:bg-[#0b3336] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#114449] bg-[#021416]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Scanner Engine
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            backendHealthy
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {backendHealthy ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          AIORI PS-019 • Technical Evidence
        </p>
      </div>
    </aside>
  );
};
