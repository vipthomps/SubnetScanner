export interface ConnectionEvent {
  timestamp: string;
  status: 'online' | 'offline';
}

export interface Device {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  alias: string;
  vendor: string;
  isOnline: boolean;
  firstSeen: string;
  lastSeen: string;
  isStatic: boolean;
  notes: string;
  connectionHistory: ConnectionEvent[];
}

export interface SubnetConfig {
  subnet: string;
  gateway: string;
  dns: string;
  scanInterval: number; // in minutes
  autoScan: boolean;
}

export interface NetworkEvent {
  id: string;
  timestamp: string;
  type: 'online' | 'offline' | 'discovered' | 'ip_change' | 'scan_completed';
  ip: string;
  hostname: string;
  mac: string;
  details: string;
}

export interface HistoricalStat {
  date: string;
  onlineCount: number;
  offlineCount: number;
}
