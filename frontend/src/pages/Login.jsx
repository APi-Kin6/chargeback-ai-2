import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../api'
import useAuthStore from '../hooks/useAuthStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      setAuth(res.data.access_token, res.data.user)
      toast.success('Welcome back')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Sign in to your account" subtitle="Continue building dispute letters">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="seller@mystore.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
        No account?{' '}
        <Link to="/register" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, background: 'var(--amber)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="#0a0c0f" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Chargeback<span style={{ color: 'var(--amber)' }}>Defender</span>
        </span>
      </Link>

      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '36px 36px 32px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
