import { Device, NetworkEvent, SubnetConfig, HistoricalStat } from '../types';

// Helper to generate timestamps
export const getRelativeISOString = (hoursAgo: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const DEFAULT_SUBNET_CONFIG: SubnetConfig = {
  subnet: '192.168.1.0/24',
  gateway: '192.168.1.1',
  dns: '192.168.1.10',
  scanInterval: 1,
  autoScan: true,
};

// MAC prefix to vendor mapping for auto-lookup
export const MAC_VENDOR_MAP: { [prefix: string]: string } = {
  'c0:56:27': 'Apple Inc.',
  'fc:18:07': 'Apple Inc.',
  '70:3a:cb': 'Apple Inc.',
  'b8:27:eb': 'Raspberry Pi Foundation',
  'dc:a6:32': 'Raspberry Pi Foundation',
  '00:0c:29': 'VMware, Inc.',
  '24:1a:3f': 'TP-Link Technologies Co.,Ltd.',
  'd8:07:b6': 'TP-Link Technologies Co.,Ltd.',
  '70:8b:cd': 'ASUSTek Computer Inc.',
  '18:31:bf': 'Google LLC',
  '90:3a:72': 'Google LLC',
  'b4:75:0e': 'Hewlett Packard',
  '00:11:32': 'Synology Inc.',
  '34:af:2c': 'Sony Corporation',
  'cc:50:e3': 'Espressif Systems Co., Ltd',
  '4c:11:ae': 'Intel Corporation',
  '00:c0:ca': 'Cisco Systems, Inc.',
  '1c:fe:34': 'Samsung Electronics Co.,Ltd',
};

export const resolveVendorFromMac = (mac: string): string => {
  const cleanMac = mac.trim().toLowerCase();
  const prefix = cleanMac.split(':').slice(0, 3).join(':');
  return MAC_VENDOR_MAP[prefix] || 'Unknown Vendor';
};

export const INITIAL_DEVICES: Device[] = [
  {
    id: 'dev_1',
    ip: '192.168.1.1',
    mac: '70:8b:cd:e4:11:05',
    hostname: 'router.home',
    alias: 'Main Gateway Router',
    vendor: 'ASUSTek Computer Inc.',
    isOnline: true,
    firstSeen: getRelativeISOString(240), // 10 days ago
    lastSeen: getRelativeISOString(0),
    isStatic: true,
    notes: 'Primary ASUS RT-AX88U gateway. Running DHCP, NAT, and Firewall services.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
    ],
  },
  {
    id: 'dev_2',
    ip: '192.168.1.10',
    mac: 'b8:27:eb:ff:8a:12',
    hostname: 'pihole.local',
    alias: 'DNS & Ad-Blocker Server',
    vendor: 'Raspberry Pi Foundation',
    isOnline: true,
    firstSeen: getRelativeISOString(200),
    lastSeen: getRelativeISOString(0),
    isStatic: true,
    notes: 'DNS ad-blocker server on Raspberry Pi 4 B. Intercepts local LAN tracking analytics.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(18), status: 'online' },
      { timestamp: getRelativeISOString(6), status: 'online' },
    ],
  },
  {
    id: 'dev_3',
    ip: '192.168.1.15',
    mac: '00:11:32:ea:bc:99',
    hostname: 'vault.nas.local',
    alias: 'Synology Media Vault',
    vendor: 'Synology Inc.',
    isOnline: true,
    firstSeen: getRelativeISOString(180),
    lastSeen: getRelativeISOString(0),
    isStatic: true,
    notes: 'DiskStation NAS storing local media libraries, automated server backups, and photos.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
    ],
  },
  {
    id: 'dev_4',
    ip: '192.168.1.101',
    mac: 'c0:56:27:aa:b2:fe',
    hostname: 'MacBook-Pro-16.local',
    alias: 'Admin MacBook Pro 16"',
    vendor: 'Apple Inc.',
    isOnline: true,
    firstSeen: getRelativeISOString(96),
    lastSeen: getRelativeISOString(0),
    isStatic: false,
    notes: 'Main system for coding and system administration. Connected via Wi-Fi 6.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(16), status: 'offline' },
      { timestamp: getRelativeISOString(14), status: 'online' },
      { timestamp: getRelativeISOString(2), status: 'online' },
    ],
  },
  {
    id: 'dev_5',
    ip: '192.168.1.102',
    mac: '1c:fe:34:df:ac:11',
    hostname: 'Galaxy-S23.local',
    alias: 'S23 Phone',
    vendor: 'Samsung Electronics Co.,Ltd',
    isOnline: true,
    firstSeen: getRelativeISOString(80),
    lastSeen: getRelativeISOString(0),
    isStatic: false,
    notes: 'S23 Personal Handset.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(10), status: 'offline' },
      { timestamp: getRelativeISOString(8), status: 'online' },
    ],
  },
  {
    id: 'dev_6',
    ip: '192.168.1.105',
    mac: 'fc:18:07:54:1a:2d',
    hostname: 'iPad-Pro.local',
    alias: 'iPad Pro Companion',
    vendor: 'Apple Inc.',
    isOnline: false,
    firstSeen: getRelativeISOString(72),
    lastSeen: getRelativeISOString(4),
    isStatic: false,
    notes: 'Graphic drawing and content tablet. Currently asleep or powered off.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
      { timestamp: getRelativeISOString(4), status: 'offline' },
    ],
  },
  {
    id: 'dev_7',
    ip: '192.168.1.120',
    mac: 'cc:50:e3:10:99:f1',
    hostname: 'espressif-smartbulb-01',
    alias: 'Guest Room Smart Bulb',
    vendor: 'Espressif Systems Co., Ltd',
    isOnline: true,
    firstSeen: getRelativeISOString(120),
    lastSeen: getRelativeISOString(0),
    isStatic: false,
    notes: 'Tuya Smart LED dynamic bulb connected via 2.4GHz Wi-Fi.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
    ],
  },
  {
    id: 'dev_8',
    ip: '192.168.1.121',
    mac: 'cc:50:e3:11:42:ee',
    hostname: 'espressif-smartbulb-02',
    alias: 'Living Room Smart Plug',
    vendor: 'Espressif Systems Co., Ltd',
    isOnline: true,
    firstSeen: getRelativeISOString(120),
    lastSeen: getRelativeISOString(0),
    isStatic: false,
    notes: 'Smart outlet plug automation for corner ambient lighting.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
    ],
  },
  {
    id: 'dev_9',
    ip: '192.168.1.130',
    mac: '34:af:2c:dd:ee:fa',
    hostname: 'sony-bravia-75.local',
    alias: 'Living Room Bravia TV',
    vendor: 'Sony Corporation',
    isOnline: false,
    firstSeen: getRelativeISOString(150),
    lastSeen: getRelativeISOString(18),
    isStatic: false,
    notes: '75-inch Living Room Smart screen. Offline when TV is placed in deep standby.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(18), status: 'offline' },
    ],
  },
  {
    id: 'dev_10',
    ip: '192.168.1.144',
    mac: '18:31:bf:88:22:92',
    hostname: 'google-nest-hub.local',
    alias: 'Kitchen Smart Hub',
    vendor: 'Google LLC',
    isOnline: true,
    firstSeen: getRelativeISOString(90),
    lastSeen: getRelativeISOString(0),
    isStatic: false,
    notes: 'Google Nest Display used for voice controls, ambient photos, and culinary timers.',
    connectionHistory: [
      { timestamp: getRelativeISOString(24), status: 'online' },
      { timestamp: getRelativeISOString(12), status: 'online' },
    ],
  },
];

