import React, { useState, useCallback } from 'react'
import { Bell, RefreshCw, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { threatsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'

export default function Topbar() {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')

  const alertFetcher = useCallback(() => threatsApi.getCounts(), [])
  const { data: counts } = useApi(alertFetcher)
  // Show badge if any critical or high threats
  const unread = counts ? (counts.critical || 0) + (counts.high || 0) : 0

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/logs?q=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  return (
    <div className="topbar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search logs, IPs, endpoints… (Enter)"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
            style={{
              width: '100%', height: 34, paddingLeft: 34, paddingRight: searchVal ? 30 : 12,
              border: '1.5px solid var(--border)', borderRadius: 8,
              background: 'var(--bg-surface)', fontSize: 12.5, color: 'var(--text-primary)',
              outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {searchVal && (
            <button onClick={() => setSearchVal('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button title="Refresh page" onClick={() => window.location.reload()}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.12s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <RefreshCw size={14} />
        </button>

        <button onClick={() => navigate('/threats')} title="View threats"
          style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.12s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <Bell size={15} />
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid #fff', animation: 'pulse-red 1.5s infinite' }} />
          )}
        </button>

        {counts && (
          <div style={{ display: 'flex', gap: 4 }}>
            {counts.critical > 0 && (
              <span className="badge badge-critical" style={{ fontSize: 10 }}>{counts.critical} Critical</span>
            )}
            {counts.high > 0 && !counts.critical && (
              <span className="badge badge-high" style={{ fontSize: 10 }}>{counts.high} High</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
          <span className="pulse-green" />
          <span style={{ fontWeight: 600, color: 'var(--green)' }}>Live</span>
        </div>
      </div>
    </div>
  )
}
