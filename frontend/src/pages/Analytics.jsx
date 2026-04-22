import React, { useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { BarChart2, Globe, TrendingUp } from 'lucide-react'
import { analyticsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { LoadingSpinner, ErrorBanner } from '../components/ui/StatusWidgets'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, boxShadow:'var(--shadow-md)', padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-muted)', marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:8, alignItems:'center' }}>
          <span>{p.name}:</span><span style={{ fontWeight:700 }}>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const fetcher = useCallback(() => analyticsApi.getAll(), [])
  const { data, loading, error, refetch } = useApi(fetcher)

  const weeklyData = data?.weeklyData || []
  const topIPs     = data?.topIPs     || []
  const attackDist = data?.attackDist || []

  if (loading) return <LoadingSpinner message="Loading analytics data..." />
  if (error)   return <ErrorBanner error={error} onRetry={refetch} />

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
          <BarChart2 size={20} color="var(--accent)" />
          <h1 style={{ fontFamily:'Inter', fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>Analytics</h1>
        </div>
        <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Traffic trends, threat patterns, and IP intelligence</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <TrendingUp size={15} color="var(--accent)" />
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Weekly Traffic</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="requests" name="Requests" fill="#2563eb" radius={[4,4,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <TrendingUp size={15} color="var(--red)" />
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Weekly Threats</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData} margin={{ top:5, right:5, left:-15, bottom:0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="threats" name="Threats" stroke="#ff4560" strokeWidth={2.5} dot={{ fill:'#ff4560', r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:18 }}>
        {/* Top IPs */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Globe size={15} color="var(--blue)" />
              <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Top Suspicious IPs</span>
            </div>
          </div>
          <table className="data-table">
            <thead><tr><th>IP ADDRESS</th><th>COUNTRY</th><th>REQUESTS</th><th>THREATS</th><th>RISK</th></tr></thead>
            <tbody>
              {topIPs.length === 0
                ? <tr><td colSpan={5} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>No IP data yet</td></tr>
                : topIPs.map((ip, i) => {
                  const riskPct = ip.requests > 0 ? Math.round((ip.threats / ip.requests) * 100) : 0
                  const riskColor = riskPct > 10 ? 'var(--red)' : riskPct > 3 ? 'var(--yellow)' : 'var(--green)'
                  return (
                    <tr key={i}>
                      <td><span style={{ fontFamily:'Inter', fontSize:12, background:'var(--bg-surface)', padding:'3px 9px', borderRadius:5, color:'var(--text-secondary)', border:'1px solid var(--border)' }}>{ip.ip}</span></td>
                      <td><span style={{ fontFamily:'Inter', fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>{ip.country}</span></td>
                      <td style={{ fontFamily:'Inter', fontSize:12, color:'var(--text-secondary)' }}>{ip.requests.toLocaleString()}</td>
                      <td style={{ fontFamily:'Inter', fontSize:12, color:'var(--red)', fontWeight:700 }}>{ip.threats}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:50, height:5, background:'var(--bg-hover)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(riskPct*5,100)}%`, height:'100%', background:riskColor }} />
                          </div>
                          <span style={{ fontSize:10, fontFamily:'Inter', color:riskColor, fontWeight:700 }}>{riskPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>

        {/* Attack Distribution */}
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <BarChart2 size={15} color="var(--yellow)" />
            <span style={{ fontFamily:'Inter', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Attack Types</span>
          </div>
          {attackDist.length === 0
            ? <div style={{ textAlign:'center', padding:30, color:'var(--text-muted)', fontSize:13 }}>No data yet</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {attackDist.map(item => {
                const maxVal = Math.max(...attackDist.map(d => d.value), 1)
                return (
                  <div key={item.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.name}</span>
                      <span style={{ fontSize:12, fontFamily:'Inter', fontWeight:700, color:'var(--text-primary)' }}>{item.value}</span>
                    </div>
                    <div style={{ height:8, background:'var(--bg-hover)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${(item.value/maxVal)*100}%`, height:'100%', background:item.fill, borderRadius:4, opacity:0.85 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          }
        </div>
      </div>
    </div>
  )
}
