import React, { useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Activity, AlertTriangle, Globe, Shield, TrendingUp, TrendingDown, Minus,
  Upload, ArrowRight,
} from 'lucide-react'
import { dashboardApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorBanner } from '../components/ui/StatusWidgets'
import { useNavigate } from 'react-router-dom'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow-md)', padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-muted)', marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, stat, iconBg, iconColor, accent }) {
  if (!stat) return null
  const { value, change, up } = stat
  // Determine display for special labels from backend
  const isSpecial = change === 'stable' || change === 'new data' || change === 'no activity'
  const changeColor = isSpecial
    ? 'var(--text-muted)'
    : up === true  ? 'var(--green)'
    : up === false ? 'var(--red)'
    : 'var(--text-muted)'
  return (
    <div className="stat-card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:12.5, color:'var(--text-secondary)', fontWeight:500 }}>{label}</span>
        <div style={{ width:38, height:38, borderRadius:10, background:iconBg, border:`1px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 8px ${iconColor}20` }}>
          <Icon size={17} color={iconColor} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ fontFamily:'Inter', fontSize:30, fontWeight:800, color:'var(--text-primary)', marginBottom:6, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
        {!isSpecial && up === true  && <TrendingUp  size={13} color="var(--green)" />}
        {!isSpecial && up === false && <TrendingDown size={13} color="var(--red)"  />}
        {(isSpecial || up === null) && <Minus size={13} color="var(--text-muted)" />}
        <span style={{ color: changeColor, fontWeight:600 }}>{change}</span>
        <span style={{ color:'var(--text-muted)' }}>vs last 24h</span>
      </div>
    </div>
  )
}

function AlertCard({ alert }) {
  const borderColors = { critical:'var(--red)', high:'var(--orange)', medium:'var(--yellow)', low:'var(--green)' }
  return (
    <div className={`alert-card ${alert.severity}`}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{alert.title}</span>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{alert.time}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, background:'var(--bg-surface)', padding:'2px 9px', borderRadius:5, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>{alert.ip}</span>
        <span className={`badge badge-${alert.severity}`}>{alert.severity.toUpperCase()}</span>
      </div>
    </div>
  )
}

function TimelineItem({ item }) {
  const dotColor = item.type === 'success' ? 'var(--green)' : item.type === 'error' ? 'var(--red)' : 'var(--yellow)'
  return (
    <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{ width:12, height:12, borderRadius:'50%', background:dotColor, border:`2px solid ${dotColor}55`, marginTop:3, boxShadow:`0 0 8px ${dotColor}55` }} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{item.title}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{item.time}</span>
        </div>
        <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{item.desc}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = React.useState('Last 24 Hours')
  const navigate = useNavigate()
  const fetcher = useCallback(() => dashboardApi.getSummary(), [])
  const { data, loading, error, refetch } = useApi(fetcher)

  const stats       = data?.stats         || null
  const alerts      = data?.recentAlerts  || []
  const trafficData = data?.trafficData   || []
  const attackDist  = data?.attackDist    || []
  const logTimeline = data?.logTimeline   || []

  if (loading) return <LoadingSpinner message="Loading security overview..." />
  if (error)   return <ErrorBanner error={error} onRetry={refetch} />

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <Activity size={20} color="var(--accent)" />
            <h1 className="page-title">Security Overview</h1>
          </div>
          <p className="page-subtitle">Real-time monitoring of system events and threats</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-outline" style={{ fontSize:12.5 }} onClick={() => navigate('/upload')}>
            <Upload size={13} /> Analyze Logs
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--green-dim)', border:'1px solid var(--green-border)', borderRadius:8, padding:'7px 14px' }}>
            <span className="pulse-green" />
            <span style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>System Online</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          <StatCard icon={Shield}        label="Total Logs Processed" stat={stats.totalLogs}       iconBg="var(--cyan-dim)"   iconColor="var(--cyan)"   />
          <StatCard icon={AlertTriangle} label="Active Alerts"         stat={stats.activeAlerts}   iconBg="var(--orange-dim)" iconColor="var(--orange)" />
          <StatCard icon={Globe}         label="Suspicious IPs"        stat={stats.suspiciousIPs}  iconBg="var(--blue-dim)"   iconColor="var(--blue)"   />
          <StatCard icon={Shield}        label="Blocked Threats"       stat={stats.blockedThreats} iconBg="var(--red-dim)"    iconColor="var(--red)"    />
        </div>
      )}

      {/* Traffic + Alerts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <TrendingUp size={16} color="var(--accent)" />
              <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Traffic vs Threats</span>
            </div>
            <select className="select-field" value={timeRange} onChange={e=>setTimeRange(e.target.value)} style={{ fontSize:12, padding:'6px 28px 6px 10px' }}>
              <option>Last 24 Hours</option><option>Last 7 Days</option><option>Last 30 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trafficData} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <defs>
                <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.20}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="gradThr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.25}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="requests" name="Total Requests"   stroke="#2563eb" strokeWidth={2} fill="url(#gradReq)" dot={false} />
              <Area type="monotone" dataKey="threats"  name="Threats Detected" stroke="#dc2626" strokeWidth={2} fill="url(#gradThr)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:18, marginTop:12, justifyContent:'center' }}>
            {[['#2563eb','Total Requests'],['#dc2626','Threats Detected']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-secondary)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }} />{l}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:22, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <AlertTriangle size={15} color="var(--orange)" />
              <span style={{ fontFamily:'Inter', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Recent Alerts</span>
            </div>
            <button onClick={() => navigate('/threats')} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:600, background:'none', border:'none', padding:0 }}>
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
            {alerts.length === 0
              ? <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>No recent alerts</div>
              : alerts.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      </div>

      {/* Attack Distribution + Timeline */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:20 }}>
            <Shield size={16} color="var(--yellow)" />
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Attack Distribution</span>
            {attackDist.length === 0 && (
              <span style={{ fontSize:11, color:'var(--text-muted)', background:'var(--bg-surface)', padding:'1px 8px', borderRadius:4, border:'1px solid var(--border)' }}>
                Live from DB
              </span>
            )}
          </div>
          {attackDist.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:13 }}>
              No attack data yet — upload a log file to populate
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {attackDist.map(item => {
                const maxVal = Math.max(...attackDist.map(d => d.value), 1)
                return (
                  <div key={item.name} style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <span style={{ width:90, fontSize:12, color:'var(--text-secondary)', textAlign:'right', flexShrink:0 }}>{item.name}</span>
                    <div style={{ flex:1, height:26, background:'var(--bg-surface)', borderRadius:5, overflow:'hidden', border:'1px solid var(--border)' }}>
                      <div style={{ width:`${(item.value/maxVal)*100}%`, height:'100%', background:item.fill, borderRadius:5, opacity:0.85, minWidth:8, transition:'width 0.5s ease' }} />
                    </div>
                    <span style={{ width:35, fontSize:12, fontFamily:'Inter', fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>{item.value}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:20 }}>
            <Activity size={16} color="var(--accent)" />
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Log Activity Timeline</span>
          </div>
          {logTimeline.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:13 }}>
              No recent activity
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:5, top:6, bottom:6, width:1, background:'var(--border)' }} />
              <div style={{ display:'flex', flexDirection:'column', gap:20, paddingLeft:4 }}>
                {logTimeline.map(item => <TimelineItem key={item.id} item={item} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
