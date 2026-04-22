import { subMinutes, subHours, format } from 'date-fns'

// ── IPs ──────────────────────────────────────────────────────
const ips = [
  '192.168.1.45', '45.22.11.9', '112.55.33.2', '88.14.22.1',
  '172.16.254.1', '10.0.0.55', '203.0.113.42', '198.51.100.7',
  '91.108.4.11',  '77.88.55.60',
]

// ── ENDPOINTS ────────────────────────────────────────────────
const endpoints = [
  '/api/users/auth', '/api/data', '/admin/settings', '/login',
  '/api/orders', '/health', '/dashboard', '/api/payments',
  '/api/v2/users', '/static/js/app.js',
]

// ── HTTP METHODS ─────────────────────────────────────────────
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const methodWeights = ['GET','GET','GET','POST','POST','PUT','DELETE','DELETE','PATCH']

// ── STATUS CODES ─────────────────────────────────────────────
const statuses = [200, 200, 200, 201, 401, 403, 404, 500]

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

// ── GENERATE HTTP LOGS ────────────────────────────────────────
export const httpLogs = Array.from({ length: 150 }, (_, i) => {
  const method = rnd(methodWeights)
  const status = rnd(statuses)
  const timestamp = subMinutes(new Date(), i * 5)
  return {
    id: i + 1,
    timestamp,
    timestampStr: format(timestamp, 'yyyy-MM-dd HH:mm:ss'),
    ip: rnd(ips),
    method,
    endpoint: rnd(endpoints),
    status,
    latency: rndInt(45, 520) + 'ms',
    anomaly: status >= 400 || method === 'DELETE',
  }
})

// ── THREAT DATA ───────────────────────────────────────────────
export const threats = [
  {
    id: 1, type: 'SQL Injection', severity: 'critical',
    ip: '45.22.11.9', target: '/api/users/auth',
    timestamp: '2023-10-24 14:32:01', status: 'Blocked',
    description: 'Malicious SQL payload detected in request body. Pattern: UNION SELECT injection.',
    anomalyScore: 0.97,
  },
  {
    id: 2, type: 'Brute Force', severity: 'high',
    ip: '192.168.1.45', target: '/login',
    timestamp: '2023-10-24 14:15:22', status: 'Blocked',
    description: '47 consecutive failed login attempts from single IP within 3 minutes.',
    anomalyScore: 0.89,
  },
  {
    id: 3, type: 'Endpoint Scanning', severity: 'medium',
    ip: '112.55.33.2', target: 'Multiple',
    timestamp: '2023-10-24 13:45:10', status: 'Monitored',
    description: 'Sequential endpoint enumeration detected. 200+ unique endpoints probed.',
    anomalyScore: 0.72,
  },
  {
    id: 4, type: 'DDoS Attempt', severity: 'critical',
    ip: '88.14.22.1', target: '/',
    timestamp: '2023-10-24 12:10:05', status: 'Mitigated',
    description: '10,000+ requests/sec from single source. Traffic pattern consistent with volumetric DDoS.',
    anomalyScore: 0.99,
  },
  {
    id: 5, type: 'Suspicious User Agent', severity: 'low',
    ip: '88.14.22.1', target: '/api/data',
    timestamp: '2023-10-24 11:55:33', status: 'Monitored',
    description: 'Known malicious crawler user-agent string detected in request headers.',
    anomalyScore: 0.41,
  },
  {
    id: 6, type: 'XSS Attempt', severity: 'high',
    ip: '77.88.55.60', target: '/dashboard',
    timestamp: '2023-10-24 11:20:14', status: 'Blocked',
    description: 'Cross-site scripting payload found in query parameters. <script> tag injection.',
    anomalyScore: 0.85,
  },
  {
    id: 7, type: 'Path Traversal', severity: 'medium',
    ip: '91.108.4.11', target: '/api/files',
    timestamp: '2023-10-24 10:44:09', status: 'Blocked',
    description: 'Directory traversal sequence (../../) detected in file path parameter.',
    anomalyScore: 0.76,
  },
]

