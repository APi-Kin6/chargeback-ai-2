import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, LogOut, LayoutDashboard, Plus } from 'lucide-react'
import useAuthStore from '../hooks/useAuthStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--amber)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={16} color="#0a0c0f" strokeWidth={2.5} />
        </div>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 16,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Chargeback<span style={{ color: 'var(--amber)' }}>Defender</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<LayoutDashboard size={14} />} label="Dashboard" />
        <NavLink to="/dispute/new" active={isActive('/dispute/new')} icon={<Plus size={14} />} label="New Dispute" highlight />
      </div>

      {/* User section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Premium badge */}
        {user?.is_premium ? (
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: 'var(--amber)',
            padding: '3px 8px',
            borderRadius: 4,
          }}>Premium</span>
        ) : (
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}>{user?.dispute_credits || 0} credits</span>
        )}

        {/* User email */}
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {user?.email?.split('@')[0]}
        </span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 8px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  )
}

function NavLink({ to, active, icon, label, highlight }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 6,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.15s',
        background: active ? 'var(--bg-elevated)' : highlight ? 'rgba(245,158,11,0.1)' : 'transparent',
        color: active ? 'var(--text-primary)' : highlight ? 'var(--amber)' : 'var(--text-secondary)',
        border: highlight ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
