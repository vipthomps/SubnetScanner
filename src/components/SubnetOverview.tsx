import React, { useMemo, useState } from 'react';
import { Device, NetworkEvent, HistoricalStat } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Award, Layers, Network, Clock, ListFilter, PlayCircle, ToggleLeft, Activity, Radio, Search } from 'lucide-react';

interface SubnetOverviewProps {
  devices: Device[];
  events: NetworkEvent[];
  historicalStats: HistoricalStat[];
  onTriggerScan: () => void;
  isScanning: boolean;
}

export default function SubnetOverview({
  devices,
  events,
  historicalStats,
  onTriggerScan,
  isScanning,
}: SubnetOverviewProps) {
  const [logSearch, setLogSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'online' | 'offline' | 'discovered'>('all');

  // Colors for Charting
  const CHART_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#fb7185', '#34d399', '#fdba74', '#94a3b8', '#a78bfa'];

  // 1. Process vendor distributions
  const vendorData = useMemo(() => {
    const counts: { [vendor: string]: number } = {};
    devices.forEach((d) => {
      const v = d.vendor || 'Unknown Vendor';
      counts[v] = (counts[v] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [devices]);

  // 2. Process IP Allocation Lease division (Static vs Dynamic DHCP)
  const allocationDistribution = useMemo(() => {
    let stat = 0;
    let dhcp = 0;
    devices.forEach((d) => {
      if (d.isStatic) stat++;
      else dhcp++;
    });
    return [
      { name: 'Static IP Hold', value: stat },
      { name: 'DHCP Dynamic', value: dhcp },
    ];
  }, [devices]);

  // 3. Filtered Log Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesSearch =
          evt.details.toLowerCase().includes(logSearch.toLowerCase()) ||
          evt.ip.toLowerCase().includes(logSearch.toLowerCase()) ||
          evt.hostname.toLowerCase().includes(logSearch.toLowerCase()) ||
          evt.mac.toLowerCase().includes(logSearch.toLowerCase());

        const matchesType =
          eventTypeFilter === 'all' ||
          (eventTypeFilter === 'online' && evt.type === 'online') ||
          (eventTypeFilter === 'offline' && evt.type === 'offline') ||
          (eventTypeFilter === 'discovered' && evt.type === 'discovered');

        return matchesSearch && matchesType;
      });
  }, [events, logSearch, eventTypeFilter]);

  return (
    <div className="space-y-6">
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Device Connection History - Over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-sans font-medium text-slate-100 flex items-center gap-2">
                <Clock className="text-indigo-400 w-4 h-4" />
                Connection History Timeline
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Daily active/inactive registration trends computed over the last 10 days of subnet sweeps.
              </p>
            </div>
            
            <button
              onClick={onTriggerScan}
              disabled={isScanning}
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 bg-sky-950/20 text-sky-400 border border-sky-950 hover:bg-sky-500 hover:text-slate-950 rounded transition ${
                isScanning ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Sweeping...' : 'Recalculate'}
            </button>
          </div>

          <div className="h-[260px] w-full mt-2 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historicalStats}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="onlineCount"
                  name="Active Online"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOnline)"
                />
                <Area
                  type="monotone"
                  dataKey="offlineCount"
                  name="Offline Registry"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorOffline)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Distribution Graphs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-sans font-medium text-slate-100 flex items-center gap-2 mb-1 pb-3 border-b border-slate-800">
            <Layers className="text-indigo-400 w-4 h-4" />
            Hardware Vendor & Allocation Divisions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            
            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2 block">
                Manufacturer Composition
              </span>
              <div className="h-[180px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {vendorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Simplified mini-legend to prevent overflow */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {vendorData.slice(0, 4).map((entry, idx) => (
                  <span key={entry.name} className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    ></span>
                    {entry.name.split(' ')[0]} ({entry.value})
                  </span>
                ))}
              </div>
            </div>

            {/* IP Allocations (Static vs DHCP) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2 block">
                IP Reservation Holds
              </span>
              <div className="h-[180px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationDistribution} margin={{ left: -30, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3341" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="value" name="Hosts" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      <Cell fill="#818cf8" />
                      <Cell fill="#k4befa" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] font-mono text-slate-400 text-center px-4 leading-normal mt-1">
                Static bindings prevent network IP overlapping for critical local systems.
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Network Change Log Logbook (ARP Sweep Log) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-sans font-medium text-slate-100 flex items-center gap-2">
              <Network className="text-indigo-400 w-4 h-4 animate-pulse" strokeWidth={2} />
              Chronological ARP Scan & Connection Logbook
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Audit trail showing connected device discoveries, DHCP releases, and ping losses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Lookup logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-7 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-slate-200 transition font-mono min-w-[150px]"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded">
              <button
                onClick={() => setEventTypeFilter('all')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded font-medium transition ${
                  eventTypeFilter === 'all' ? 'bg-slate-850 text-slate-200' : 'text-slate-500'
                }`}
              >
                All Checks
              </button>
              <button
                onClick={() => setEventTypeFilter('online')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded font-medium transition ${
                  eventTypeFilter === 'online' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' : 'text-slate-500'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setEventTypeFilter('offline')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded font-medium transition ${
                  eventTypeFilter === 'offline' ? 'bg-rose-950/80 text-rose-400 border border-rose-900/50' : 'text-slate-500'
                }`}
              >
                Loss
              </button>
              <button
                onClick={() => setEventTypeFilter('discovered')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded font-medium transition ${
                  eventTypeFilter === 'discovered' ? 'bg-sky-950/80 text-sky-400 border border-sky-900/50' : 'text-slate-500'
                }`}
              >
                Discovered
              </button>
            </div>
          </div>
        </div>

        {/* Console-style Event List */}
        <div id="log-monitor" className="bg-slate-950 rounded-lg p-3 max-h-[240px] overflow-y-auto border border-slate-850 font-mono text-[11px] divide-y divide-slate-900 leading-normal">
          {filteredEvents.length === 0 ? (
            <p className="text-slate-600 text-center py-8 italic">No scan trail found matching specific parameters.</p>
          ) : (
            filteredEvents.map((evt) => {
              const dateStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              const renderLogoBadge = () => {
                switch (evt.type) {
                  case 'online':
                    return <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900 px-1 py-0.5 rounded mr-2 uppercase text-[9px]">ONLINE</span>;
                  case 'offline':
                    return <span className="text-rose-400 font-bold bg-rose-950/40 border border-rose-900 px-1 py-0.5 rounded mr-2 uppercase text-[9px]">OFFLINE</span>;
                  case 'discovered':
                    return <span className="text-sky-300 font-bold bg-sky-950/40 border border-sky-900 px-1 py-0.5 rounded mr-2 uppercase text-[9px]">DISCOV</span>;
                  case 'scan_completed':
                    return <span className="text-amber-500 font-bold bg-amber-950/40 border border-amber-900 px-1 py-0.5 rounded mr-2 uppercase text-[9px]">SYS_SWEEP</span>;
                  default:
                    return <span className="text-slate-400 font-bold bg-slate-900 border border-slate-850 px-1 py-0.5 rounded mr-2 uppercase text-[9px]">LOG</span>;
                }
              };

              return (
                <div key={evt.id} className="py-2 flex flex-col sm:flex-row gap-2 hover:bg-slate-900/40 px-2 rounded group transition">
                  <span className="text-slate-500 min-w-[70px] select-none">[{dateStr}]</span>
                  <div className="flex-1">
                    {renderLogoBadge()}
                    <span className="text-slate-300">{evt.details}</span>

                    {/* Meta values */}
                    {(evt.ip || evt.mac) && (
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500 group-hover:text-slate-400">
                        {evt.ip && <span>IP: <strong className="text-slate-400">{evt.ip}</strong></span>}
                        {evt.mac && <span>MAC: <strong className="text-slate-400">{evt.mac}</strong></span>}
                        {evt.hostname && <span>Host: <strong className="text-slate-400">{evt.hostname}</strong></span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-slate-500 italic">
          <span>Syslog captures all ARP updates in the virtual browser network daemon.</span>
          <span>Logs loaded: {filteredEvents.length} transactions</span>
        </div>
      </div>

    </div>
  );
}