// ── RECENT ALERTS ─────────────────────────────────────────────
export const recentAlerts = [
  { id: 1, title: 'Multiple Failed Logins',  ip: '192.168.1.45', severity: 'high',     time: '2 mins ago' },
  { id: 2, title: 'SQL Injection Attempt',   ip: '45.22.11.9',   severity: 'critical',  time: '15 mins ago' },
  { id: 3, title: 'Port Scan Detected',      ip: '112.55.33.2',  severity: 'medium',    time: '1 hour ago' },
  { id: 4, title: 'Suspicious User Agent',   ip: '88.14.22.1',   severity: 'low',       time: '2 hours ago' },
  { id: 5, title: 'DDoS Pattern Detected',   ip: '203.0.113.42', severity: 'critical',  time: '3 hours ago' },
]

// ── DASHBOARD STATS ───────────────────────────────────────────
export const dashStats = {
  totalLogs:     { value: '1.2M',  change: '+12.5%', up: true  },
  activeAlerts:  { value: '45',    change: '+5.2%',  up: true  },
  suspiciousIPs: { value: '128',   change: '0%',     up: null  },
  blockedThreats:{ value: '8,432', change: '+24.1%', up: true  },
}

// ── TRAFFIC vs THREATS (24h) ──────────────────────────────────
export const trafficData = Array.from({ length: 24 }, (_, i) => {
  const hour = format(subHours(new Date(), 23 - i), 'HH:mm')
  const requests = rndInt(800, 5200)
  const threats = rndInt(5, Math.floor(requests * 0.03))
  return { hour, requests, threats }
})

// ── ATTACK DISTRIBUTION ───────────────────────────────────────
export const attackDist = [
  { name: 'SQLi',        value: 312, fill: '#ff4560' },
  { name: 'XSS',         value: 198, fill: '#ff8c00' },
  { name: 'Brute Force', value: 341, fill: '#ffbb00' },
  { name: 'DDoS',        value: 87,  fill: '#4f8eff' },
]

// ── LOG ACTIVITY TIMELINE ─────────────────────────────────────
export const logTimeline = [
  { id: 1, title: 'System Backup',       time: '10:45 AM', desc: 'Automated daily backup completed successfully.', type: 'success' },
  { id: 2, title: 'Firewall Rules Updated', time: '09:12 AM', desc: 'Blocked subnet 45.22.x.x due to suspicious scanning.', type: 'warning' },
  { id: 3, title: 'IDS Alert Triggered', time: '08:30 AM', desc: 'Intrusion detection rule matched on port 22 scan.', type: 'error' },
  { id: 4, title: 'Certificate Renewed', time: '07:00 AM', desc: 'SSL/TLS certificate auto-renewed for api.securelog.io.', type: 'success' },
  { id: 5, title: 'Config Reload',       time: '06:15 AM', desc: 'Nginx configuration reloaded — 0 errors.', type: 'success' },
]

// ── ANALYTICS DATA ────────────────────────────────────────────
export const weeklyData = [
  { day: 'Mon', requests: 42000, threats: 320 },
  { day: 'Tue', requests: 55000, threats: 480 },
  { day: 'Wed', requests: 38000, threats: 210 },
  { day: 'Thu', requests: 61000, threats: 590 },
  { day: 'Fri', requests: 72000, threats: 840 },
  { day: 'Sat', requests: 29000, threats: 180 },
  { day: 'Sun', requests: 21000, threats: 95  },
]

export const topIPs = [
  { ip: '45.22.11.9',   requests: 8432, threats: 47, country: 'RU' },
  { ip: '192.168.1.45', requests: 6221, threats: 31, country: 'US' },
  { ip: '88.14.22.1',   requests: 5109, threats: 28, country: 'CN' },
  { ip: '112.55.33.2',  requests: 3847, threats: 19, country: 'BR' },
  { ip: '77.88.55.60',  requests: 2903, threats: 12, country: 'DE' },
]
