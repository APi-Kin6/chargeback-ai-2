import { Link } from 'react-router-dom'
import { Shield, TrendingUp, Clock, FileText, CheckCircle, AlertTriangle, ArrowRight, Zap } from 'lucide-react'

const STATS = [
  { value: '$1.5B+', label: 'Lost to chargebacks annually' },
  { value: '~20%', label: 'Average DIY win rate' },
  { value: '60–80%', label: 'Win rate with our letters' },
  { value: '10 min', label: 'vs. 3–5 hrs manual work' },
]

const STEPS = [
  { n: '01', title: 'Enter dispute details', desc: 'Platform, reason code, order info — takes under 2 minutes.' },
  { n: '02', title: 'Upload your evidence', desc: 'Drop in tracking screenshots, chat logs, ToS acceptance. We OCR everything.' },
  { n: '03', title: 'AI builds your rebuttal', desc: 'Claude maps your evidence to the exact Visa/MC arbitration framework for your code.' },
  { n: '04', title: 'Download & submit', desc: 'Get a formatted letter + evidence checklist + submission instructions per platform.' },
]

const PLATFORMS = ['Shopify', 'Etsy', 'Amazon', 'PayPal', 'Stripe']

const REASON_CODES = [
  { code: '4853', label: 'Not as Described', network: 'Visa' },
  { code: '4855', label: 'Non-Receipt', network: 'Visa' },
  { code: '13.1', label: 'Not Received', network: 'MC' },
  { code: '13.3', label: 'Not as Described', network: 'MC' },
  { code: 'UA02', label: 'Unauthorized', network: 'PayPal' },
]

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'rgba(10,12,15,0.95)',
        backdropFilter: 'blur(12px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--amber)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={17} color="#0a0c0f" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
            Chargeback<span style={{ color: 'var(--amber)' }}>Defender</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Sign in
          </Link>
          <Link to="/register">
            <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
              Start Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '100px 40px 80px',
        maxWidth: 900, margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 20, padding: '6px 14px', marginBottom: 32,
        }}>
          <Zap size={12} color="var(--amber)" />
          <span style={{ fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--amber)', textTransform: 'uppercase' }}>
            AI-Powered Dispute Defense
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', marginBottom: 24, lineHeight: 1.08 }}>
          Stop Losing Money<br />
          <span style={{ color: 'var(--amber)' }}>to Bad Dispute Letters</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto 16px', lineHeight: 1.7 }}>
          E-commerce sellers lose $200–$2,000 per chargeback — not because the dispute is invalid,
          but because their response letters are wrong. We fix that.
        </p>

        <p style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-muted)', marginBottom: 48 }}>
          Works with Shopify · Etsy · Amazon · PayPal · Stripe
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register">
            <button className="btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}>
              Build Your First Dispute Letter →
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="btn-secondary" style={{ fontSize: 15, padding: '14px 28px' }}>
              See How It Works
            </button>
          </a>
        </div>

        {/* Pay-per-dispute pricing note */}
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          $9 per dispute · or join the{' '}
          <a href="https://nas.io/ecommerce-defender-room" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--amber)', textDecoration: 'none' }}>
            E-Commerce Defender Room
          </a>
          {' '}for unlimited access
        </p>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '32px 40px',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Syne', fontWeight: 800, fontSize: 32,
                color: 'var(--amber)', letterSpacing: '-0.03em', marginBottom: 4,
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Space Mono', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: '80px 40px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '32px 36px',
          display: 'flex', gap: 24, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={28} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ fontSize: 20, marginBottom: 12, color: 'var(--text-primary)' }}>
              Payment processors give you 7 days. Most sellers spend it writing the wrong letter.
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
              Visa and Mastercard use strict arbitration frameworks — reason code 4853 requires different
              evidence than 4855. A generic "I shipped it" letter gets auto-denied. Our tool maps your
              evidence directly to the format processors require, raising win rates from ~20% to 60–80%.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '60px 40px 80px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.1em', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: 12 }}>Process</p>
          <h2 style={{ fontSize: 38 }}>From dispute to letter in 10 minutes</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} className="card" style={{ padding: '28px 28px 24px' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.1em',
                color: 'var(--amber)', marginBottom: 14, textTransform: 'uppercase',
              }}>{step.n}</div>
              <h4 style={{ fontSize: 17, marginBottom: 10 }}>{step.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORMS & CODES ── */}
      <section style={{
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '56px 40px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
            <div>
              <p style={{ fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20 }}>Supported Platforms</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {PLATFORMS.map(p => (
                  <span key={p} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                    borderRadius: 6, padding: '7px 14px',
                    fontFamily: 'Syne', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                  }}>{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20 }}>Reason Codes Supported</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REASON_CODES.map(r => (
                  <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: 'Space Mono', fontSize: 12, color: 'var(--amber)',
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                      padding: '2px 8px', borderRadius: 4, minWidth: 52, textAlign: 'center',
                    }}>{r.code}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono', marginLeft: 'auto' }}>{r.network}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPETITIVE TABLE ── */}
      <section style={{ padding: '80px 40px', maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ fontSize: 34, textAlign: 'center', marginBottom: 40 }}>Why not DIY or enterprise tools?</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Method', 'Cost', 'Time', 'Win Rate'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { m: 'Manual DIY', c: '$0', t: '3–5 hrs', w: '~20%', highlight: false },
                { m: 'Chargeback911', c: '$500+/mo', t: 'Outsourced', w: 'Enterprise only', highlight: false },
                { m: 'ChargebackDefender', c: '$9/dispute', t: '10 min', w: '60–80%', highlight: true },
              ].map((row, i) => (
                <tr key={i} style={{
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  background: row.highlight ? 'rgba(245,158,11,0.04)' : 'transparent',
                }}>
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: row.highlight ? 600 : 400, color: row.highlight ? 'var(--amber)' : 'var(--text-primary)' }}>
                    {row.highlight && <Shield size={13} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />}
                    {row.m}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: row.highlight ? 'Space Mono' : 'inherit' }}>{row.c}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: row.highlight ? 'var(--green)' : 'var(--text-secondary)' }}>{row.t}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: row.highlight ? 700 : 400, color: row.highlight ? 'var(--green)' : 'var(--text-secondary)' }}>{row.w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA BLOCK ── */}
      <section style={{
        padding: '80px 40px', textAlign: 'center',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
      }}>
        <p style={{ fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.1em', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: 16 }}>Start now</p>
        <h2 style={{ fontSize: 42, marginBottom: 16 }}>
          Pay $9. Recover $500.<br />
          <span style={{ color: 'var(--amber)' }}>Win rate jumps to 65%.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>
          No subscription required. One dispute, one letter, one upload.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/register">
            <button className="btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}>
              Get Started — $9/dispute
            </button>
          </Link>
          <a href="https://nas.io/ecommerce-defender-room" target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary" style={{ fontSize: 15, padding: '14px 28px' }}>
              Join Community (Unlimited Access)
            </button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '28px 40px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-muted)' }}>
          © 2025 ChargebackDefender
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
