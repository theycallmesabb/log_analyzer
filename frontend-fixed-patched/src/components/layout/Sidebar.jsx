import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, ShieldAlert, BarChart2,
  Settings, LogOut, Shield, Server, Zap, Menu, X, Upload
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/logs',      icon: FileText,        label: 'Logs'             },
  { to: '/threats',   icon: ShieldAlert,     label: 'Threat Detection' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'        },
  { to: '/sources',   icon: Server,          label: 'Log Sources'      },
  { to: '/live',      icon: Zap,             label: 'Live Feed'        },
  { to: '/upload',    icon: Upload,          label: 'Upload Logs', dividerBefore: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-shield">
          <Shield size={18} color="#ffffff" strokeWidth={2} />
        </div>
        <div>
          <div className="logo-text">SecureLog</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 }}>
            Security Platform
          </div>
        </div>
        <button className="sidebar-mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user.fullName?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{user.role}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, dividerBefore }) => (
          <React.Fragment key={to}>
            {dividerBefore && <div className="divider" style={{ background: 'rgba(255,255,255,0.07)', margin: '6px 2px' }} />}
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          </React.Fragment>
        ))}

        <div style={{ flex: 1 }} />

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}>
          <Settings size={16} strokeWidth={1.8} />
          Settings
        </NavLink>

        <div className="nav-item logout" onClick={handleLogout} role="button">
          <LogOut size={16} strokeWidth={1.8} />
          Logout
        </div>
      </nav>
    </aside>
  )

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={20} color="var(--text-secondary)" />
      </button>
      <div className="sidebar-desktop"><SidebarContent /></div>
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div onClick={e => e.stopPropagation()}><SidebarContent /></div>
        </div>
      )}
    </>
  )
}
