import React, { useState, useCallback, useRef } from 'react'
import {
  Server, Plus, Trash2, ToggleLeft, ToggleRight, Upload,
  Activity, AlertTriangle, CheckCircle, Globe,
  Terminal, FileText, Loader2, X, ClipboardList
} from 'lucide-react'
import { sourcesApi, uploadApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorBanner } from '../components/ui/StatusWidgets'

// Use real hex values — never CSS vars inside template literal CSS strings
const TYPE_META = {
  NGINX:         { icon: Globe,       label: 'Nginx',         hexColor: '#16a34a', cssColor: 'var(--green)',  desc: 'Nginx access/error logs (combined format)' },
  APACHE:        { icon: Server,      label: 'Apache',        hexColor: '#ea580c', cssColor: 'var(--orange)', desc: 'Apache Common/Combined Log Format' },
  AGENT:         { icon: Activity,    label: 'Agent',         hexColor: '#0891b2', cssColor: 'var(--cyan)',   desc: 'SecureLog lightweight agent (REST API)' },
  SYSLOG:        { icon: Terminal,    label: 'Syslog',        hexColor: '#2563eb', cssColor: 'var(--accent)', desc: 'Linux/Unix system syslog' },
  WINDOWS_EVENT: { icon: FileText,    label: 'Windows Event', hexColor: '#ca8a04', cssColor: 'var(--yellow)', desc: 'Windows Event Log collector' },
  FILE_UPLOAD:   { icon: Upload,      label: 'File Upload',   hexColor: '#6b7280', cssColor: '#6b7280',       desc: 'Manual log file upload' },
}

