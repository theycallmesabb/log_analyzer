import React, { useState } from 'react'
import { Shield, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const strength = () => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8)            s++
    if (/[A-Z]/.test(p))          s++
    if (/[0-9]/.test(p))          s++
    if (/[^A-Za-z0-9]/.test(p))  s++
    return s
  }
  const s = strength()
  const strengthColor = s <= 1 ? 'var(--red)' : s === 2 ? 'var(--yellow)' : s === 3 ? 'var(--orange)' : 'var(--green)'
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][s]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) { setError('Full name is required'); return }
    if (!form.email.includes('@')) { setError('Enter a valid email'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const resp = await authApi.register({ fullName: form.fullName, email: form.email, password: form.password })
      login(resp)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-grid" />
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-logo">
          <div className="logo-shield-lg">
            <Shield size={28} color="#00d4d4" strokeWidth={1.8} />
          </div>
          <div>
            <div className="auth-brand">SecureLog</div>
            <div className="auth-brand-sub">Create your account</div>
          </div>
        </div>

        <h2 className="auth-title">Join the security team</h2>
        <p className="auth-subtitle">Start monitoring threats in minutes.</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} color="var(--red)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <input className="input-field" placeholder="John Smith"
              value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="auth-field">
            <label>Email address</label>
            <input type="email" className="input-field" placeholder="you@company.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} className="input-field" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ paddingRight: 42 }} />
              <button type="button" className="auth-eye" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
                    background: i <= s ? strengthColor : 'var(--border-2)' }} />
                ))}
                <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
              </div>
            )}
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type="password" className="input-field" placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                style={{ paddingRight: 42 }} />
              {form.confirm && form.confirm === form.password &&
                <CheckCircle size={15} color="var(--green)" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }} />}
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
