import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Pause, Play, Trash2, Filter, AlertTriangle, CheckCircle } from 'lucide-react'
import { logsApi } from '../services/api'

function LiveLogRow({ log, idx }) {
  const isAnomaly = log.anomaly
  const scoreColor = log.anomalyScore >= 0.7 ? 'var(--red)'
    : log.anomalyScore >= 0.4 ? 'var(--yellow)' : 'var(--green)'

  const methodColor = {
    GET:'var(--cyan)', POST:'var(--green)', PUT:'var(--yellow)',
    DELETE:'var(--red)', PATCH:'var(--orange)'
  }[log.method] || 'var(--text-muted)'

  const statusColor = log.status >= 500 ? 'var(--red)'
    : log.status >= 400 ? 'var(--yellow)'
    : 'var(--green)'

  return (
    <div className={`live-log-row ${isAnomaly ? 'anomaly' : ''}`}
      style={{ animationDelay: `${idx * 30}ms` }}>
      {isAnomaly
        ? <AlertTriangle size={13} color="var(--red)" style={{ flexShrink:0 }} />
        : <CheckCircle   size={13} color="var(--green)" style={{ flexShrink:0 }} />
      }
      <span className="live-ts">{log.timestampStr?.slice(11) || '--'}</span>
      <span style={{ color:methodColor, fontWeight:700, fontFamily:'Inter', fontSize:11, width:48, flexShrink:0 }}>
        {log.method}
      </span>
      <span style={{ color:statusColor, fontFamily:'Inter', fontSize:11, width:36, flexShrink:0 }}>
        {log.status}
      </span>
      <span className="live-ip">{log.ip}</span>
      <span className="live-ep" title={log.endpoint}>{log.endpoint}</span>
      <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0 }}>{log.latency}</span>
      {log.anomalyScore != null && (
        <span style={{ fontSize:10, fontFamily:'Inter', fontWeight:700, color:scoreColor, flexShrink:0 }}>
          {(log.anomalyScore * 100).toFixed(0)}%
        </span>
      )}
      {isAnomaly && (
        <span style={{ fontSize:10, color:'var(--red)', background:'var(--red-dim)',
          border:'1px solid rgba(255,69,96,0.3)', borderRadius:4, padding:'1px 6px', flexShrink:0 }}>
          {log.detectionAlgorithm}
        </span>
      )}
    </div>
  )
}

export default function LiveFeed() {
  const [logs,      setLogs]      = useState([])
  const [paused,    setPaused]    = useState(false)
  const [filter,    setFilter]    = useState('ALL')  // ALL, ANOMALY
  const [stats,     setStats]     = useState({ total:0, anomalies:0, rps:0 })
  const bottomRef = useRef(null)
  const pausedRef = useRef(false)
  pausedRef.current = paused

  // Poll for recent logs every 3 seconds
  useEffect(() => {
    let cancelled = false
    let prevTotal = 0
    let ticker = 0

    const poll = async () => {
      if (pausedRef.current || cancelled) return
      try {
        const data = await logsApi.getLogs({ page:0, size:20, sortBy:'timestamp', sortDir:'desc' })
        if (!data?.content || cancelled) return
        const incoming = data.content

        setLogs(prev => {
          const existingIds = new Set(prev.map(l => l.id))
          const novel = incoming.filter(l => !existingIds.has(l.id))
          if (novel.length === 0) return prev
          const merged = [...novel, ...prev].slice(0, 200)

          // stats
          const anom = merged.filter(l => l.anomaly).length
          ticker++
          const rps = (novel.length / 3).toFixed(1)
          setStats({ total: merged.length, anomalies: anom, rps })
          return merged
        })
      } catch {}
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (!paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, paused])

  const displayed = filter === 'ANOMALY' ? logs.filter(l => l.anomaly) : logs

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:18, height:'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <Zap size={20} color="var(--accent)" />
            <h1 className="page-title">Live Feed</h1>
            {!paused && <span className="pulse-green" />}
          </div>
          <p className="page-subtitle">Real-time log stream with ML anomaly detection</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className={`btn-outline ${filter==='ANOMALY'?'active-filter':''}`}
            style={{ fontSize:12, padding:'6px 14px',
              ...(filter==='ANOMALY' ? {borderColor:'var(--red)',color:'var(--red)'} : {}) }}
            onClick={() => setFilter(f => f==='ANOMALY'?'ALL':'ANOMALY')}>
            <Filter size={13} />
            {filter === 'ANOMALY' ? 'Showing Anomalies' : 'All Logs'}
          </button>
          <button className={paused ? 'btn-primary' : 'btn-outline'}
            style={{ fontSize:12, padding:'6px 14px' }}
            onClick={() => setPaused(p => !p)}>
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="btn-outline" style={{ fontSize:12, padding:'6px 14px' }}
            onClick={() => setLogs([])}>
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        {[
          { label:'Logs Captured', value:stats.total,     color:'var(--accent)'   },
          { label:'Anomalies',     value:stats.anomalies,  color:'var(--red)'    },
          { label:'Rate',          value:`${stats.rps}/s`, color:'var(--green)'  },
          { label:'Status',        value:paused?'Paused':'Live', color:paused?'var(--yellow)':'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding:'10px 18px', flex:'1 1 120px' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:18, fontWeight:700, color, fontFamily:'Inter' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div className="card" style={{ overflow:'hidden', flex:1, display:'flex', flexDirection:'column' }}>
        <div className="live-feed-header">
          <span style={{ width:13 }} />
          <span>TIME</span>
          <span>METHOD</span>
          <span>STATUS</span>
          <span>IP</span>
          <span style={{ flex:1 }}>ENDPOINT</span>
          <span>LATENCY</span>
          <span>SCORE</span>
          <span>DETECTOR</span>
        </div>

        <div className="live-feed-body">
          {displayed.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              {paused ? 'Feed paused.' : 'Waiting for logs...'}
            </div>
          ) : (
            displayed.map((log, i) => <LiveLogRow key={log.id} log={log} idx={i} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
