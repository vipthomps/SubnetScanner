import React, { useState, useEffect, useMemo } from 'react';
import { Device, NetworkEvent, SubnetConfig, HistoricalStat } from './types';
import {
  INITIAL_DEVICES,
  INITIAL_EVENTS,
  HISTORICAL_STATS,
  DEFAULT_SUBNET_CONFIG,
  resolveVendorFromMac
} from './data/mockData';
import MetricCards from './components/MetricCards';
import SubnetMap from './components/SubnetMap';
import DeviceList from './components/DeviceList';
import SubnetOverview from './components/SubnetOverview';
import ConfigModal from './components/ConfigModal';
import {
  Network,
  Activity,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  BarChart3,
  List,
  Compass,
  Download,
  Terminal,
  Clock
} from 'lucide-react';

export default function App() {
  // Global States holding persistent data
  const [config, setConfig] = useState<SubnetConfig>(() => {
    const saved = localStorage.getItem('wyl_config');
    return saved ? JSON.parse(saved) : DEFAULT_SUBNET_CONFIG;
  });

  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('wyl_devices');
    return saved ? JSON.parse(saved) : INITIAL_DEVICES;
  });

  const [events, setEvents] = useState<NetworkEvent[]>(() => {
    const saved = localStorage.getItem('wyl_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [historicalStats, setHistoricalStats] = useState<HistoricalStat[]>(() => {
    const saved = localStorage.getItem('wyl_historical');
    return saved ? JSON.parse(saved) : HISTORICAL_STATS;
  });

  // UI Flow toggles
  const [activeTab, setActiveTab] = useState<'hosts' | 'matrix' | 'overview'>('hosts');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [prefilledIpForAdd, setPrefilledIpForAdd] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Save states to Local Storage on updates
  useEffect(() => {
    localStorage.setItem('wyl_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('wyl_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('wyl_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('wyl_historical', JSON.stringify(historicalStats));
  }, [historicalStats]);

  // Suffix parameters for IP Math
  const gatewaySuffix = useMemo(() => {
    const parts = config.gateway.split('.');
    return parseInt(parts[parts.length - 1], 10) || 1;
  }, [config.gateway]);

  const dnsSuffix = useMemo(() => {
    const parts = config.dns.split('.');
    return parseInt(parts[parts.length - 1], 10) || 10;
  }, [config.dns]);

  // Available Open/Free IP math
  const availableOpenCount = useMemo(() => {
    let count = 0;
    const registeredSuffixes = new Set<number>();
    
    devices.forEach((d) => {
      const parts = d.ip.split('.');
      const suffix = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(suffix)) {
        registeredSuffixes.add(suffix);
      }
    });

    // Loop through host addresses .1 to .254
    for (let i = 1; i < 255; i++) {
      if (i !== gatewaySuffix && i !== dnsSuffix && !registeredSuffixes.has(i)) {
        count++;
      }
    }
    return count;
  }, [devices, config, gatewaySuffix, dnsSuffix]);

  const activeCount = useMemo(() => {
    return devices.filter((d) => d.isOnline).length;
  }, [devices]);

  const utilizationRate = useMemo(() => {
    // 253 possible hosts (.1 to .254 minus gateway and dns index positions, so roughly 253 allocatable targets)
    const registeredCount = devices.length;
    return (registeredCount / 253) * 100;
  }, [devices]);

  // Execute a Simulated IP ARP Network sweep
  const triggerArpSweep = () => {
    if (isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      // Create clone copies to prevent state references leaking
      const updatedDevices = devices.map((dev) => {
        // Core gateway and static IPs shouldn't drop randomly to represent robust server connections
        if (dev.isStatic || dev.ip === config.gateway) {
          return { ...dev, isOnline: true, lastSeen: new Date().toISOString() };
        }

        // Simulating minor network state shifts (e.g. tablet goes offline/smartbulb recovers)
        const statusShiftChance = Math.random();
        let updatedOnlineState = dev.isOnline;

        if (statusShiftChance > 0.85) {
          // 15% chance to toggle state to show real connection dynamic change logs!
          updatedOnlineState = !dev.isOnline;
        }

        return {
          ...dev,
          isOnline: updatedOnlineState,
          lastSeen: updatedOnlineState ? new Date().toISOString() : dev.lastSeen,
        };
      });

      // Track any new connection/disconnection events
      const addedEvents: NetworkEvent[] = [];
      const timestamp = new Date().toISOString();

      devices.forEach((oldDev, idx) => {
        const newDev = updatedDevices[idx];
        if (oldDev.isOnline !== newDev.isOnline) {
          addedEvents.push({
            id: `evt_sweep_${Date.now()}_${idx}`,
            timestamp,
            type: newDev.isOnline ? 'online' : 'offline',
            ip: newDev.ip,
            hostname: newDev.hostname,
            mac: newDev.mac,
            details: `${newDev.alias || newDev.hostname} (IP: ${newDev.ip}) state transitioned to ${
              newDev.isOnline ? 'ONLINE (arp_sweep ping)' : 'OFFLINE (arp_sweep timeout)'
            }.`,
          });
        }
      });

      // Always append a sweep confirmation event
      addedEvents.push({
        id: `evt_summary_${Date.now()}`,
        timestamp,
        type: 'scan_completed',
        ip: '',
        hostname: '',
        mac: '',
        details: `Subnet sweep completed on ${config.subnet}. Identified ${
          updatedDevices.filter((d) => d.isOnline).length
        } active network terminals.`,
      });

      setDevices(updatedDevices);
      setEvents((prev) => [ ...addedEvents, ...prev ].slice(0, 100)); // cap at 100 logs
      
      // Update historical trend line on map recalculations
      setHistoricalStats((prev) => {
        const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
        // update todays stats or append new one
        const activeCountLatest = updatedDevices.filter((d) => d.isOnline).length;
        const offlineCountLatest = updatedDevices.length - activeCountLatest;

        const filtered = prev.filter((stat) => stat.date !== dateStr);
        return [ ...filtered, { date: dateStr, onlineCount: activeCountLatest, offlineCount: offlineCountLatest } ].slice(-10);
      });

      setIsScanning(false);
      setLastScanTime(new Date().toLocaleTimeString());
    }, 1500);
  };

  // Auto-scanning daemon effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (config.autoScan) {
      // In production we scan every X minutes, but to offer a beautiful interactive speed,
      // we poll every 45s if autoScan is checked.
      timer = setInterval(() => {
        triggerArpSweep();
      }, 45000);
    }
    return () => clearInterval(timer);
  }, [config.autoScan, devices, config.subnet]);

  // Host modification routines
  const handleUpdateDevice = (updated: Device) => {
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    
    // Log explicit alias or host update
    const updateEvent: NetworkEvent = {
      id: `evt_update_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: updated.isOnline ? 'online' : 'offline',
      ip: updated.ip,
      hostname: updated.hostname,
      mac: updated.mac,
      details: `Host properties updated: Named ${updated.alias} with lease hold static: ${updated.isStatic}.`,
    };
    setEvents((prev) => [updateEvent, ...prev].slice(0, 100));
  };

  const handleDeleteDevice = (id: string) => {
    const target = devices.find((d) => d.id === id);
    if (!target) return;

    setDevices((prev) => prev.filter((d) => d.id !== id));

    // Log deletion lease release
    const releaseEvent: NetworkEvent = {
      id: `evt_delete_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'offline',
      ip: target.ip,
      hostname: target.hostname,
      mac: target.mac,
      details: `IP Reservation Lease released. Host terminal ${target.alias || target.hostname} removed from registry holding.`,
    };
    setEvents((prev) => [releaseEvent, ...prev].slice(0, 100));
  };

  const handleAddDevice = (newDev: Omit<Device, 'id' | 'connectionHistory'>) => {
    // Prevent duplicate IPs
    if (devices.some((d) => d.ip === newDev.ip)) {
      alert(`An IP allocation hold already exists for address ${newDev.ip}. Release current registration hold first.`);
      return;
    }

    const deviceObj: Device = {
      ...newDev,
      id: `dev_cust_${Date.now()}`,
      connectionHistory: [{ timestamp: new Date().toISOString(), status: newDev.isOnline ? 'online' : 'offline' }],
    };

    setDevices((prev) => [ ...prev, deviceObj ].sort((a,b) => {
      const partsA = a.ip.split('.').map(Number);
      const partsB = b.ip.split('.').map(Number);
      for (let i = 0; i < 4; i++) {
        if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i];
      }
      return 0;
    }));

    // Log discovery
    const additionEvent: NetworkEvent = {
      id: `evt_add_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'discovered',
      ip: deviceObj.ip,
      hostname: deviceObj.hostname,
      mac: deviceObj.mac,
      details: `New Host Connection registered: Alias ${deviceObj.alias || 'unassigned'} (${deviceObj.vendor}) deployed to IP ${deviceObj.ip}.`,
    };
    setEvents((prev) => [additionEvent, ...prev].slice(0, 100));
  };

  const handleDeployNewIpReservation = (ip: string) => {
    setPrefilledIpForAdd(ip);
    setIsConfigOpen(true);
  };

  // Export full mapping to JSON file
  const handleExportJSON = () => {
    const backupData = { config, devices, events, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subnet_registry_watchyourlan_${Math.floor(Date.now() / 1000)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar - High Density Custom theme spacing */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-950 shrink-0">
        <div className="p-5 flex flex-col h-full">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">WL</div>
            <div>
              <span className="font-semibold tracking-tight text-md text-white block">WatchYourLAN</span>
              <span className="text-[10px] font-mono text-indigo-400">NETWORK DAEMON</span>
            </div>
          </div>

          {/* Interactive Navigation mapped to tabs */}
          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-left ${
                activeTab === 'matrix'
                  ? 'bg-slate-800 text-white border border-slate-750'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-250 border border-transparent'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-400 font-bold" />
              Available IP Map
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-left ${
                activeTab === 'hosts'
                  ? 'bg-slate-800 text-white border border-slate-750'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-250 border border-transparent'
              }`}
            >
              <List className="w-4 h-4 text-indigo-400" />
              Device Lease Holds
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-left ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white border border-slate-750'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-250 border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Overview & Logs
            </button>
          </nav>

          {/* Bottom active sweeper status indicator */}
          <div className="mt-auto pt-4 border-t border-slate-900 text-left">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-bold italic">
              {isScanning ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  ARP SWEEP ACTIVE
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  SUBNET SCAN ACTIVE
                </>
              )}
            </div>
            
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${isScanning ? 'bg-amber-500 w-[50%] animate-pulse' : 'bg-emerald-500 w-[100%]'}`}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>{config.subnet.split('/')[0]}</span>
              <span>{isScanning ? 'Scanning 50%' : '100% Checked'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto h-screen">
        {/* Header Bar */}
        <header className="h-20 sm:h-16 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md shrink-0 py-3 gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {config.subnet}
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-900 px-1 py-0.5 rounded">
                LAN
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Gateway Route: {config.gateway} | Primary DNS: {config.dns} | Auto Check: {config.autoScan ? `${config.scanInterval}m` : 'Off'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action buttons matching high density feel */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={triggerArpSweep}
                disabled={isScanning}
                className={`cursor-pointer bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  isScanning ? 'opacity-40 cursor-not-allowed animate-pulse' : ''
                }`}
                title="Force system ARP/Ping discovery sweep"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isScanning ? 'animate-spin' : ''}`} />
                Sweeper Setup
              </button>

              <button
                onClick={() => {
                  setPrefilledIpForAdd('');
                  setIsConfigOpen(true);
                }}
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Reserve IP
              </button>

              <button
                onClick={() => setIsConfigOpen(true)}
                className="cursor-pointer bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 p-1.5 rounded transition"
                title="Configure Subnet Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col items-end border-l border-slate-800 pl-3">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Daemon Hub</span>
              <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`}></span> 
                {isScanning ? 'Scanning...' : 'Monitoring'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Metric Cards Component integrated gracefully */}
        <div className="p-6 pb-0 shrink-0">
          <MetricCards
            activeCount={activeCount}
            totalRegistered={devices.length}
            availableOpenCount={availableOpenCount}
            utilizationRate={utilizationRate}
          />
        </div>

        {/* Primary Dashboard Content Area */}
        <div className="p-6 pt-2 flex-1 min-h-0">
          {activeTab === 'hosts' && (
            <DeviceList
              devices={devices}
              onUpdateDevice={handleUpdateDevice}
              onDeleteDevice={handleDeleteDevice}
            />
          )}

          {activeTab === 'matrix' && (
            <SubnetMap
              devices={devices}
              config={config}
              onAddDeviceAtIp={handleDeployNewIpReservation}
            />
          )}

          {activeTab === 'overview' && (
            <SubnetOverview
              devices={devices}
              events={events}
              historicalStats={historicalStats}
              onTriggerScan={triggerArpSweep}
              isScanning={isScanning}
            />
          )}
        </div>

        {/* Glass Status Bar Footer */}
        <footer className="h-8 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-mono text-slate-600 shrink-0">
          <div className="flex gap-6">
            <span>NODE: V-THOMPS-WYL-01</span>
            <span>LATENCY: 4ms</span>
            <span>LAST SCAN: {lastScanTime}</span>
            <span className="text-emerald-800 font-bold uppercase tracking-widest hidden sm:inline">SYSTEM SECURE</span>
          </div>
          <div>VERSION 2.4.1-STABLE</div>
        </footer>
      </main>

      {/* Config Panel and Device Reservation hold popup modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => {
          setIsConfigOpen(false);
          setPrefilledIpForAdd('');
        }}
        config={config}
        onSaveConfig={setConfig}
        onAddDevice={handleAddDevice}
        prefilledIp={prefilledIpForAdd}
      />
    </div>
  );
}
