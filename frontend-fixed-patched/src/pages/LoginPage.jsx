import React, { useState } from 'react'
import { Shield, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const authResp = await authApi.login({ email, password })
      login(authResp)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (e, demoEmail, pw) => {
    e.preventDefault()
    setEmail(demoEmail); setPassword(pw); setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
            <Shield size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.5px' }}>SecureLog</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Sign in to your security dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Email address</label>
            <input
              className="input-field"
              type="email"
              placeholder="admin@securelog.io"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <AlertTriangle size={14} /> <span>{error}</span>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '11px', fontSize: 14, justifyContent: 'center', marginTop: 4 }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: 22, padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Demo Accounts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Admin', email: 'admin@securelog.io', pw: 'admin123' },
              { label: 'Analyst', email: 'analyst@securelog.io', pw: 'analyst123' },
            ].map(({ label, email: e, pw }) => (
              <button key={e} onClick={ev => fillDemo(ev, e, pw)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#fff', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
                onMouseOver={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={ev => ev.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{e}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Use →</span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
