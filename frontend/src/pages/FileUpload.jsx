import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, AlertTriangle, CheckCircle, Shield,
  X, Loader2, BarChart2, Activity, ChevronDown, ChevronUp,
  ClipboardList, RefreshCw, Info, Cpu, Globe, Clock, Target
} from 'lucide-react'
import { uploadApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

function severityColor(s) {
  if (s === 'critical') return 'var(--red)'
  if (s === 'high')     return 'var(--orange)'
  if (s === 'medium')   return 'var(--yellow)'
  return 'var(--green)'
}
function severityBg(s) {
  if (s === 'critical') return 'var(--red-dim)'
  if (s === 'high')     return 'var(--orange-dim)'
  if (s === 'medium')   return 'var(--yellow-dim)'
  return 'var(--green-dim)'
}
function severityBorder(s) {
  if (s === 'critical') return 'var(--red-border)'
  if (s === 'high')     return 'var(--orange-border)'
  if (s === 'medium')   return 'var(--yellow-border)'
  return 'var(--green-border)'
}

function ScoreBar({ score, width = 80 }) {
  const pct = Math.round((score || 0) * 100)
  const color = pct >= 70 ? 'var(--red)' : pct >= 40 ? 'var(--orange)' : 'var(--green)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', width: 30 }}>{pct}%</span>
    </div>
  )
}

