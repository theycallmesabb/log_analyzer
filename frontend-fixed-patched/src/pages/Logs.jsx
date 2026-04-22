import React, { useState, useCallback, useEffect } from 'react'
import {
  FileText, Search, Filter, Download,
  ChevronLeft, ChevronRight, Cpu
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { logsApi } from '../services/api'
import { useApi, useLazyApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorBanner } from '../components/ui/StatusWidgets'

function MethodBadge({ method }) {
  return <span className={`method-${method.toLowerCase()}`}>{method}</span>
}
function StatusBadge({ status }) {
  const cls = status >= 500 ? 'status-500'
    : status >= 403 ? 'status-403'
    : status === 401 ? 'status-401'
    : status >= 200 && status < 300 ? `status-${status}`
    : 'status-404'
  return <span className={cls}>{status}</span>
}

function MlScoreBar({ score }) {
  if (score == null) return null
  const pct   = Math.round(score * 100)
  const color = score >= 0.7 ? 'var(--red)' : score >= 0.4 ? 'var(--yellow)' : 'var(--green)'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:60, height:5, background:'var(--bg-hover)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3 }} />
      </div>
      <span style={{ fontSize:10, fontFamily:'Inter', color, fontWeight:700 }}>{pct}%</span>
    </div>
  )
}

