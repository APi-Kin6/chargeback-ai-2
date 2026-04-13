import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { disputeAPI } from '../api'

const PLATFORMS = ['shopify', 'etsy', 'amazon', 'paypal', 'stripe']
const REASON_CODES = [
  { code: '4853', label: 'Not as Described / Defective', network: 'Visa' },
  { code: '4855', label: 'Non-Receipt of Merchandise', network: 'Visa' },
  { code: '13.1', label: 'Merchandise / Services Not Received', network: 'MC' },
  { code: '13.3', label: 'Not as Described', network: 'MC' },
  { code: 'UA02', label: 'Unauthorized Transaction', network: 'PayPal' },
  { code: 'R13',  label: 'No Reply to Retrieval', network: 'MC' },
]

const STEPS = ['Details', 'Evidence', 'Generate']

export default function DisputeBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [disputeId, setDisputeId] = useState(null)

  const [form, setForm] = useState({
    platform: '',
    reason_code: '',
    dispute_amount: '',
    order_id: '',
    order_date: '',
    product_description: '',
    delivery_confirmation: '',
  })

  const [files, setFiles] = useState({
    tracking: null,
    chat_logs: null,
    tos_screenshot: null,
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Step 1: Create dispute ─────────────────────────────────────────
  const handleCreateDispute = async () => {
    if (!form.platform || !form.reason_code || !form.dispute_amount) {
      toast.error('Platform, reason code, and amount are required')
      return
    }
    setLoading(true)
    try {
      const res = await disputeAPI.create({
        ...form,
        dispute_amount: parseFloat(form.dispute_amount),
      })
      setDisputeId(res.data.id)
      setStep(1)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 402) {
        toast.error('No dispute credits. Join the community or buy credits.')
      } else {
        toast.error(detail || 'Failed to create dispute')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Upload evidence ────────────────────────────────────────
  const handleUploadEvidence = async () => {
    if (!files.tracking && !files.chat_logs && !files.tos_screenshot) {
      // Evidence is optional — proceed without it
      toast('Proceeding without evidence uploads. Letter will still be generated.', { icon: '⚠️' })
      setStep(2)
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      if (files.tracking) formData.append('tracking', files.tracking)
      if (files.chat_logs) formData.append('chat_logs', files.chat_logs)
      if (files.tos_screenshot) formData.append('tos_screenshot', files.tos_screenshot)
      await disputeAPI.uploadEvidence(disputeId, formData)
      toast.success('Evidence uploaded and scanned')
      setStep(2)
    } catch {
      toast.error('Evidence upload failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Generate letter ────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true)
    try {
      toast.loading('AI is building your dispute letter...', { id: 'gen' })
      await disputeAPI.generate(disputeId)
      toast.success('Letter generated!', { id: 'gen' })
      navigate(`/dispute/${disputeId}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed', { id: 'gen' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
                <span style={{
                  fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: i === step ? 'var(--amber)' : i < step ? 'var(--green)' : 'var(--text-muted)',
                }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 32, height: 1, background: i < step ? 'var(--green)' : 'var(--border-bright)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Dispute Details ── */}
        {step === 0 && (
          <div className="fade-up">
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>Dispute Details</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
              Tell us about the chargeback so we can target the right rebuttal framework.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Platform *</label>
                  <select className="input" value={form.platform} onChange={set('platform')}>
                    <option value="">Select platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Disputed Amount ($) *</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="249.99" value={form.dispute_amount} onChange={set('dispute_amount')} />
                </div>
              </div>

              <div>
                <label className="label">Reason Code *</label>
                <select className="input" value={form.reason_code} onChange={set('reason_code')}>
                  <option value="">Select reason code</option>
                  {REASON_CODES.map(r => (
                    <option key={r.code} value={r.code}>{r.code} — {r.label} ({r.network})</option>
                  ))}
                </select>
              </div>

              {form.reason_code && (
                <ReasonCodeHint code={form.reason_code} />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Order ID</label>
                  <input className="input" placeholder="12345678" value={form.order_id} onChange={set('order_id')} />
                </div>
                <div>
                  <label className="label">Order Date</label>
                  <input className="input" type="date" value={form.order_date} onChange={set('order_date')} />
                </div>
              </div>

              <div>
                <label className="label">Product Description</label>
                <textarea className="input" rows={3} placeholder="Handmade ceramic mug, 12oz, blue glaze..." value={form.product_description} onChange={set('product_description')} style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label className="label">Delivery Confirmation</label>
                <input className="input" placeholder="USPS tracking 9400111899223397103365" value={form.delivery_confirmation} onChange={set('delivery_confirmation')} />
              </div>

              <button className="btn-primary" onClick={handleCreateDispute} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? 'Saving...' : <>Continue <ArrowRight size={15} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Evidence Upload ── */}
        {step === 1 && (
          <div className="fade-up">
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>Upload Evidence</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
              We'll OCR your files and extract key facts to strengthen your letter. All uploads are optional but improve win probability.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EvidenceDropzone
                label="Tracking / Delivery Confirmation"
                hint="Screenshot from USPS, FedEx, UPS, DHL"
                onFile={f => setFiles(p => ({ ...p, tracking: f }))}
                file={files.tracking}
              />
              <EvidenceDropzone
                label="Customer Chat Logs"
                hint="Etsy Messages, Shopify inbox, email thread"
                onFile={f => setFiles(p => ({ ...p, chat_logs: f }))}
                file={files.chat_logs}
              />
              <EvidenceDropzone
                label="Terms of Service / Refund Policy"
                hint="Screenshot of your store policy page or ToS"
                onFile={f => setFiles(p => ({ ...p, tos_screenshot: f }))}
                file={files.tos_screenshot}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button className="btn-primary" onClick={handleUploadEvidence} disabled={loading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? 'Uploading...' : <>Continue <ArrowRight size={15} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Generate ── */}
        {step === 2 && (
          <div className="fade-up">
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>Generate Letter</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
              Claude will now build a formal dispute rebuttal matched to Visa/MC arbitration rules for your reason code.
            </p>

            <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
              <p className="label" style={{ marginBottom: 12 }}>What you'll get</p>
              {[
                'Formal dispute letter (500–900 words)',
                'Evidence checklist (provided / missing / critical gaps)',
                'Win probability score with explanation',
                'Platform-specific submission instructions',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <CheckCircle size={14} color="var(--green)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 6, padding: '14px 16px', fontSize: 12,
              color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6,
            }}>
              ⚡ This uses 1 dispute credit or 1 use of your premium subscription.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button className="btn-primary" onClick={handleGenerate} disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Zap size={15} />
                {loading ? 'AI is writing your letter...' : 'Generate Dispute Letter'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

function EvidenceDropzone({ label, hint, onFile, file }) {
  const onDrop = useCallback(accepted => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  return (
    <div>
      <label className="label">{label}</label>
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--amber)' : file ? 'var(--green)' : 'var(--border-bright)'}`,
        borderRadius: 8, padding: '22px', cursor: 'pointer',
        background: isDragActive ? 'var(--amber-glow)' : file ? 'rgba(16,185,129,0.04)' : 'var(--bg-elevated)',
        transition: 'all 0.15s', textAlign: 'center',
      }}>
        <input {...getInputProps()} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ fontSize: 13, color: 'var(--green)' }}>{file.name}</span>
          </div>
        ) : (
          <div>
            <Upload size={20} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {isDragActive ? 'Drop here' : 'Drop file or click to upload'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Space Mono' }}>{hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReasonCodeHint({ code }) {
  const hints = {
    '4853': { angle: 'Prove product matched listing + no pre-dispute complaint', items: ['Product photos', 'Listing screenshot', 'Chat showing no complaint'] },
    '4855': { angle: 'Carrier delivery proof is primary evidence', items: ['Tracking confirmation', 'Delivery address match'] },
    '13.1': { angle: 'Document all delivery confirmation events', items: ['Tracking + delivery confirmation', 'Order email sent to buyer'] },
    '13.3': { angle: 'Show listing accuracy and policy acceptance', items: ['Product listing match', 'Return policy', 'No pre-dispute complaints'] },
    'UA02': { angle: 'Behavioral + technical proof of authorization', items: ['IP match', 'Delivery to account address', 'Prior orders from same account'] },
  }
  const h = hints[code]
  if (!h) return null
  return (
    <div style={{
      background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: 6, padding: '12px 14px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--blue)', fontWeight: 600, marginBottom: 6 }}>Strategy for {code}: {h.angle}</p>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Key evidence to gather:</p>
      {h.items.map(i => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--blue)' }}>→</span> {i}
        </div>
      ))}
    </div>
  )
}
