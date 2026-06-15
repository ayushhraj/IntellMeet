import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@intellmeet.com')
    setPassword('Demo@123')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#020617', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
      }} />

      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>IntellMeet</span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: 36 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 4, textAlign: 'center' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, textAlign: 'center' }}>
            Sign in to your IntellMeet account
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#fca5a5'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input" placeholder="you@example.com" required
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="Enter your password" required
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', marginBottom: 16 }}>
              {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={16} />}
            </button>

            <button type="button" onClick={fillDemo} className="btn btn-secondary"
              style={{ width: '100%', fontSize: 13 }}>
              Use Demo Account
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
