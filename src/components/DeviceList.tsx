import React, { useState, useMemo } from 'react';
import { Device } from '../types';
import { Search, SlidersHorizontal, Edit2, Check, X, RefreshCw, Trash2, Cpu, Globe, ArrowUpDown, Calendar, HelpCircle } from 'lucide-react';

interface DeviceListProps {
  devices: Device[];
  onUpdateDevice: (updated: Device) => void;
  onDeleteDevice: (id: string) => void;
}

type FilterState = 'all' | 'online' | 'offline';
type SortKey = 'ip' | 'hostname' | 'vendor' | 'lastSeen';

export default function DeviceList({ devices, onUpdateDevice, onDeleteDevice }: DeviceListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterState>('all');
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'static' | 'dhcp'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('ip');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsStatic, setEditIsStatic] = useState(false);

  // Ping/Scan diagnostics feedback loaders
  const [diagnosticsState, setDiagnosticsState] = useState<{ [id: string]: 'idle' | 'pinging' | 'success' | 'failed' }>({});

  const handleStartEdit = (dev: Device) => {
    setEditingId(dev.id);
    setEditAlias(dev.alias);
    setEditNotes(dev.notes);
    setEditIsStatic(dev.isStatic);
  };

  const handleSaveEdit = (dev: Device) => {
    onUpdateDevice({
      ...dev,
      alias: editAlias,
      notes: editNotes,
      isStatic: editIsStatic,
    });
    setEditingId(null);
  };

  const triggerSimulatedPing = (dev: Device) => {
    setDiagnosticsState((prev) => ({ ...prev, [dev.id]: 'pinging' }));
    
    setTimeout(() => {
      // Simulate ARP response. Gateway and online nodes respond instantly. Offline nodes fail.
      const succeeded = dev.isOnline && Math.random() > 0.05; // 5% simulated packet loss
      setDiagnosticsState((prev) => ({
        ...prev,
        [dev.id]: succeeded ? 'success' : 'failed',
      }));

      // reset to idle after 3s
      setTimeout(() => {
        setDiagnosticsState((prev) => ({ ...prev, [dev.id]: 'idle' }));
      }, 3000);
    }, 1200);
  };

  // Helper to accurately sort IP addresses numerically (not just lexically)
  const compareIps = (ipA: string, ipB: string) => {
    const partsA = ipA.split('.').map(Number);
    const partsB = ipB.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      if (partsA[i] !== partsB[i]) {
        return partsA[i] - partsB[i];
      }
    }
    return 0;
  };

  // Filter and sort devices
  const processedDevices = useMemo(() => {
    return devices
      .filter((dev) => {
        const matchesSearch =
          dev.ip.toLowerCase().includes(search.toLowerCase()) ||
          dev.mac.toLowerCase().includes(search.toLowerCase()) ||
          dev.hostname.toLowerCase().includes(search.toLowerCase()) ||
          dev.alias.toLowerCase().includes(search.toLowerCase()) ||
          dev.vendor.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'online' && dev.isOnline) ||
          (statusFilter === 'offline' && !dev.isOnline);

        const matchesAlloc =
          allocationFilter === 'all' ||
          (allocationFilter === 'static' && dev.isStatic) ||
          (allocationFilter === 'dhcp' && !dev.isStatic);

        return matchesSearch && matchesStatus && matchesAlloc;
      })
      .sort((a, b) => {
        let valA: any = a[sortKey];
        let valB: any = b[sortKey];

        let result = 0;
        if (sortKey === 'ip') {
          result = compareIps(a.ip, b.ip);
        } else {
          valA = typeof valA === 'string' ? valA.toLowerCase() : valA;
          valB = typeof valB === 'string' ? valB.toLowerCase() : valB;
          if (valA < valB) result = -1;
          if (valA > valB) result = 1;
        }

        return sortOrder === 'asc' ? result : -result;
      });
  }, [devices, search, statusFilter, allocationFilter, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* List Filters & Actions Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search matching IP, MAC, hostname, custom alias, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 text-slate-200 transition"
          />
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition ${
                statusFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Registers
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition flex items-center gap-1 ${
                statusFilter === 'online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition flex items-center gap-1 ${
                statusFilter === 'offline' ? 'bg-slate-800/80 text-slate-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Offline
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setAllocationFilter('all')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition ${
                allocationFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Leases
            </button>
            <button
              onClick={() => setAllocationFilter('static')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition ${
                allocationFilter === 'static' ? 'bg-indigo-950 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Static IP
            </button>
            <button
              onClick={() => setAllocationFilter('dhcp')}
              className={`px-2.5 py-1 text-[10px] rounded font-medium transition ${
                allocationFilter === 'dhcp' ? 'bg-slate-800/80 text-slate-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DHCP
            </button>
          </div>
        </div>
      </div>

      {/* Network Hosts Grid List */}
      <div className="overflow-x-auto">
        <table id="device-registry-table" className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 hover:bg-slate-950/20 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4 font-normal">
                <button onClick={() => toggleSort('ip')} className="flex items-center gap-1 hover:text-slate-100 transition">
                  IP / MAC Address <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4 font-normal">
                <button onClick={() => toggleSort('hostname')} className="flex items-center gap-1 hover:text-slate-100 transition">
                  Hostname & Alias <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4 font-normal">
                <button onClick={() => toggleSort('vendor')} className="flex items-center gap-1 hover:text-slate-100 transition">
                  Hardware Vendor <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4 font-normal">
                <button onClick={() => toggleSort('lastSeen')} className="flex items-center gap-1 hover:text-slate-100 transition">
                  Seen Timestamp <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4 font-normal text-right">System Diagnostics & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60 text-xs">
            {processedDevices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="font-mono">No host terminals match filter queries.</p>
                    <p className="text-[11px] text-slate-600 mt-1">Try modifying the search term or resetting the online/offline filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedDevices.map((dev) => {
                const isEditing = editingId === dev.id;
                const diag = diagnosticsState[dev.id] || 'idle';

                return (
                  <tr key={dev.id} className="hover:bg-slate-950/40 group transition">
                    {/* IP / MAC */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                          <span className={`block w-2.5 h-2.5 rounded-full border border-slate-950 ${
                            dev.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'
                          }`} title={dev.isOnline ? 'Responsive' : 'Unresponsive'} />
                          {dev.ip}
                        </span>
                        <span className="text-[11px] text-slate-500 tracking-tight">{dev.mac}</span>
                      </div>
                    </td>

                    {/* Hostname & Alias */}
                    <td className="py-4 px-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 max-w-xs">
                          <input
                            type="text"
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            className="bg-slate-950 border border-slate-805 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                            placeholder="Alias name"
                          />
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="bg-slate-950 border border-slate-805 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500 italic text-[11px]"
                            placeholder="Add hardware description/notes..."
                          />
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono select-none">
                            <input
                              type="checkbox"
                              checked={editIsStatic}
                              onChange={(e) => setEditIsStatic(e.target.checked)}
                              className="accent-indigo-500"
                            />
                            Static Lease Hold
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 max-w-[240px]">
                          <span className="text-slate-100 font-semibold truncate-ellipsis" title={dev.alias}>
                            {dev.alias || <span className="text-slate-600 italic font-normal">Unassigned Alias</span>}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5" title={dev.hostname}>
                            <Globe className="w-3.5 h-3.5 text-slate-600" />
                            {dev.hostname || '-'}
                          </span>
                          {dev.notes && (
                            <span className="text-[10px] text-slate-500 italic max-w-full truncate block" title={dev.notes}>
                              {dev.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="py-4 px-4 text-slate-300 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-300">{dev.vendor || 'Generic Device'}</span>
                      </div>
                    </td>

                    {/* Seen Timestamp */}
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          Last: {new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-600 text-[10px]">
                          First: {new Date(dev.firstSeen).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Diagnostics Actions */}
                    <td className="py-4 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(dev)}
                            className="bg-emerald-950 text-emerald-300 border border-emerald-850 p-1.5 rounded-lg hover:bg-emerald-900 hover:text-emerald-100 transition"
                            title="Save Changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-slate-800 text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition"
                            title="Cancel Edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Ping diagnostic button */}
                          <button
                            onClick={() => triggerSimulatedPing(dev)}
                            disabled={diag === 'pinging'}
                            className={`p-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1 ${
                              diag === 'pinging'
                                ? 'bg-slate-850 border-slate-700 text-sky-400 animate-spin'
                                : diag === 'success'
                                ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                                : diag === 'failed'
                                ? 'bg-red-950 border-red-900 text-red-500'
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                            title="Run instant Ping/ARP diagnostic verification"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${diag === 'pinging' && 'animate-spin'}`} />
                            {diag === 'pinging' && 'Ping'}
                            {diag === 'success' && 'Reachable'}
                            {diag === 'failed' && 'Loss'}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleStartEdit(dev)}
                            className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 hover:border-slate-700 transition"
                            title="Edit Device Alias"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete registry item */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Release registration static hold for device at IP ${dev.ip}?`)) {
                                onDeleteDevice(dev.id);
                              }
                            }}
                            className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-950 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Drop host lease record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer statistics matching WatchYourLAN style attributes */}
      <div className="mt-4 pt-4 border-t border-slate-805 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Total Registered Entries: {devices.length} hosts</span>
        <span>Filtered Host Matches: {processedDevices.length} hosts</span>
        <span>Static allocation pools reservation count: {devices.filter((d) => d.isStatic).length}</span>
      </div>
    </div>
  );
}
