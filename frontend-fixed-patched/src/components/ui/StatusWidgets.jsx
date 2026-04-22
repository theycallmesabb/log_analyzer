import React from 'react'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:14, padding:'60px 20px',
    }}>
      <Loader2 size={32} color="var(--accent)"
        style={{ animation:'spin 1s linear infinite' }} />
      <span style={{ fontSize:13, color:'var(--text-muted)' }}>{message}</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function ErrorBanner({ error, onRetry }) {
  return (
    <div style={{
      background:'var(--red-dim)', border:'1px solid var(--red-border)',
      borderRadius:10, padding:'16px 20px',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <AlertTriangle size={18} color="var(--red)" />
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:3 }}>
            Backend connection error
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
            {error} — Make sure Spring Boot is running on{' '}
            <code style={{ fontFamily:'JetBrains Mono',monospace, color:'var(--accent)' }}>localhost:8080</code>
          </div>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline"
          style={{ padding:'7px 14px', fontSize:12, flexShrink:0 }}>
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'No data found', icon }) {
  return (
    <div style={{
      textAlign:'center', padding:'40px 20px',
      color:'var(--text-muted)', fontSize:13,
    }}>
      {icon && <div style={{ marginBottom:10 }}>{icon}</div>}
      {message}
    </div>
  )
}
