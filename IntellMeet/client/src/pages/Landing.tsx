import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Sparkles, Video, Brain, MessageSquare, BarChart3,
  Users, Shield, Zap, ArrowRight, CheckCircle2, Play
} from 'lucide-react'

const features = [
  { icon: Video, title: 'HD Video Meetings', desc: 'Crystal-clear video conferencing with screen sharing and recording for up to 50 participants', color: '#6366f1' },
  { icon: Brain, title: 'AI Meeting Intelligence', desc: 'Automatic transcription, smart summaries, and action item extraction powered by GPT-4o', color: '#8b5cf6' },
  { icon: MessageSquare, title: 'Real-Time Chat', desc: 'In-meeting chat, shared notes, and instant task creation during live sessions', color: '#ec4899' },
  { icon: BarChart3, title: 'Analytics & Insights', desc: 'Meeting frequency, productivity metrics, and engagement reports with exportable data', color: '#f59e0b' },
  { icon: Users, title: 'Team Workspaces', desc: 'Kanban project boards, task assignment, and collaborative team management', color: '#10b981' },
  { icon: Shield, title: 'Enterprise Security', desc: 'End-to-end encryption, JWT authentication, role-based access, and rate limiting', color: '#06b6d4' },
]

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<200ms', label: 'Latency' },
  { value: '50+', label: 'Participants' },
  { value: '85%+', label: 'AI Accuracy' },
]

export default function Landing() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid rgba(99,102,241,0.08)',
        position: 'sticky', top: 0, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(20px)', zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>IntellMeet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log In</Link>
              <Link to="/signup" className="btn btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '100px 48px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background effects */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '20%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 24
          }}>
            <Zap size={14} /> Powered by GPT-4o & WebRTC
          </div>

          <h1 style={{
            fontSize: 64, fontWeight: 900, lineHeight: 1.1, maxWidth: 800,
            margin: '0 auto 24px', letterSpacing: '-2px'
          }}>
            <span style={{ color: '#e2e8f0' }}>Transform Meetings</span>
            <br />
            <span className="gradient-text">Into Actionable Outcomes</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7
          }}>
            AI-powered meeting platform with real-time video conferencing, automatic transcription,
            smart summaries, and collaborative workspaces — built for modern enterprise teams.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 80 }}>
            <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              <Play size={18} /> See How It Works
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
            maxWidth: 700, margin: '0 auto'
          }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#a5b4fc' }}>{value}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, color: '#e2e8f0' }}>
            Everything You Need for <span className="gradient-text">Smarter Meetings</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 500, margin: '0 auto' }}>
            A complete suite of tools designed to make every meeting productive, organized, and actionable.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
        }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-card" style={{ padding: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16
              }}>
                <Icon size={24} color={color} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05))'
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: '#e2e8f0' }}>
          Ready to Transform Your Meetings?
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>
          Join thousands of teams using IntellMeet to boost productivity.
        </p>
        <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
          Get Started Free <ArrowRight size={18} />
        </Link>
        <div style={{
          display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24
        }}>
          {['No credit card required', 'Free forever plan', '24/7 support'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
              <CheckCircle2 size={14} color="#10b981" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px', borderTop: '1px solid rgba(99,102,241,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#6366f1" />
          <span style={{ fontSize: 14, color: '#64748b' }}>IntellMeet © 2026. Built with MERN + AI</span>
        </div>
        <div style={{ fontSize: 13, color: '#475569' }}>
          Developed by Ayush • Zidio Development
        </div>
      </footer>
    </div>
  )
}
