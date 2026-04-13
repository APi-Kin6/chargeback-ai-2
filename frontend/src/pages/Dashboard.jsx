import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import useAuthStore from '../hooks/useAuthStore'
import { disputeAPI, authAPI } from '../api'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'var(--text-muted)', icon: <Clock size={12} /> },
  processing: { label: 'Processing', color: 'var(--amber)', icon: <Clock size={12} /> },
  complete: { label: 'Complete', color: 'var(--green)', icon: <CheckCircle size={12} /> },
  submitted: { label: 'Submitted', color: 'var(--blue)', icon: <CheckCircle size={12} /> },
}

function WinBadge({ prob }) {
  if (!prob) return null
  const pct = Math.round(prob * 100)
  const color = pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)'
  return (
    <span style={{
      fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700,
      color, background: `${color}14`, border: `1px solid ${color}30`,
      padding: '2px 8px', borderRadius: 4,
    }}>{pct}%</span>
  )
}

export default function Dashboard() {
  const { user, updateUser } = useAuthStore()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      disputeAPI.list(),
      authAPI.me(),
    ]).then(([disputeRes, meRes]) => {
      setDisputes(disputeRes.data)
      updateUser(meRes.data)
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const completedDisputes = disputes.filter(d => d.status === 'complete')
  const avgWinProb = completedDisputes.length
    ? Math.round(completedDisputes.reduce((sum, d) => sum + (d.win_probability || 0), 0) / completedDisputes.length * 100)
    : null

  const totalRecoverable = disputes.reduce((sum, d) => sum + (d.dispute_amount || 0), 0)

  const hasPremiumAccess = user?.is_premium || user?.dispute_credits > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 4 }}>Defense Room</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Space Mono' }}>
              {disputes.length} dispute{disputes.length !== 1 ? 's' : ''} on file
            </p>
          </div>
          <Link to="/dispute/new">
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={15} />
              New Dispute
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard
            icon={<TrendingUp size={16} color="var(--amber)" />}
            label="Avg Win Probability"
            value={avgWinProb != null ? `${avgWinProb}%` : '—'}
            sub="across completed disputes"
          />
          <StatCard
            icon={<FileText size={16} color="var(--blue)" />}
            label="Total Disputes"
            value={disputes.length}
            sub={`${completedDisputes.length} letters generated`}
          />
          <StatCard
            icon={<CreditCard size={16} color="var(--green)" />}
            label="Amount at Stake"
            value={`$${totalRecoverable.toLocaleString()}`}
            sub="across all disputes"
          />
        </div>

        {/* Premium gate banner */}
        {!hasPremiumAccess && (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8, padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 28,
          }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No dispute credits remaining</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Purchase dispute credits or join the community for unlimited access.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <a href="https://nas.io/ecommerce-defender-room" target="_blank" rel="noopener noreferrer">
                <button className="btn-primary" style={{ fontSize: 13, padding: '9px 18px', whiteSpace: 'nowrap' }}>
                  Join Community
                </button>
              </a>
              <button className="btn-secondary" style={{ fontSize: 13, padding: '9px 18px', whiteSpace: 'nowrap' }}>
                Buy $9 Credit
              </button>
            </div>
          </div>
        )}

        {/* Dispute list */}
        <div>
          <p className="label" style={{ marginBottom: 14 }}>Your Disputes</p>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Space Mono', fontSize: 12 }}>
              Loading...
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {disputes.map(d => (
                <DisputeRow key={d.id} dispute={d} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <span className="label" style={{ margin: 0 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function DisputeRow({ dispute }) {
  const cfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.draft
  return (
    <Link to={`/dispute/${dispute.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
      >
        {/* Platform badge */}
        <span style={{
          fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
          padding: '3px 8px', borderRadius: 4, minWidth: 60, textAlign: 'center',
        }}>{dispute.platform}</span>

        {/* Reason code */}
        <span style={{
          fontFamily: 'Space Mono', fontSize: 11, color: 'var(--amber)',
          background: 'rgba(245,158,11,0.08)', padding: '3px 8px', borderRadius: 4,
        }}>{dispute.reason_code}</span>

        {/* Order + amount */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {dispute.order_id ? `Order #${dispute.order_id}` : 'Unnamed Dispute'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            ${dispute.dispute_amount?.toFixed(2)} · {new Date(dispute.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Win probability */}
        <WinBadge prob={dispute.win_probability} />

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, color: cfg.color,
          fontFamily: 'Space Mono', letterSpacing: '0.04em',
        }}>
          {cfg.icon}
          {cfg.label}
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div style={{
      border: '1px dashed var(--border-bright)', borderRadius: 8,
      padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 16, opacity: 0.3 }}>
        <FileText size={40} style={{ margin: '0 auto' }} />
      </div>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>No disputes yet</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Build your first AI-generated dispute rebuttal letter
      </p>
      <Link to="/dispute/new">
        <button className="btn-primary">Create First Dispute Letter</button>
      </Link>
    </div>
  )
}