export default function Logs() {
  const [searchParams] = useSearchParams()
  const [search,      setSearch]      = useState(searchParams.get('q') || '')
  const [methodFilter,setMethod]      = useState('ALL')
  const [statusFilter,setStatus]      = useState('ALL')
  const [page,        setPage]        = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId,  setExpandedId]  = useState(null)
  const [mlResults,   setMlResults]   = useState({})

  const PAGE_SIZE = 15

  const fetcher = useCallback(() =>
    logsApi.getLogs({ search, method: methodFilter, statusGroup: statusFilter, page, size: PAGE_SIZE }),
    [search, methodFilter, statusFilter, page]
  )
  const { data, loading, error, refetch } = useApi(fetcher)
  const { execute: analyzeLog, loading: analyzing } = useLazyApi(logsApi.analyzeLog)

  const logs       = data?.content      || []
  const totalPages = data?.totalPages   || 1
  const totalEls   = data?.totalElements || 0

  const handleExport = () => {
    const header = 'Timestamp,IP,Method,Endpoint,Status,Latency,AnomalyScore,Algorithm\n'
    const rows   = logs.map(l =>
      `${l.timestampStr},${l.ip},${l.method},${l.endpoint},${l.status},${l.latency},${l.anomalyScore ?? ''},${l.detectionAlgorithm ?? ''}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'securelog-export.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleAnalyze = async (logId) => {
    try {
      const result = await analyzeLog(logId)
      setMlResults(prev => ({ ...prev, [logId]: result }))
      setExpandedId(prev => prev === logId ? null : logId)
    } catch {}
  }

  const pageNums = () => {
    const nums  = []
    const start = Math.max(0, page - 2)
    const end   = Math.min(totalPages - 1, start + 4)
    for (let i = start; i <= end; i++) nums.push(i)
    return nums
  }

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <FileText size={20} color="var(--accent)" />
            <h1 className="page-title">Log Viewer</h1>
          </div>
          <p className="page-subtitle">Search, filter, and inspect all HTTP logs</p>
        </div>
        <button className="btn-outline" onClick={handleExport}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {error && <ErrorBanner error={error} onRetry={refetch} />}

      {/* Search + Filters */}
      <div className="card" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 240px' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
              color:'var(--text-muted)', pointerEvents:'none' }} />
            <input className="input-field" style={{ paddingLeft:36, width:'100%' }}
              placeholder="Search IPs, endpoints, methods, status…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
          <button className="btn-outline" style={{ padding:'8px 14px', whiteSpace:'nowrap' }}
            onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filters
          </button>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto', whiteSpace:'nowrap' }}>
            {totalEls === 0 ? '0 logs' :
              `${page * PAGE_SIZE + 1}–${Math.min((page+1)*PAGE_SIZE, totalEls)} of ${totalEls}`}
          </span>
        </div>

        {showFilters && (
          <div style={{ display:'flex', gap:14, marginTop:12, paddingTop:12,
            borderTop:'1px solid var(--border)', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>METHOD</label>
              <select className="select-field" value={methodFilter}
                onChange={e => { setMethod(e.target.value); setPage(0) }}>
                <option value="ALL">All Methods</option>
                {['GET','POST','PUT','DELETE','PATCH'].map(m =>
                  <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>STATUS</label>
              <select className="select-field" value={statusFilter}
                onChange={e => { setStatus(e.target.value); setPage(0) }}>
                <option value="ALL">All Statuses</option>
                <option value="2">2xx Success</option>
                <option value="4">4xx Client Error</option>
                <option value="5">5xx Server Error</option>
              </select>
            </div>
            <button className="btn-outline" style={{ fontSize:12 }}
              onClick={() => { setSearch(''); setMethod('ALL'); setStatus('ALL'); setPage(0) }}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        {loading ? <LoadingSpinner message="Fetching logs…" /> : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table" style={{ minWidth:860 }}>
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>IP ADDRESS</th>
                  <th>METHOD</th>
                  <th>ENDPOINT</th>
                  <th>STATUS</th>
                  <th>LATENCY</th>
                  <th>ML SCORE</th>
                  <th>ALGORITHM</th>
                  <th>SOURCE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                      No logs match your filters
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr style={{ background: log.anomaly ? 'rgba(255,69,96,0.03)' : '' }}>
                      <td style={{ fontFamily:'Inter', fontSize:11,
                        color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {log.timestampStr}
                      </td>
                      <td>
                        <span style={{ fontFamily:'Inter', fontSize:12,
                          background:'var(--bg-hover)', padding:'2px 8px',
                          borderRadius:5, color:'var(--text-primary)', border:'1px solid var(--border-2)' }}>
                          {log.ip}
                        </span>
                      </td>
                      <td><MethodBadge method={log.method} /></td>
                      <td style={{ fontFamily:'Inter', fontSize:12,
                        color:'var(--text-secondary)', maxWidth:200,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        title={log.endpoint}>
                        {log.endpoint}
                      </td>
                      <td><StatusBadge status={log.status} /></td>
                      <td style={{ fontFamily:'Inter', fontSize:12, color:'var(--text-muted)' }}>
                        {log.latency}
                      </td>
                      <td><MlScoreBar score={log.anomalyScore} /></td>
                      <td style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {log.detectionAlgorithm || '—'}
                      </td>
                      <td>
                        <span style={{ fontSize:10, color:'var(--text-muted)',
                          background:'var(--bg-surface)', padding:'2px 7px',
                          borderRadius:4, border:'1px solid var(--border)' }}>
                          {log.sourceType || 'API'}
                        </span>
                      </td>
                      <td>
                        <button title="Run ML Analysis" onClick={() => handleAnalyze(log.id)}
                          style={{ background:'none', border:'none', cursor:'pointer',
                            color: expandedId === log.id ? 'var(--cyan)' : 'var(--text-muted)',
                            padding:4, opacity: analyzing ? 0.5 : 1 }}>
                          <Cpu size={13} />
                        </button>
                      </td>
                    </tr>

                    {expandedId === log.id && mlResults[log.id] && (
                      <tr>
                        <td colSpan={10} style={{ padding:'14px 20px',
                          background:'rgba(0,212,212,0.03)', borderTop:'1px solid var(--border)' }}>
                          <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                            <div>
                              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                                ENSEMBLE SCORE
                              </div>
                              <div style={{ fontFamily:'Inter', fontSize:20, fontWeight:700,
                                color: mlResults[log.id].anomaly ? 'var(--red)' : 'var(--green)' }}>
                                {(mlResults[log.id].ensembleScore * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                                VERDICT
                              </div>
                              <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:700,
                                color: mlResults[log.id].anomaly ? 'var(--red)' : 'var(--green)' }}>
                                {mlResults[log.id].anomaly ? '⚠ ANOMALY' : '✓ NORMAL'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                                TOP DETECTOR
                              </div>
                              <div style={{ fontFamily:'Inter', fontSize:13,
                                fontWeight:700, color:'var(--accent)' }}>
                                {mlResults[log.id].topAlgorithm}
                              </div>
                            </div>
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:8 }}>
                                INDIVIDUAL SCORES
                              </div>
                              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                                {Object.entries(mlResults[log.id].individualScores || {}).map(([algo, score]) => (
                                  <div key={algo}>
                                    <div style={{ fontSize:9, color:'var(--text-muted)',
                                      marginBottom:3, letterSpacing:'0.5px' }}>
                                      {algo.toUpperCase()}
                                    </div>
                                    <MlScoreBar score={score} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
          <button className="page-btn"
            onClick={() => setPage(p => Math.max(0, p-1))}
            disabled={page === 0}>
            <ChevronLeft size={14} />
          </button>
          {pageNums().map(n => (
            <button key={n} className={`page-btn ${n === page ? 'active' : ''}`}
              onClick={() => setPage(n)}>
              {n + 1}
            </button>
          ))}
          <button className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
            disabled={page >= totalPages-1}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
