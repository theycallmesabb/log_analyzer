import React, { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Database, Key, Save } from 'lucide-react'

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--cyan)' : 'var(--bg-hover)',
        border: `1px solid ${checked ? 'var(--cyan)' : 'var(--border-2)'}`,
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: 2, left: checked ? 22 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid var(--border)',
      gap: 20,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const [s, setS] = useState({
    emailAlerts: true, slackAlerts: false, criticalOnly: true,
    autoBlock: false, rateLimit: true, ipWhitelist: false,
    retention: '30', threshold: '0.75',
  })
  const toggle = key => setS(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 760 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <SettingsIcon size={20} color="var(--accent)" />
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure alerts, detection thresholds, and system preferences</p>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <Bell size={15} color="var(--orange)" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
        </div>
        <SettingRow label="Email Alerts" desc="Send threat alerts to admin email"><ToggleSwitch checked={s.emailAlerts} onChange={() => toggle('emailAlerts')} /></SettingRow>
        <SettingRow label="Slack Integration" desc="Post alerts to Slack channel"><ToggleSwitch checked={s.slackAlerts} onChange={() => toggle('slackAlerts')} /></SettingRow>
        <SettingRow label="Critical Only" desc="Only notify for critical severity threats"><ToggleSwitch checked={s.criticalOnly} onChange={() => toggle('criticalOnly')} /></SettingRow>
      </div>

      {/* Detection */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <Shield size={15} color="var(--red)" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Threat Detection</span>
        </div>
        <SettingRow label="Auto-Block IPs" desc="Automatically block IPs above threat threshold"><ToggleSwitch checked={s.autoBlock} onChange={() => toggle('autoBlock')} /></SettingRow>
        <SettingRow label="Rate Limiting" desc="Enable request rate limiting per IP"><ToggleSwitch checked={s.rateLimit} onChange={() => toggle('rateLimit')} /></SettingRow>
        <SettingRow label="Anomaly Threshold" desc="Minimum score to flag a log as anomalous">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              className="input-field"
              style={{ width: 80, textAlign: 'center' }}
              value={s.threshold}
              onChange={e => setS(p => ({ ...p, threshold: e.target.value }))}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 1.00</span>
          </div>
        </SettingRow>
      </div>

      {/* Data */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <Database size={15} color="var(--blue)" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Data & Storage</span>
        </div>
        <SettingRow label="Log Retention (days)" desc="How long to keep log data">
          <select className="select-field" value={s.retention} onChange={e => setS(p => ({ ...p, retention: e.target.value }))} style={{ width: 100 }}>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
        </SettingRow>
        <SettingRow label="IP Whitelist" desc="Skip anomaly checks for trusted IPs"><ToggleSwitch checked={s.ipWhitelist} onChange={() => toggle('ipWhitelist')} /></SettingRow>
      </div>

      {/* API Key */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <Key size={15} color="var(--yellow)" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>API Configuration</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>BACKEND API URL</label>
          <input className="input-field" style={{ width: '100%' }} placeholder="http://localhost:8000/api" defaultValue="http://localhost:8000/api" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>API KEY</label>
          <input className="input-field" style={{ width: '100%' }} type="password" placeholder="sk-••••••••••••••••••••" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary">
          <Save size={14} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
