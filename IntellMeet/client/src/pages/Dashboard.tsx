import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import {
  Video, Clock, CheckCircle2, TrendingUp, Plus, ArrowRight,
  Calendar, Users, Zap, Play
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentMeetings, setRecentMeetings] = useState<any[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/meetings/dashboard')
      setStats(data.stats)
      setRecentMeetings(data.recentMeetings)
      setUpcomingMeetings(data.upcomingMeetings)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInstantMeeting = async () => {
    try {
      const { data } = await api.post('/meetings', {
        title: newTitle || 'Quick Meeting',
      })
      navigate(`/meeting/${data.meeting.roomId}`)
    } catch (error) {
      console.error('Failed to create meeting:', error)
    }
  }

  const statCards = [
    { icon: Video, label: 'Total Meetings', value: stats?.totalMeetings || 0, color: '#6366f1' },
    { icon: Clock, label: 'Hours in Meetings', value: stats?.totalHours || 0, color: '#8b5cf6' },
    { icon: CheckCircle2, label: 'Action Items', value: stats?.pendingActions || 0, color: '#f59e0b', suffix: ' pending' },
    { icon: TrendingUp, label: 'Completed', value: stats?.completedMeetings || 0, color: '#10b981' },
  ]

  const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const statusColor: Record<string, string> = {
    scheduled: '#f59e0b',
    active: '#10b981',
    ended: '#64748b',
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Here's what's happening with your meetings today
          </p>
        </div>
        <button onClick={() => setShowNewMeeting(true)} className="btn btn-primary">
          <Plus size={18} /> New Meeting
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ icon: Icon, label, value, color, suffix }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div className="stat-value" style={{ color }}>{value}{suffix || ''}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Meetings */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Recent Meetings</h2>
            <Link to="/meetings" style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />
              ))
            ) : recentMeetings.length === 0 ? (
              <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: 32 }}>No meetings yet. Start your first one!</p>
            ) : (
              recentMeetings.map((meeting: any) => (
                <Link key={meeting._id} to={`/meetings/${meeting._id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 10, background: 'rgba(15,23,42,0.4)', textDecoration: 'none',
                  transition: 'background 0.2s ease', cursor: 'pointer'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.4)')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Video size={18} color="#a5b4fc" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meeting.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {format(new Date(meeting.scheduledAt), 'MMM d, yyyy • h:mm a')}
                      {meeting.duration ? ` • ${meeting.duration}min` : ''}
                    </p>
                  </div>
                  <span className={`badge badge-${meeting.status === 'ended' ? 'primary' : meeting.status === 'active' ? 'success' : 'warning'}`}>
                    {meeting.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Upcoming</h2>
            <Calendar size={16} color="#64748b" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />
              ))
            ) : upcomingMeetings.length === 0 ? (
              <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: 32 }}>No upcoming meetings</p>
            ) : (
              upcomingMeetings.map((meeting: any) => (
                <div key={meeting._id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 10, background: 'rgba(15,23,42,0.4)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Calendar size={18} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{meeting.title}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {format(new Date(meeting.scheduledAt), 'MMM d • h:mm a')}
                    </p>
                  </div>
                  <button onClick={() => navigate(`/meeting/${meeting.roomId}`)} className="btn btn-sm btn-secondary">
                    <Play size={14} /> Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
        <button onClick={() => setShowNewMeeting(true)} className="glass-card" style={{
          padding: 24, textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(99,102,241,0.15)'
        }}>
          <Zap size={24} color="#6366f1" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Instant Meeting</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Start a meeting right now</p>
        </button>
        <Link to="/teams" className="glass-card" style={{
          padding: 24, textAlign: 'center', cursor: 'pointer', textDecoration: 'none',
          border: '1px solid rgba(99,102,241,0.15)'
        }}>
          <Users size={24} color="#8b5cf6" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Team Workspace</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Manage your teams</p>
        </Link>
        <Link to="/analytics" className="glass-card" style={{
          padding: 24, textAlign: 'center', cursor: 'pointer', textDecoration: 'none',
          border: '1px solid rgba(99,102,241,0.15)'
        }}>
          <TrendingUp size={24} color="#10b981" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>View Analytics</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Meeting insights & reports</p>
        </Link>
      </div>

      {/* New Meeting Modal */}
      {showNewMeeting && (
        <div className="modal-overlay" onClick={() => setShowNewMeeting(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Start New Meeting</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Create an instant meeting room</p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Meeting Title (optional)
              </label>
              <input
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="input" placeholder="e.g., Team Standup"
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowNewMeeting(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={createInstantMeeting} className="btn btn-primary" style={{ flex: 1 }}>
                <Video size={16} /> Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
