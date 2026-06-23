import React, { useState, useEffect } from 'react';
import { SubnetConfig, Device } from '../types';
import { resolveVendorFromMac } from '../data/mockData';
import { Settings, Plus, Network, Cpu, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SubnetConfig;
  onSaveConfig: (cfg: SubnetConfig) => void;
  onAddDevice: (dev: Omit<Device, 'id' | 'connectionHistory'>) => void;
  prefilledIp?: string;
}

export default function ConfigModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onAddDevice,
  prefilledIp = '',
}: ConfigModalProps) {
  // Config form state
  const [subnetInput, setSubnetInput] = useState(config.subnet);
  const [gatewayInput, setGatewayInput] = useState(config.gateway);
  const [dnsInput, setDnsInput] = useState(config.dns);
  const [scanIntervalInput, setScanIntervalInput] = useState(config.scanInterval);
  const [autoScanInput, setAutoScanInput] = useState(config.autoScan);

  // Device registration form state
  const [devIp, setDevIp] = useState(prefilledIp);
  const [devMac, setDevMac] = useState('');
  const [devHostname, setDevHostname] = useState('');
  const [devAlias, setDevAlias] = useState('');
  const [devNotes, setDevNotes] = useState('');
  const [devIsStatic, setDevIsStatic] = useState(false);
  const [devIsOnline, setDevIsOnline] = useState(true);

  // Sync prefilled IP
  useEffect(() => {
    if (prefilledIp) {
      setDevIp(prefilledIp);
      // Auto-generate MAC on select IP to make user experience fast and satisfying
      generateRandomMac();
    }
  }, [prefilledIp]);

  const generateRandomMac = () => {
    // Standard random vendor prefixes (like Apple c0:56:27 or Pi b8:27:eb)
    const prefixes = ['c0:56:27', 'b8:27:eb', '18:31:bf', 'cc:50:e3', '1c:fe:34'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    const genHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const fullMac = `${randomPrefix}:${genHex()}:${genHex()}:${genHex()}`;
    setDevMac(fullMac);
  };

  const handleSaveNetworkConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      subnet: subnetInput,
      gateway: gatewayInput,
      dns: dnsInput,
      scanInterval: scanIntervalInput,
      autoScan: autoScanInput,
    });
    onClose();
  };

  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devIp || !devMac) {
      alert('IP address and MAC physical address are required.');
      return;
    }

    // Resolve vendor from MAC input prefix
    const vendor = resolveVendorFromMac(devMac);

    onAddDevice({
      ip: devIp,
      mac: devMac,
      hostname: devHostname || 'unnamed-host.local',
      alias: devAlias || 'Added Host Term',
      vendor,
      isOnline: devIsOnline,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isStatic: devIsStatic,
      notes: devNotes,
    });

    // Reset device fields but keep the form clean
    setDevIp('');
    setDevMac('');
    setDevHostname('');
    setDevAlias('');
    setDevNotes('');
    setDevIsStatic(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in resize-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        
        {/* Left pane: Network Parameter settings */}
        <div className="p-6 space-y-4">
          <h3 className="text-md font-sans font-medium text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Settings className="w-5 h-5 text-indigo-400" />
            Subnet Properties Configuration
          </h3>
          <p className="text-xs text-slate-400">
            Configure default network parameters. These dimensions automatically slice the host matrix mapping.
          </p>

          <form onSubmit={handleSaveNetworkConfig} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Subnet Range (CIDR):</label>
              <input
                type="text"
                value={subnetInput}
                onChange={(e) => setSubnetInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="192.168.1.0/24"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Gateway Route:</label>
                <input
                  type="text"
                  value={gatewayInput}
                  onChange={(e) => setGatewayInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="192.168.1.1"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">DNS Resolver:</label>
                <input
                  type="text"
                  value={dnsInput}
                  onChange={(e) => setDnsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="192.168.1.10"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded border border-slate-850 space-y-3">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">ARP Sweep Automation</span>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daemon Scanning Enabled:</span>
                <input
                  type="checkbox"
                  checked={autoScanInput}
                  onChange={(e) => setAutoScanInput(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Virt-Sweep Interval (Minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={scanIntervalInput}
                  onChange={(e) => setScanIntervalInput(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-emerald-400 focus:outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                type="submit"
                className="cursor-pointer font-sans w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 px-4 py-2 rounded-lg font-medium transition"
              >
                Apply Network Configuration
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer font-sans w-full bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium transition"
              >
                Discard
              </button>
            </div>
          </form>
        </div>

        {/* Right pane: Register New Device manually */}
        <div className="p-6 space-y-4">
          <h3 className="text-md font-sans font-medium text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-5 h-5 text-sky-400" />
            DHCP Static Reservation Hold
          </h3>
          <p className="text-xs text-slate-400">
            Assign custom host leases or mock discover a terminal manually. Prefills MAC vendor OUI databases instantly.
          </p>

          <form onSubmit={handleRegisterDevice} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Client Pool IP Address:</label>
                <input
                  type="text"
                  value={devIp}
                  onChange={(e) => setDevIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold text-sky-400"
                  placeholder="192.168.1.150"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  MAC Address:
                  <button
                    type="button"
                    onClick={generateRandomMac}
                    className="text-[9px] text-sky-400 hover:underline flex items-center gap-0.5"
                    title="Generate pseudo random hardware interface"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Randomize
                  </button>
                </label>
                <input
                  type="text"
                  value={devMac}
                  onChange={(e) => setDevMac(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 uppercase font-bold"
                  placeholder="FC:18:07:05:AA:F1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Host Identification Alias:</label>
                <input
                  type="text"
                  value={devAlias}
                  onChange={(e) => setDevAlias(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                  placeholder="E.g., Synology NAS Backup"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Resolved DNS Hostname:</label>
                <input
                  type="text"
                  value={devHostname}
                  onChange={(e) => setDevHostname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  placeholder="E.g., home-nas.local"
                />
              </div>
            </div>

            {devMac && (
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-850 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] text-slate-400">
                  Resolved Hardware Vendor prefix: <strong className="text-slate-200">{resolveVendorFromMac(devMac)}</strong>
                </span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 text-xs">Terminal Description & Operational Notes:</label>
              <textarea
                value={devNotes}
                onChange={(e) => setDevNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans text-xs h-16 resize-none"
                placeholder="Details of terminal equipment lease configuration, network port bindings..."
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={devIsStatic}
                  onChange={(e) => setDevIsStatic(e.target.checked)}
                  className="accent-sky-500 w-4 h-4"
                />
                Is Static Hold IP Lease
              </label>
              
              <label className="flex items-center gap-1.5 select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={devIsOnline}
                  onChange={(e) => setDevIsOnline(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                Device Is Online (Resolving Pings)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="cursor-pointer font-sans w-full bg-sky-600 hover:bg-sky-500 text-slate-950 px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Register Terminal Connection
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
