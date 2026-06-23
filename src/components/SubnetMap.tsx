import React, { useState, useMemo } from 'react';
import { Device, SubnetConfig } from '../types';
import { Network, Clipboard, PlusCircle, CheckCircle, HelpCircle, Shield, Wifi, WifiOff } from 'lucide-react';

interface SubnetMapProps {
  devices: Device[];
  config: SubnetConfig;
  onAddDeviceAtIp: (ip: string) => void;
}

export default function SubnetMap({ devices, config, onAddDeviceAtIp }: SubnetMapProps) {
  const [selectedIpIndex, setSelectedIpIndex] = useState<number | null>(null);
  const [copiedRangeText, setCopiedRangeText] = useState(false);
  
  // Extract subnet base (e.g., '192.168.1.')
  const ipPrefix = useMemo(() => {
    const parts = config.subnet.split('/');
    const ipParts = parts[0].split('.');
    return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.`;
  }, [config.subnet]);

  // Construct map of suffix to device
  const ipMap = useMemo(() => {
    const map = new Map<number, Device>();
    devices.forEach((d) => {
      const parts = d.ip.split('.');
      const suffix = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(suffix)) {
        map.set(suffix, d);
      }
    });
    return map;
  }, [devices]);

  // Extract index representation of gateway IP
  const gatewaySuffix = useMemo(() => {
    const parts = config.gateway.split('.');
    return parseInt(parts[parts.length - 1], 10) || 1;
  }, [config.gateway]);

  // Extract index representation of DNS IP
  const dnsSuffix = useMemo(() => {
    const parts = config.dns.split('.');
    return parseInt(parts[parts.length - 1], 10) || 10;
  }, [config.dns]);

  // Calculate open (unassigned) IPs and continuous ranges
  const { openIps, openRanges } = useMemo(() => {
    const list: string[] = [];
    const ranges: { start: number; end: number }[] = [];
    let currentRange: { start: number; end: number } | null = null;

    for (let i = 1; i < 255; i++) {
      // Exclude gateway, dns, and any assigned devices
      const isAssigned = ipMap.has(i);
      const isGateway = i === gatewaySuffix;
      const isDns = i === dnsSuffix;

      if (!isAssigned && !isGateway && !isDns) {
        list.push(`${ipPrefix}${i}`);
        
        if (currentRange === null) {
          currentRange = { start: i, end: i };
        } else {
          currentRange.end = i;
        }
      } else {
        if (currentRange !== null) {
          ranges.push(currentRange);
          currentRange = null;
        }
      }
    }
    
    if (currentRange !== null) {
      ranges.push(currentRange);
    }

    return { openIps: list, openRanges: ranges };
  }, [ipMap, ipPrefix, gatewaySuffix, dnsSuffix]);

  const selectedIpString = selectedIpIndex !== null ? `${ipPrefix}${selectedIpIndex}` : '';
  const selectedDevice = selectedIpIndex !== null ? ipMap.get(selectedIpIndex) : null;
  const isSelectedSpecial = selectedIpIndex === 0 || selectedIpIndex === 255 || selectedIpIndex === gatewaySuffix || selectedIpIndex === dnsSuffix;

  const getIpStatus = (index: number) => {
    if (index === 0) return 'network_addr';
    if (index === 255) return 'broadcast_addr';
    if (index === gatewaySuffix) return 'gateway';
    if (index === dnsSuffix) return 'dns';

    const device = ipMap.get(index);
    if (!device) return 'open';
    return device.isOnline ? 'online' : 'offline';
  };

  const getStatusColorClass = (status: string, isSelected: boolean) => {
    const base = 'border transition-all duration-150 relative cursor-pointer flex items-center justify-center text-xs font-mono rounded ';
    const selectedRing = isSelected ? ' ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10 ' : ' hover:scale-105 hover:z-10 shadow-sm ';

    switch (status) {
      case 'network_addr':
      case 'broadcast_addr':
        return `${base} bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-slate-700/80 ${selectedRing}`;
      case 'gateway':
        return `${base} bg-indigo-950 border-indigo-700 text-indigo-200 hover:bg-indigo-900 ${selectedRing}`;
      case 'dns':
        return `${base} bg-violet-950 border-violet-700 text-violet-200 hover:bg-violet-900 ${selectedRing}`;
      case 'online':
        return `${base} bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse ${selectedRing}`;
      case 'offline':
        return `${base} bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 ${selectedRing}`;
      case 'open':
      default:
        return `${base} bg-slate-950/40 border-slate-850 hover:bg-slate-900 hover:border-slate-700 text-slate-600 hover:text-slate-100 ${selectedRing}`;
    }
  };

  const copyRangesToClipboard = () => {
    const text = openRanges
      .map((r) => r.start === r.end ? `${ipPrefix}${r.start}` : `${ipPrefix}${r.start} - ${ipPrefix}${r.end}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedRangeText(true);
    setTimeout(() => setCopiedRangeText(false), 2000);
  };

  const copySingleIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 16x16 Subnet Grid Visualizer */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-md font-sans font-medium text-slate-100 flex items-center gap-2">
              <Network className="w-5 h-5 text-sky-400" />
              Subnet Map Matrix <span className="text-xs font-mono text-slate-400 font-normal">({config.subnet})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Interactive 256-address matrix. Hover for address suffixes, click to explore node details or deploy new IP reservations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-950/80 border border-emerald-700 rounded text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Offline
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-indigo-950 border border-indigo-700 rounded text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Gateway
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-950 border border-slate-850 rounded text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span> Open IP
            </span>
          </div>
        </div>

        {/* 16x16 Grid */}
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 w-full aspect-square max-h-[500px] mx-auto select-none">
          {Array.from({ length: 256 }).map((_, i) => {
            const status = getIpStatus(i);
            const isSelected = selectedIpIndex === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedIpIndex(i)}
                className={getStatusColorClass(status, isSelected)}
                title={`${ipPrefix}${i} (${status})`}
              >
                {i}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <span>Row suffixes: Increments left-to-right from 0 to 255</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-sky-500">{openIps.length}</span> / 253 Host IPs Open
            </span>
            <span>IP Prefix: <span className="text-slate-100 font-semibold">{ipPrefix}*</span></span>
          </div>
        </div>
      </div>

      {/* Detail Sidebar / Provisioning Pane */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Dynamic Detail Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-sans font-semibold text-slate-100 pb-3 border-b border-slate-800 mb-4 uppercase tracking-wider font-mono">
              Node Details
            </h3>

            {selectedIpIndex === null ? (
              <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
                <HelpCircle className="w-10 h-10 text-slate-600 stroke-1 mb-2 animate-bounce" />
                <p className="text-sm text-slate-400">No Address Selected</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Select any grid square inside the subnet matrix to configure DHCP reservations or inspect connection states.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-mono text-sky-400">{selectedIpString}</span>
                  <button
                    onClick={() => copySingleIp(selectedIpString)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition"
                    title="Copy IP Address"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>

                {/* Subnet Matrix Node Details depending on role */}
                {selectedIpIndex === 0 && (
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800">
                    <p className="text-xs font-semibold text-indigo-400 font-mono mb-1">Network Base ID</p>
                    <p className="text-xs text-slate-400">
                      Standard CIDR host designation denoting the start boundary of the subnet routing block. Not assignable to physical adapter terminals.
                    </p>
                  </div>
                )}

                {selectedIpIndex === 255 && (
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800">
                    <p className="text-xs font-semibold text-pink-400 font-mono mb-1">Subnet Broadcast Address</p>
                    <p className="text-xs text-slate-400">
                      Delivers single packets destined for every node concurrently. Broadcast address for the standard `/24` subnet hierarchy.
                    </p>
                  </div>
                )}

                {selectedIpIndex === gatewaySuffix && (
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-indigo-900">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <p className="text-xs font-semibold text-indigo-400 font-mono">Gateway Interface</p>
                    </div>
                    {selectedDevice ? (
                      <div>
                        <p className="text-xs text-slate-200 font-semibold">{selectedDevice.alias || selectedDevice.hostname}</p>
                        <p className="text-[10px] text-slate-500 font-mono">MAC: {selectedDevice.mac}</p>
                        <p className="text-xs text-slate-400 mt-2">{selectedDevice.notes}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Configured default gateway route interface representing incoming and outgoing traffic headers.</p>
                    )}
                  </div>
                )}

                {selectedIpIndex === dnsSuffix && !selectedDevice && (
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-violet-900">
                    <p className="text-xs font-semibold text-violet-400 font-mono mb-1">Configured DNS Node</p>
                    <p className="text-xs text-slate-400">Default DNS resolving host for nameserver queries across elements connected inside the LAN container.</p>
                  </div>
                )}

                {!isSelectedSpecial && selectedDevice && (
                  <div className="space-y-3 bg-slate-950/80 border border-slate-850 rounded-lg p-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase">Registered Device</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        selectedDevice.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedDevice.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {selectedDevice.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-mono">Alias</span>
                        <span className="text-slate-200 font-semibold text-sm">{selectedDevice.alias || 'No Alias Set'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-mono">Hostname</span>
                          <span className="text-slate-200 font-mono break-all">{selectedDevice.hostname || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-mono">Vendor</span>
                          <span className="text-slate-200">{selectedDevice.vendor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-mono">MAC Address</span>
                        <span className="text-slate-300 font-mono">{selectedDevice.mac}</span>
                      </div>
                      {selectedDevice.notes && (
                        <div>
                          <span className="text-slate-500 block uppercase text-[9px] tracking-wider font-mono">Notes</span>
                          <span className="text-slate-400 italic text-[11px] block mt-0.5 leading-relaxed bg-slate-900/40 p-1.5 rounded border border-slate-900">{selectedDevice.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isSelectedSpecial && !selectedDevice && (
                  <div className="bg-slate-950/60 rounded-lg p-3.5 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 mb-3">
                      This IP address is completely <strong className="text-sky-400">Open & Available</strong> for assignment. No active network terminal claims it.
                    </p>
                    <button
                      onClick={() => onAddDeviceAtIp(selectedIpString)}
                      className="inline-flex items-center justify-center gap-1 text-xs text-sky-400 border border-sky-950 bg-sky-950/10 hover:bg-sky-500 hover:text-slate-950 px-3 py-1.5 rounded transition font-medium w-full"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Assign/Provision IP Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedIpIndex !== null && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Node Suffix #{selectedIpIndex}</span>
              <span>Available/Free: {selectedDevice || isSelectedSpecial ? 'No' : 'Yes'}</span>
            </div>
          )}
        </div>

        {/* Highlighted Open Range Blocks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Continuous Open Ranges
            </h3>
            <button
              onClick={copyRangesToClipboard}
              className="text-xs text-sky-400 hover:text-sky-300 hover:underline font-mono inline-flex items-center gap-1"
            >
              {copiedRangeText ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copiedRangeText ? 'Copied!' : 'Copy Ranges'}
            </button>
          </div>

          <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 font-mono">
            {openRanges.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-4">No open ranges. Subnet is fully utilized.</p>
            ) : (
              openRanges.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded border border-slate-850 hover:border-slate-800 transition">
                  <span className="text-xs text-sky-300">
                    {r.start === r.end ? `${ipPrefix}${r.start}` : `${ipPrefix}${r.start} - ${ipPrefix}${r.end}`}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                    {r.end - r.start + 1} Addresses Free
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-snug mt-3 italic">
            Continuous ranges are useful for carving out static IP segments or setting DHCP dynamic allocation pools.
          </p>
        </div>
      </div>
    </div>
  );
}
