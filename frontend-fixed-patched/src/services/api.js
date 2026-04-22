// Central API layer — all calls proxied through Vite → Spring Boot :8080

const BASE = '/api'

function getToken() {
  return localStorage.getItem('sl_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    if (res.status === 401) {
      localStorage.removeItem('sl_token')
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch (e) {
    console.error(`[API] ${path}:`, e.message)
    throw e
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data)  => request('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  register: (data)  => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me:       ()      => request('/auth/me'),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary:      () => request('/dashboard/summary'),
  getStats:        () => request('/dashboard/stats'),
  getTraffic:      () => request('/dashboard/traffic'),
  getAttackDist:   () => request('/dashboard/attack-distribution'),
  getTimeline:     () => request('/dashboard/timeline'),
  getRecentAlerts: () => request('/dashboard/alerts/recent'),
}

// ── Logs ──────────────────────────────────────────────────────────────────────
export const logsApi = {
  getLogs: ({ search='', method='ALL', statusGroup='ALL', page=0, size=15, sortBy='timestamp', sortDir='desc' } = {}) =>
    request(`/logs?search=${encodeURIComponent(search)}&method=${method}&statusGroup=${statusGroup}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
  analyzeLog: (id)  => request(`/logs/${id}/analyze`),
  ingestLog:  (log) => request('/logs/ingest', { method: 'POST', body: JSON.stringify(log) }),
}

// ── Threats ───────────────────────────────────────────────────────────────────
export const threatsApi = {
  getThreats:    (severity='ALL') => request(`/threats?severity=${severity}`),
  getCounts:     ()               => request('/threats/counts'),
  getAlerts:     ()               => request('/threats/alerts'),
  markAlertRead: (id)             => request(`/threats/alerts/${id}/read`, { method: 'PATCH' }),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getAll:    () => request('/analytics'),
  getWeekly: () => request('/analytics/weekly'),
  getTopIPs: () => request('/analytics/top-ips'),
}

// ── File Upload & Analysis ────────────────────────────────────────────────────
export const uploadApi = {
  /**
   * Upload a log file — returns rich UploadAnalysisResult from backend.
   * Does NOT set Content-Type; browser sets it with boundary for multipart.
   */
  uploadFile: (file, format = 'AUTO') => {
    const token = getToken()
    const form  = new FormData()
    form.append('file', file)
    form.append('format', format)
    return fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('sl_token')
        window.location.href = '/login'
        throw new Error('Session expired')
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.json()
    })
  },

  /**
   * Paste raw log text — returns same rich UploadAnalysisResult.
   */
  pasteLogs: (content, format = 'AUTO') =>
    request('/upload/paste', {
      method: 'POST',
      body: JSON.stringify({ content, format }),
    }),

  /**
   * Upload a file tied to a specific log source (existing endpoint).
   */
  uploadToSource: (sourceId, file, format = 'NGINX') => {
    const token = getToken()
    const form  = new FormData()
    form.append('file', file)
    form.append('format', format)
    return fetch(`${BASE}/sources/${sourceId}/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.json()
    })
  },
}

// ── Log Sources ───────────────────────────────────────────────────────────────
export const sourcesApi = {
  getAll:       ()             => request('/sources'),
  create:       (data)        => request('/sources', { method: 'POST', body: JSON.stringify(data) }),
  delete:       (id)          => request(`/sources/${id}`, { method: 'DELETE' }),
  toggle:       (id)          => request(`/sources/${id}/toggle`, { method: 'PATCH' }),
  ingestSingle: (id, log)     => request(`/sources/${id}/ingest`, { method: 'POST', body: JSON.stringify(log) }),
  pasteLogs:    (id, content, format) => request(`/sources/${id}/paste`, {
    method: 'POST',
    body: JSON.stringify({ content, format })
  }),
}