// ── Anomaly Detail Card — shown per anomaly row when expanded
function AnomalyDetailCard({ row }) {
  const sev = row.anomalyScore >= 0.85 ? 'critical' : row.anomalyScore >= 0.70 ? 'high' : row.anomalyScore >= 0.40 ? 'medium' : 'low'
  return (
    <div style={{
      background: severityBg(sev),
      border: `1px solid ${severityBorder(sev)}`,
      borderRadius: 10, padding: '14px 18px', marginTop: 6,
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10
    }}>
      {[
        { icon: Globe,  label: 'Source IP',      value: row.ip || '—' },
        { icon: Target, label: 'Endpoint',        value: row.endpoint || '—' },
        { icon: Shield, label: 'Algorithm',       value: row.detectionAlgorithm || 'Ensemble' },
        { icon: Cpu,    label: 'ML Score',        value: `${Math.round((row.anomalyScore||0)*100)}%` },
        { icon: Activity, label: 'Source Type',  value: row.sourceType || 'FILE_UPLOAD' },
        { icon: Clock,  label: 'Timestamp',       value: row.timestamp || '—' },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 7, padding: '8px 12px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <Icon size={11} color={severityColor(sev)} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: label === 'Source IP' || label === 'Endpoint' ? 'JetBrains Mono, monospace' : 'Inter', wordBreak: 'break-all' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Dark header panel showing anomaly summary (on dashboard style)
function AnomalyDashboardPanel({ result }) {
  const sev = result.overallSeverity || 'low'
  const anomalyPct = Math.round(result.anomalyRate || 0)
  const topAlgo = result.algorithmBreakdown?.[0]?.algorithm || 'None'

  return (
    <div className="anomaly-panel">
      {/* Dark header */}
      <div className="anomaly-panel-header">
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${severityColor(sev)}22`, border: `1px solid ${severityColor(sev)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {result.anomalyCount > 0 ? <AlertTriangle size={18} color={severityColor(sev)} /> : <CheckCircle size={18} color="var(--green)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
            {result.processedLines === 0
              ? 'Parse Error — No Lines Could Be Read'
              : result.anomalyCount > 0
                ? `${result.anomalyCount} Anomalies Detected — ${sev.charAt(0).toUpperCase() + sev.slice(1)} Risk`
                : 'No Anomalies Detected — File Looks Clean'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {result.filename} · {result.detectedFormat} format · {result.processedLines?.toLocaleString()} lines analyzed
          </div>
        </div>
        <span className={`badge badge-${sev}`} style={{ fontSize: 11 }}>{sev.toUpperCase()}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Total Lines',     value: result.totalLines?.toLocaleString(),    color: 'var(--text-primary)' },
          { label: 'Processed',       value: result.processedLines?.toLocaleString(), color: 'var(--text-primary)' },
          { label: 'Anomalies',       value: result.anomalyCount?.toLocaleString(),  color: result.anomalyCount > 0 ? 'var(--red)' : 'var(--green)' },
          { label: 'Anomaly Rate',    value: `${result.anomalyRate}%`,               color: anomalyPct > 20 ? 'var(--red)' : anomalyPct > 5 ? 'var(--orange)' : 'var(--green)' },
          { label: 'Avg ML Score',    value: `${Math.round((result.avgAnomalyScore||0)*100)}%`, color: result.avgAnomalyScore > 0.4 ? 'var(--orange)' : 'var(--green)' },
          { label: 'Top Algorithm',   value: topAlgo,                                color: 'var(--accent)' },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ padding: '16px 20px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.3px' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsPanel({ result, onReset }) {
  const [showAll, setShowAll]         = useState(false)
  const [filter, setFilter]           = useState('ALL')
  const [sortByScore, setSortByScore] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const navigate = useNavigate()

  const filteredRows = (result.results || [])
    .filter(r => {
      if (filter === 'ANOMALY') return r.anomaly
      if (filter === 'NORMAL')  return !r.anomaly
      return true
    })
    .sort((a, b) => sortByScore
      ? (b.anomalyScore || 0) - (a.anomalyScore || 0)
      : (a.lineNumber || 0) - (b.lineNumber || 0)
    )

  const displayRows = showAll ? filteredRows : filteredRows.slice(0, 50)
  const sev = result.overallSeverity || 'low'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Dark anomaly dashboard panel */}
      <AnomalyDashboardPanel result={result} />

      {/* Top action row */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn-outline" style={{ fontSize: 12.5 }} onClick={() => navigate('/threats')}>
          <Shield size={13} /> View Threats
        </button>
        <button className="btn-outline" style={{ fontSize: 12.5 }} onClick={() => navigate('/logs')}>
          <FileText size={13} /> View Logs
        </button>
        <button className="btn-primary" style={{ fontSize: 12.5 }} onClick={onReset}>
          <RefreshCw size={13} /> New Upload
        </button>
      </div>

      {/* Two-column: algorithm breakdown + traffic breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Algorithm breakdown */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Cpu size={15} color="var(--accent)" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>ML Algorithm Breakdown</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>from server</span>
          </div>
          {result.algorithmBreakdown && result.algorithmBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.algorithmBreakdown.map(a => (
                <div key={a.algorithm} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 120, flexShrink: 0 }}>{a.algorithm}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ width: `${Math.min(a.percentage, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #7c3aed)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', width: 36, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{a.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No anomalies flagged by any algorithm
            </div>
          )}
        </div>

        {/* Status + method breakdown */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BarChart2 size={15} color="var(--accent)" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Traffic Breakdown</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>from upload</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>HTTP Status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(result.statusBreakdown || {}).map(([k, v]) => {
                const cls = k === '2xx' ? 'status-200' : k === '4xx' ? 'status-403' : k === '5xx' ? 'status-500' : 'status-401'
                return <span key={k} className={cls} style={{ fontSize: 12 }}>{k}: <strong>{v}</strong></span>
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>HTTP Methods</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(result.methodBreakdown || {}).map(([m, v]) => (
                <span key={m} className={`method-${m.toLowerCase()}`} style={{ fontSize: 12 }}>
                  {m} <span style={{ opacity: 0.7 }}>{v}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-line results table */}
      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="var(--accent)" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Per-Line Analysis</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 7px' }}>
              {filteredRows.length} rows
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· Click any anomaly row for details</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['ALL', 'ANOMALY', 'NORMAL'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  fontSize: 11.5, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                  background: filter === f ? 'var(--accent)' : 'var(--bg-surface)',
                  color: filter === f ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.12s'
                }}>
                {f}
              </button>
            ))}
            <button onClick={() => setSortByScore(s => !s)}
              style={{
                fontSize: 11.5, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                background: sortByScore ? 'var(--accent-dim)' : 'var(--bg-surface)',
                color: sortByScore ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${sortByScore ? 'var(--accent-border)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              {sortByScore ? <ChevronDown size={11} /> : <ChevronUp size={11} />} Score
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>IP Address</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Latency</th>
                <th>ML Score</th>
                <th>Algorithm</th>
                <th>Source</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <React.Fragment key={i}>
                  <tr
                    className={row.anomaly ? 'anomaly-row' : ''}
                    style={{ cursor: row.anomaly ? 'pointer' : 'default' }}
                    onClick={() => row.anomaly && setExpandedRow(expandedRow === i ? null : i)}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{row.lineNumber}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{row.ip || '—'}</td>
                    <td>{row.method && <span className={`method-${(row.method||'').toLowerCase()}`}>{row.method}</span>}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      {row.endpoint || '—'}
                    </td>
                    <td>{row.status && <span className={`status-${row.status}`}>{row.status}</span>}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{row.latency || '—'}</td>
                    <td><ScoreBar score={row.anomalyScore} width={55} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.detectionAlgorithm || '—'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.sourceType || '—'}</td>
                    <td>
                      {row.anomaly ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid var(--red-border)', borderRadius: 4, padding: '1px 7px' }}>ANOMALY</span>
                          {expandedRow === i ? <ChevronUp size={11} color="var(--red)" /> : <ChevronDown size={11} color="var(--red)" />}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 4, padding: '1px 7px' }}>NORMAL</span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === i && row.anomaly && (
                    <tr style={{ background: 'transparent' }}>
                      <td colSpan={10} style={{ padding: '0 14px 12px' }}>
                        <AnomalyDetailCard row={row} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 50 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
            <button className="btn-outline" style={{ fontSize: 12.5 }} onClick={() => setShowAll(s => !s)}>
              {showAll
                ? <><ChevronUp size={13} /> Show less</>
                : <><ChevronDown size={13} /> Show all {filteredRows.length} rows</>}
            </button>
          </div>
        )}
      </div>

      {/* Info note */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <Info size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
        All processed logs are stored and available in the <strong style={{ color: 'var(--text-primary)' }}>Logs</strong> and <strong style={{ color: 'var(--text-primary)' }}>Threat Detection</strong> pages. Detected anomalies appear in real-time on the Dashboard.
      </div>
    </div>
  )
}

// ── Main FileUpload page ──────────────────────────────────────────────────────
export default function FileUpload() {
  const [dragOver, setDragOver]   = useState(false)
  const [file, setFile]           = useState(null)
  const [format, setFormat]       = useState('AUTO')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [tab, setTab]             = useState('file')
  const [pasteText, setPasteText] = useState('')
  const [progress, setProgress]   = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const fileInputRef              = useRef(null)

  const reset = () => { setFile(null); setResult(null); setError(''); setPasteText(''); setProgress(0) }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); setError('') }
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setError('') }
  }

  const runAnalysis = async () => {
    setError(''); setLoading(true); setProgress(10); setProgressMsg('Uploading file...')

    // Animate progress for UX
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(timer); return p }
        return p + Math.random() * 8
      })
      setProgressMsg(prev => {
        const msgs = ['Parsing log lines...', 'Running RuleBased detector...', 'Running IsolationForest...', 'Running KMeans clustering...', 'Running ZScore analysis...', 'Running NaiveBayes...', 'Computing ensemble score...']
        const idx = msgs.findIndex(m => prev === m)
        return msgs[(idx + 1) % msgs.length] || msgs[0]
      })
    }, 600)

    try {
      let data
      if (tab === 'file') {
        if (!file) { setError('Please select a log file first.'); setLoading(false); clearInterval(timer); return }
        data = await uploadApi.uploadFile(file, format)
      } else {
        if (!pasteText.trim()) { setError('Paste some log content first.'); setLoading(false); clearInterval(timer); return }
        data = await uploadApi.pasteLogs(pasteText, format)
      }
      clearInterval(timer)
      setProgress(100)
      setProgressMsg('Analysis complete!')
      setTimeout(() => setResult(data), 200)
    } catch (err) {
      clearInterval(timer)
      setError(err.message || 'Analysis failed. Check that the backend is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Upload size={20} color="var(--accent)" />
            <h1 className="page-title">Upload Analysis Results</h1>
          </div>
          <p className="page-subtitle">
            ML ensemble analysis complete —{' '}
            {result.processedLines > 0
              ? `${result.processedLines.toLocaleString()} lines analyzed`
              : <span style={{color:'var(--red)',fontWeight:600}}>0 lines parsed — check log format or try a different format</span>}
          </p>
        </div>
        <ResultsPanel result={result} onReset={reset} />
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Upload size={20} color="var(--accent)" />
          <h1 className="page-title">Upload Log File</h1>
        </div>
        <p className="page-subtitle">Upload a log file or paste log lines — the 5-model ML ensemble will analyze each entry for anomalies</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'file',  label: 'Upload File',  icon: FileText },
          { id: 'paste', label: 'Paste Logs',   icon: ClipboardList },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); setError('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.12s'
            }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {tab === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border-2)'}`,
                borderRadius: 14, padding: '44px 32px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--accent-dim)' : file ? 'var(--green-dim)' : '#fff',
                transition: 'all 0.15s', userSelect: 'none',
                boxShadow: dragOver ? '0 0 0 4px rgba(37,99,235,0.10)' : 'none'
              }}>
              <input ref={fileInputRef} type="file" accept=".log,.txt,.access,.gz,text/*" style={{ display: 'none' }} onChange={handleFileChange} />
              {file ? (
                <>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--green-dim)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <CheckCircle size={26} color="var(--green)" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change file
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }}
                    style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(37,99,235,0.12)' }}>
                    <Upload size={24} color="var(--accent)" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Drop your log file here</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>or click to browse files</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Nginx, Apache · .log, .txt, .access · Up to 50 MB</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Paste log lines</label>
              <textarea
                className="input-field"
                rows={12}
                style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.6 }}
                placeholder={'192.168.1.1 - - [01/Apr/2026:12:00:00 +0000] "GET /api/data HTTP/1.1" 200 1234 "-" "Mozilla/5.0"\n10.0.0.5 - - [01/Apr/2026:12:00:01 +0000] "POST /admin/login HTTP/1.1" 401 512 "-" "curl/7.68"'}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
              />
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {pasteText.split('\n').filter(l => l.trim()).length} lines entered
              </div>
            </div>
          )}

          {/* Format select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Log Format</label>
            <select className="select-field" style={{ width: '100%' }} value={format} onChange={e => setFormat(e.target.value)}>
              <option value="AUTO">Auto-detect (recommended)</option>
              <option value="NGINX">Nginx Combined Log Format</option>
              <option value="APACHE">Apache Common Log Format</option>
            </select>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Auto-detect examines the first few lines to identify the format</div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <AlertTriangle size={14} color="var(--red)" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress bar */}
          {loading && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Loader2 size={15} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Analyzing with ML ensemble…</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), #7c3aed)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{progressMsg}</div>
            </div>
          )}

          {/* Submit */}
          <button className="btn-primary" style={{ padding: '12px 22px', fontSize: 14, justifyContent: 'center' }} onClick={runAnalysis} disabled={loading}>
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
              : <><Shield size={15} /> Run ML Analysis</>}
          </button>
        </div>

        {/* Sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>What happens during analysis</div>
            {[
              { step: '1', label: 'Parse log lines', desc: 'Each line parsed into IP, method, endpoint, status, latency' },
              { step: '2', label: 'ML Ensemble runs', desc: '5 algorithms analyze each entry independently' },
              { step: '3', label: 'Weighted scoring', desc: 'IsolationForest & RuleBased 25% each, KMeans 20%, ZScore & NaiveBayes 15%' },
              { step: '4', label: 'Anomalies flagged', desc: 'Entries scoring ≥ 40% are marked anomalous' },
              { step: '5', label: 'Threats created', desc: 'High-confidence anomalies (≥ 70%) auto-create threat entries' },
            ].map(({ step, label, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-dim), var(--purple-dim))', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{step}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>ML Algorithms (5-model ensemble)</div>
            {[
              { name: 'RuleBased',       weight: '25%', color: '#dc2626', desc: 'Expert heuristics for known attack patterns' },
              { name: 'IsolationForest', weight: '25%', color: '#ea580c', desc: 'Multi-dimensional outlier isolation' },
              { name: 'KMeans',          weight: '20%', color: '#ca8a04', desc: 'Cluster-based anomaly separation' },
              { name: 'ZScore',          weight: '15%', color: '#2563eb', desc: 'Statistical latency & rate outliers' },
              { name: 'NaiveBayes',      weight: '15%', color: '#7c3aed', desc: 'Probabilistic classification baseline' },
            ].map(({ name, weight, color, desc }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, paddingLeft: 14 }}>{desc}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 5, padding: '1px 7px', flexShrink: 0 }}>{weight}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Supported Log Formats</div>
            {[
              { label: 'Nginx Combined', sample: '1.2.3.4 - - [01/Apr/2026:12:00:00 +0000] "GET /path HTTP/1.1" 200 1234' },
              { label: 'Apache Common',  sample: '1.2.3.4 - user [01/Apr/2026:12:00:00 +0000] "GET /path HTTP/1.1" 200 1234' },
            ].map(({ label, sample }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 8px', lineHeight: 1.5, wordBreak: 'break-all' }}>
                  {sample}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
