import React, { useState, useCallback } from 'react'
import { ShieldAlert, ChevronDown, ChevronUp, CheckCircle, Eye, AlertOctagon } from 'lucide-react'
import { threatsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorBanner } from '../components/ui/StatusWidgets'

const severityOrder = { critical:0, high:1, medium:2, low:3 }

function SeverityCount({ label, count, color, bg, border }) {
  return (
    <div style={{ flex:1, minWidth:140, background:bg, border:`1px solid ${border}`, borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:40, height:40, borderRadius:9, background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <AlertOctagon size={18} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontFamily:'Inter', fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>{label}</div>
        <div style={{ fontFamily:'Inter', fontSize:24, fontWeight:700, color }}>{count ?? 0}</div>
      </div>
    </div>
  )
}

function ThreatCard({ threat }) {
  const [expanded, setExpanded] = useState(false)
  const cols = { critical:{main:'var(--red)',dim:'var(--red-dim)'}, high:{main:'var(--orange)',dim:'var(--orange-dim)'}, medium:{main:'var(--yellow)',dim:'var(--yellow-dim)'}, low:{main:'var(--cyan)',dim:'var(--cyan-dim)'} }
  const col = cols[threat.severity] || cols.low
  const statusConfig = {
    'Blocked':   { icon:CheckCircle, color:'var(--green)'  },
    'Monitored': { icon:Eye,         color:'var(--accent)'   },
    'Mitigated': { icon:ShieldAlert, color:'var(--yellow)' },
  }[threat.status] || { icon:Eye, color:'var(--text-muted)' }
  const StatusIcon = statusConfig.icon

  return (
    <div className={`threat-card ${threat.severity}`} style={{ flexDirection:'column', alignItems:'stretch', gap:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, cursor:'pointer' }} onClick={() => setExpanded(e=>!e)}>
        <div style={{ width:42, height:42, borderRadius:10, background:col.dim, border:`1px solid ${col.main}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <AlertOctagon size={19} color={col.main} strokeWidth={1.8} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{threat.type}</span>
            <span className={`badge badge-${threat.severity}`}>{threat.severity.toUpperCase()}</span>
          </div>
          <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>IP: <span style={{ fontFamily:'Inter', fontSize:12, background:'var(--bg-hover)', padding:'1px 8px', borderRadius:4, color:'var(--text-secondary)', border:'1px solid var(--border-2)' }}>{threat.ip}</span></span>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Target: <span style={{ fontFamily:'Inter', color:'var(--accent)', fontWeight:600 }}>{threat.target}</span></span>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{threat.timestamp}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <StatusIcon size={14} color={statusConfig.color} />
            <span style={{ fontSize:13, fontWeight:600, color:statusConfig.color }}>{threat.status}</span>
          </div>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <div style={{ background:col.dim, border:`1px solid ${col.main}30`, borderRadius:8, padding:'12px 16px', marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:col.main, marginBottom:4, letterSpacing:'0.5px' }}>THREAT ANALYSIS</div>
            <p style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.6 }}>{threat.description}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10 }}>
            {[
              { label:'ANOMALY SCORE',   value:threat.anomalyScore?.toFixed(2) ?? 'N/A', color:col.main },
              { label:'SEVERITY',        value:threat.severity?.toUpperCase(),            color:col.main },
              { label:'STATUS',          value:threat.status,                             color:statusConfig.color },
              { label:'ML DETECTOR',     value:threat.detectionAlgorithm ?? 'Ensemble',  color:'var(--accent)' },
              { label:'ML CONFIDENCE',   value:threat.mlConfidence != null ? `${(threat.mlConfidence*100).toFixed(0)}%` : 'N/A', color:'var(--blue)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:'var(--bg-surface)', borderRadius:7, padding:'10px 14px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, letterSpacing:'0.5px' }}>{label}</div>
                <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ThreatDetection() {
  const [filter, setFilter] = useState('ALL')

  const threatsFetcher = useCallback(() => threatsApi.getThreats(filter), [filter])
  const countsFetcher  = useCallback(() => threatsApi.getCounts(), [])

  const { data: threats, loading: tLoading, error: tError, refetch: tRefetch } = useApi(threatsFetcher)
  const { data: counts,  loading: cLoading } = useApi(countsFetcher)

  const sorted = (threats || []).sort((a,b) => (severityOrder[a.severity]??9) - (severityOrder[b.severity]??9))

  if (tLoading || cLoading) return <LoadingSpinner message="Loading threat intelligence..." />
  if (tError) return <ErrorBanner error={tError} onRetry={tRefetch} />

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <ShieldAlert size={20} color="var(--red)" />
            <h1 style={{ fontFamily:'Inter', fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>Threat Detection</h1>
          </div>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Review and respond to active security alerts and anomalies</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {['ALL','critical','high','medium','low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-outline'}
              style={{ padding:'7px 14px', fontSize:12, textTransform:'capitalize',
                ...(filter===f && f!=='ALL' ? { background: f==='critical'?'var(--red)':f==='high'?'var(--orange)':f==='medium'?'var(--yellow)':'var(--cyan)', color:'var(--bg-base)' } : {})
              }}>
              {f === 'ALL' ? 'Filter Alerts' : f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <SeverityCount label="Critical" count={counts?.critical} color="var(--red)"    bg="var(--red-dim)"    border="rgba(255,69,96,0.2)"  />
        <SeverityCount label="High"     count={counts?.high}     color="var(--orange)" bg="var(--orange-dim)" border="rgba(255,140,0,0.2)" />
        <SeverityCount label="Medium"   count={counts?.medium}   color="var(--yellow)" bg="var(--yellow-dim)" border="rgba(255,187,0,0.2)" />
        <SeverityCount label="Low"      count={counts?.low}      color="var(--accent)"   bg="var(--cyan-dim)"   border="rgba(0,212,212,0.2)" />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {sorted.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13 }}>No threats found</div>
          : sorted.map(t => <ThreatCard key={t.id} threat={t} />)}
      </div>
    </div>
  )
}
