import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, CheckCircle, AlertCircle, XCircle, ArrowLeft, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { disputeAPI } from '../api'

export default function DisputeResult() {
  const { id } = useParams()
  const [dispute, setDispute] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    disputeAPI.get(id)
      .then(res => setDispute(res.data))
      .catch(() => toast.error('Failed to load dispute'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    try {
      const res = await disputeAPI.download(id)
      const blob = new Blob([res.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dispute_${dispute.order_id || id.slice(0,8)}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  const handleCopy = () => {
    if (dispute?.dispute_letter) {
      navigator.clipboard.writeText(dispute.dispute_letter)
      toast.success('Letter copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
          <span style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-muted)' }}>Loading dispute...</span>
        </div>
      </div>
    )
  }

  if (!dispute) return null

  const winPct = dispute.win_probability ? Math.round(dispute.win_probability * 100) : null
  const winColor = winPct >= 60 ? 'var(--green)' : winPct >= 40 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back */}
        <Link to="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 28,
        }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <PlatformBadge label={dispute.platform} />
              <CodeBadge code={dispute.reason_code} />
              {dispute.status === 'complete' && (
                <span style={{
                  fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                  color: 'var(--green)', padding: '3px 8px', borderRadius: 4,
                }}>Complete</span>
              )}
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>
              {dispute.order_id ? `Order #${dispute.order_id}` : 'Dispute Letter'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              ${dispute.dispute_amount?.toFixed(2)} · {new Date(dispute.created_at).toLocaleDateString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Copy size={13} /> Copy
            </button>
            <button className="btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 18px' }}>
              <Download size={13} /> Download Letter
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── LETTER ── */}
          <div>
            {dispute.dispute_letter ? (
              <div className="card" style={{ padding: '28px 32px' }}>
                <p className="label" style={{ marginBottom: 16 }}>Dispute Letter</p>
                <div style={{
                  fontFamily: 'Inter, serif', fontSize: 13.5, lineHeight: 1.85,
                  color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
                  borderLeft: '2px solid var(--amber)',
                  paddingLeft: 20,
                }}>
                  {dispute.dispute_letter}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {dispute.status === 'processing' ? 'Letter is being generated...' : 'No letter generated yet'}
                </p>
                {dispute.status === 'draft' && (
                  <Link to={`/dispute/new`}>
                    <button className="btn-primary" style={{ marginTop: 16 }}>Generate Letter</button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Win probability */}
            {winPct !== null && (
              <div className="card" style={{ padding: '20px 22px' }}>
                <p className="label" style={{ marginBottom: 12 }}>Win Probability</p>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{
                    fontFamily: 'Syne', fontWeight: 800, fontSize: 48,
                    color: winColor, letterSpacing: '-0.03em', lineHeight: 1,
                  }}>{winPct}%</div>
                </div>
                {/* Gauge bar */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${winPct}%`,
                    background: winColor,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                {dispute.win_probability_explanation && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {dispute.win_probability_explanation}
                  </p>
                )}
              </div>
            )}

            {/* Evidence checklist */}
            {dispute.evidence_checklist && (
              <div className="card" style={{ padding: '20px 22px' }}>
                <p className="label" style={{ marginBottom: 14 }}>Evidence Checklist</p>

                {dispute.evidence_checklist.provided?.length > 0 && (
                  <ChecklistSection
                    title="Provided"
                    items={dispute.evidence_checklist.provided}
                    icon={<CheckCircle size={12} color="var(--green)" />}
                    color="var(--green)"
                  />
                )}
                {dispute.evidence_checklist.missing?.length > 0 && (
                  <ChecklistSection
                    title="Missing"
                    items={dispute.evidence_checklist.missing}
                    icon={<AlertCircle size={12} color="var(--amber)" />}
                    color="var(--amber)"
                  />
                )}
                {dispute.evidence_checklist.critical_missing?.length > 0 && (
                  <ChecklistSection
                    title="Critical Gap"
                    items={dispute.evidence_checklist.critical_missing}
                    icon={<XCircle size={12} color="var(--red)" />}
                    color="var(--red)"
                  />
                )}
              </div>
            )}

            {/* Nas.io upsell */}
            <div style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '16px 18px',
            }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Want unlimited letters?
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                Join the E-Commerce Defender Room community on Nas.io for unlimited disputes + shared win templates.
              </p>
              <a href="https://nas.io/ecommerce-defender-room" target="_blank" rel="noopener noreferrer">
                <button className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '9px' }}>
                  Join Community →
                </button>
              </a>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

function PlatformBadge({ label }) {
  return (
    <span style={{
      fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)', background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)', padding: '3px 8px', borderRadius: 4,
    }}>{label}</span>
  )
}

function CodeBadge({ code }) {
  return (
    <span style={{
      fontFamily: 'Space Mono', fontSize: 11, color: 'var(--amber)',
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
      padding: '3px 8px', borderRadius: 4,
    }}>{code}</span>
  )
}

function ChecklistSection({ title, items, icon, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontFamily: 'Space Mono', color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{title}</p>
      {items.map(item => (
        <div key={item} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}
