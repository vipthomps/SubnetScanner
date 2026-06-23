import React from 'react';
import { Activity, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MetricCardsProps {
  activeCount: number;
  totalRegistered: number;
  availableOpenCount: number;
  utilizationRate: number;
}

export default function MetricCards({
  activeCount,
  totalRegistered,
  availableOpenCount,
  utilizationRate,
}: MetricCardsProps) {
  const offlineCount = totalRegistered - activeCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute right-4 top-4 bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Active Hosts</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2 font-mono">{activeCount}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400">ARP ping responsive</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute right-4 top-4 bg-slate-800 text-slate-400 p-2 rounded-lg">
          <Radio className="w-5 h-5" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Offline Holds</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2 font-mono">{offlineCount}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
          <span className="text-xs text-slate-400">Known but inactive</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute right-4 top-4 bg-blue-500/10 text-blue-400 p-2 rounded-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Open/Free IPs</p>
        <p className="text-3xl font-semibold text-sky-400 mt-2 font-mono">{availableOpenCount}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span className="text-xs text-sky-400">Available on subnet</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-500 p-2 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">IP Utilization</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2 font-mono">
          {utilizationRate.toFixed(1)}%
        </p>
        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
