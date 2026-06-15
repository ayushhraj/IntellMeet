import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Video, Plus, Search, Calendar, Clock, Users, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function Meetings() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchMeetings() }, [statusFilter])

  const fetchMeetings = async () => {
    try {
      const params: any = { limit: 50 }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const { data } = await api.get('/meetings', { params })
      setMeetings(data.meetings)
    } catch (error) {
      console.error('Failed to fetch meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMeetings()
  }

  const statusBadge: Record<string, string> = {
    scheduled: 'badge-warning',
    active: 'badge-success',
    ended: 'badge-primary',
    cancelled: 'badge-danger',
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>Meetings</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Manage and review all your meetings</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search meetings..." style={{ paddingLeft: 36 }} />
        </form>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'scheduled', 'active', 'ended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))
        ) : meetings.length === 0 ? (
          <div className="glass-card" style={{ padding: 64, textAlign: 'center' }}>
            <Video size={40} color="#64748b" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>No meetings found</p>
            <p style={{ fontSize: 14, color: '#64748b' }}>Start a new meeting to get going!</p>
          </div>
        ) : (
          meetings.map((m: any) => (
            <Link key={m._id} to={`/meetings/${m._id}`} className="glass-card" style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              textDecoration: 'none', cursor: 'pointer'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Video size={22} color="#a5b4fc" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{m.title}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {format(new Date(m.scheduledAt), 'MMM d, yyyy')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {format(new Date(m.scheduledAt), 'h:mm a')}
                    {m.duration ? ` • ${m.duration}min` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {m.participants?.length || 0}
                  </span>
                </div>
              </div>
              <span className={`badge ${statusBadge[m.status] || 'badge-primary'}`}>{m.status}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