export const INITIAL_EVENTS: NetworkEvent[] = [
  {
    id: 'evt_1',
    timestamp: getRelativeISOString(2.5),
    type: 'online',
    ip: '192.168.1.101',
    hostname: 'MacBook-Pro-16.local',
    mac: 'c0:56:27:aa:b2:fe',
    details: 'Admin MacBook Pro 16" IP verified. Scanning resolved host is online.',
  },
  {
    id: 'evt_2',
    timestamp: getRelativeISOString(4),
    type: 'offline',
    ip: '192.168.1.105',
    hostname: 'iPad-Pro.local',
    mac: 'fc:18:07:54:1a:2d',
    details: 'Connection lost. iPad Pro went offline (ARP ping unanswered).',
  },
  {
    id: 'evt_3',
    timestamp: getRelativeISOString(5),
    type: 'discovered',
    ip: '192.168.1.121',
    hostname: 'espressif-smartbulb-02',
    mac: 'cc:50:e3:11:42:ee',
    details: 'New device discovered on the network subnet. Automatically matched vendor Espressif Systems.',
  },
  {
    id: 'evt_4',
    timestamp: getRelativeISOString(18),
    type: 'offline',
    ip: '192.168.1.130',
    hostname: 'sony-bravia-75.local',
    mac: '34:af:2c:dd:ee:fa',
    details: 'Connection lost. Living Room Bravia TV status changed to offline.',
  },
  {
    id: 'evt_5',
    timestamp: getRelativeISOString(24),
    type: 'scan_completed',
    ip: '',
    hostname: '',
    mac: '',
    details: 'Full ARP Sweep completed. Found 8 active hosts of 10 registered on subnet 192.168.1.0/24.',
  },
];

// Connection History statistics structure over last 10 days
export const HISTORICAL_STATS: HistoricalStat[] = [
  { date: 'Jun 13', onlineCount: 6, offlineCount: 2 },
  { date: 'Jun 14', onlineCount: 7, offlineCount: 2 },
  { date: 'Jun 15', onlineCount: 7, offlineCount: 3 },
  { date: 'Jun 16', onlineCount: 8, offlineCount: 2 },
  { date: 'Jun 17', onlineCount: 8, offlineCount: 2 },
  { date: 'Jun 18', onlineCount: 7, offlineCount: 3 },
  { date: 'Jun 19', onlineCount: 9, offlineCount: 1 },
  { date: 'Jun 20', onlineCount: 8, offlineCount: 2 },
  { date: 'Jun 21', onlineCount: 8, offlineCount: 2 },
  { date: 'Jun 22', onlineCount: 8, offlineCount: 2 },
];
