import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import useAuthStore from '../hooks/useAuthStore'
import { AuthLayout } from './Login'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register(form.email, form.password, form.full_name)
      setAuth(res.data.access_token, res.data.user)
      toast.success('Account created! You have 1 free dispute letter.')
      navigate('/dispute/new')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start winning chargebacks today">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Store / Full Name</label>
          <input className="input" type="text" placeholder="Jane's Etsy Shop" value={form.full_name} onChange={set('full_name')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="seller@mystore.com" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
        </div>

        {/* Nas.io CTA */}
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 6, padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          💡 Join the{' '}
          <a href="https://nas.io/ecommerce-defender-room" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 600 }}>
            E-Commerce Defender Room
          </a>
          {' '}on Nas.io for unlimited dispute letters + community templates.
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}
