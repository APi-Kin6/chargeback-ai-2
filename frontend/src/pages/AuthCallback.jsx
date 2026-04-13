import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../hooks/useAuthStore'
import { authAPI } from '../api'

/**
 * Handles the Nas.io magic link redirect:
 * /auth/callback?token=JWT&premium=true
 * 
 * The backend already verified Nas.io membership and minted a JWT.
 * We just store it and redirect to dashboard.
 */
export default function AuthCallback() {
  const [params] = useSearchParams()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const isPremium = params.get('premium') === 'true'

    if (!token) {
      toast.error('Invalid magic link')
      navigate('/login')
      return
    }

    // Store token and fetch user profile
    localStorage.setItem('token', token)

    authAPI.me()
      .then(res => {
        setAuth(token, res.data)
        if (isPremium) {
          toast.success('🎉 Premium access activated via Nas.io!')
        } else {
          toast.success('Welcome to ChargebackDefender!')
        }
        navigate('/dashboard')
      })
      .catch(() => {
        toast.error('Failed to verify access. Please log in.')
        navigate('/login')
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 48, height: 48, background: 'var(--amber)', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse-amber 1.5s ease infinite',
      }}>
        <Shield size={24} color="#0a0c0f" />
      </div>
      <p style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
        Verifying access...
      </p>
    </div>
  )
}