function SourceCard({ source, onToggle, onDelete, onPaste, onRefresh }) {
  const meta     = TYPE_META[source.type] || TYPE_META.AGENT
  const Icon     = meta.icon
  const isActive = source.status === 'ACTIVE'
  const anom     = source.totalLogsReceived > 0
    ? ((source.anomaliesDetected / source.totalLogsReceived) * 100).toFixed(1)
    : '0.0'
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setUploadMsg('')
    try {
      const fmt = source.type === 'APACHE' ? 'APACHE' : 'NGINX'
      const r   = await uploadApi.uploadToSource(source.id, file, fmt)
      setUploadMsg(`✓ ${r.processed} of ${r.total} lines ingested`)
      if (onRefresh) onRefresh()
    } catch (err) {
      setUploadMsg(`✗ ${err.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="source-card">
      <input
        ref={fileInputRef}
        type="file"
        accept=".log,.txt,.access,text/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div className="source-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Use hexColor so template literal is safe */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: meta.hexColor + '1a',
            border: '1px solid ' + meta.hexColor + '55',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={meta.hexColor} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{source.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {meta.label} · {source.host || 'No host'}
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: isActive ? 'var(--green-dim)' : 'var(--red-dim)',
          color:      isActive ? 'var(--green)'     : 'var(--red)',
          border:     isActive ? '1px solid var(--green-border)' : '1px solid var(--red-border)',
        }}>
          {isActive ? '● ACTIVE' : '○ INACTIVE'}
        </span>
      </div>

      <div className="source-stats-row">
        {[
          { label: 'Total Logs',   value: source.totalLogsReceived.toLocaleString() },
          { label: 'Anomalies',    value: source.anomaliesDetected.toLocaleString(), color: 'var(--red)' },
          { label: 'Anomaly Rate', value: `${anom}%`, color: parseFloat(anom) > 5 ? 'var(--red)' : 'var(--green)' },
          { label: 'Last Seen',    value: source.lastSeen },
        ].map(({ label, value, color }) => (
          <div key={label} className="source-stat">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {uploadMsg && (
        <div style={{
          fontSize: 12, padding: '6px 10px', borderRadius: 6, marginBottom: 8,
          background: uploadMsg.startsWith('✓') ? 'var(--green-dim)' : 'var(--red-dim)',
          color:      uploadMsg.startsWith('✓') ? 'var(--green)'     : 'var(--red)',
          border:     uploadMsg.startsWith('✓') ? '1px solid var(--green-border)' : '1px solid var(--red-border)',
        }}>
          {uploadMsg}
        </div>
      )}

      <div className="source-actions">
        <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Upload size={13} />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={() => onPaste(source)}>
          <ClipboardList size={13} /> Paste Logs
        </button>
        <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={() => onToggle(source.id)}>
          {isActive
            ? <ToggleRight size={13} color="var(--accent)" />
            : <ToggleLeft  size={13} />}
          {isActive ? 'Disable' : 'Enable'}
        </button>
        <button className="btn-outline"
          style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)', borderColor: 'var(--red-border)' }}
          onClick={() => onDelete(source.id)}>
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </div>
  )
}

function AddSourceModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ name: '', type: 'NGINX', description: '', host: '', port: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const meta = TYPE_META[form.type]

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    try {
      const src = await sourcesApi.create({ ...form, port: form.port ? parseInt(form.port) : null })
      onCreated(src)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: 16, fontWeight: 700 }}>Add Log Source</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        {error && (
          <div className="auth-error" style={{ marginBottom: 12 }}>
            <AlertTriangle size={14} color="var(--red)" /><span>{error}</span>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="auth-field">
            <label>Source Name</label>
            <input className="input-field" placeholder="e.g. Production Nginx"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="auth-field">
            <label>Type</label>
            <select className="select-field" style={{ width: '100%' }}
              value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {meta && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{meta.desc}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
            <div className="auth-field">
              <label>Host / IP (optional)</label>
              <input className="input-field" placeholder="10.0.0.1"
                value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} />
            </div>
            <div className="auth-field">
              <label>Port</label>
              <input className="input-field" placeholder="80" type="number"
                value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} />
            </div>
          </div>
          <div className="auth-field">
            <label>Description (optional)</label>
            <input className="input-field" placeholder="Brief description"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
            {loading ? 'Adding...' : 'Add Source'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasteModal({ source, onClose }) {
  const [content, setContent] = useState('')
  const [format,  setFormat]  = useState(source.type === 'APACHE' ? 'APACHE' : 'NGINX')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const submit = async () => {
    if (!content.trim()) { setError('Paste some log lines first'); return }
    setLoading(true); setError('')
    try {
      const r = await sourcesApi.pasteLogs(source.id, content, format)
      setResult(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: 16, fontWeight: 700 }}>Paste Logs — {source.name}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <CheckCircle size={40} color="var(--green)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Processed {result.processed} of {result.total} lines
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Logs analyzed by ML ensemble. Anomalies auto-flagged.
            </div>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="auth-field">
              <label>Log Format</label>
              <select className="select-field" style={{ width: '100%' }}
                value={format} onChange={e => setFormat(e.target.value)}>
                <option value="NGINX">Nginx Combined Format</option>
                <option value="APACHE">Apache Common Format</option>
              </select>
            </div>
            <div className="auth-field">
              <label>Paste log lines below</label>
              <textarea
                className="input-field"
                rows={10}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                placeholder='192.168.1.1 - - [01/Apr/2026:12:00:00 +0000] "GET /api/data HTTP/1.1" 200 1234 "-" "Mozilla/5.0"'
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            {error && (
              <div className="auth-error">
                <AlertTriangle size={14} color="var(--red)" /><span>{error}</span>
              </div>
            )}
            <button className="auth-submit" onClick={submit} disabled={loading}>
              {loading ? <Loader2 size={14} className="spin" /> : <Activity size={14} />}
              {loading ? 'Analyzing...' : 'Analyze & Ingest'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function LogSources() {
  const [showAdd,  setShowAdd]  = useState(false)
  const [pasteFor, setPasteFor] = useState(null)
  const [sources,  setSources]  = useState(null)

  const fetcher = useCallback(() => sourcesApi.getAll(), [])
  const { data, loading, error, refetch } = useApi(fetcher)

  const list   = sources ?? data ?? []
  const active = list.filter(s => s.status === 'ACTIVE').length
  const total  = list.reduce((a, s) => a + (s.totalLogsReceived || 0), 0)

  const handleToggle = async (id) => {
    try {
      const updated = await sourcesApi.toggle(id)
      setSources(prev => (prev ?? data ?? []).map(s => s.id === id ? updated : s))
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this log source?')) return
    try {
      await sourcesApi.delete(id)
      setSources(prev => (prev ?? data ?? []).filter(s => s.id !== id))
    } catch {}
  }

  const handleCreated = (src) => {
    setSources(prev => [...(prev ?? data ?? []), src])
  }

  if (loading) return <LoadingSpinner message="Loading log sources..." />
  if (error)   return <ErrorBanner error={error} onRetry={refetch} />

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {showAdd  && <AddSourceModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {pasteFor && <PasteModal source={pasteFor} onClose={() => setPasteFor(null)} />}

      {/* Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <Server size={20} color="var(--accent)" />
            <h1 className="page-title">Log Sources</h1>
          </div>
          <p className="page-subtitle">Manage where your logs come from — servers, agents, file uploads</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Source
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Sources', value: list.length,            color: 'var(--accent)' },
          { label: 'Active',        value: active,                 color: 'var(--green)'  },
          { label: 'Inactive',      value: list.length - active,   color: 'var(--red)'    },
          { label: 'Total Logs',    value: total.toLocaleString(), color: 'var(--text-primary)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Source list */}
      {list.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Server size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            No log sources yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Add your first source to start receiving logs
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Your First Source
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map(s => (
            <SourceCard key={s.id} source={s}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onPaste={setPasteFor}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}

      {/* Integration guide */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          📡 Integration Guide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          {[
            { title: 'Agent (REST API)', code: `POST /api/sources/{id}/ingest\nAuthorization: Bearer <token>\n{ "ipAddress":"1.2.3.4", "method":"GET",\n  "endpoint":"/api/data", "status":200, "latencyMs":120 }` },
            { title: 'Nginx Log Tail',   code: `tail -f /var/log/nginx/access.log | \\\nwhile read line; do\n  curl -s -X POST /api/sources/{id}/ingest \\\n    -H "Authorization: Bearer <token>" \\\n    -d "$line"\ndone` },
            { title: 'Bulk Upload (curl)', code: `curl -X POST /api/sources/{id}/upload \\\n  -H "Authorization: Bearer <token>" \\\n  -F "file=@access.log" \\\n  -F "format=NGINX"` },
          ].map(({ title, code }) => (
            <div key={title} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>{title}</div>
              <pre style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
