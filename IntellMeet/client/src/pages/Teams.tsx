import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Plus, Copy, Check, UserPlus, Crown, Shield } from 'lucide-react'

export default function Teams() {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => { fetchTeams() }, [])

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/workspace/teams')
      setTeams(data.teams)
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    if (!newName.trim()) return
    try {
      await api.post('/workspace/teams', { name: newName, description: newDesc })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      fetchTeams()
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const joinTeam = async () => {
    if (!inviteCode.trim()) return
    try {
      await api.post('/workspace/teams/join', { inviteCode: inviteCode.trim() })
      setShowJoin(false)
      setInviteCode('')
      fetchTeams()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to join team')
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']
  const roleIcons: Record<string, any> = { owner: Crown, admin: Shield }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>Teams</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Manage your teams and collaborate</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowJoin(true)} className="btn btn-secondary">
            <UserPlus size={16} /> Join Team
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={16} /> Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ))
        ) : teams.length === 0 ? (
          <div className="glass-card" style={{ padding: 64, textAlign: 'center', gridColumn: '1 / -1' }}>
            <Users size={48} color="#64748b" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No teams yet</p>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Create your first team or join one with an invite code</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              <Plus size={16} /> Create Team
            </button>
          </div>
        ) : (
          teams.map((team, i) => (
            <div key={team._id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div className="avatar avatar-lg" style={{ background: colors[i % colors.length], borderRadius: 14 }}>
                  {getInitials(team.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{team.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{team.description || 'No description'}</p>
                </div>
              </div>

              {/* Members */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({team.members?.length || 0})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {team.members?.slice(0, 4).map((m: any, j: number) => {
                    const RoleIcon = roleIcons[m.role]
                    return (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div className="avatar avatar-sm" style={{ background: colors[j % colors.length] }}>
                          {getInitials(m.user?.name || '')}
                        </div>
                        <span style={{ color: '#e2e8f0', flex: 1 }}>{m.user?.name}</span>
                        {RoleIcon && <RoleIcon size={12} color="#f59e0b" />}
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>{m.role}</span>
                      </div>
                    )
                  })}
                  {(team.members?.length || 0) > 4 && (
                    <span style={{ fontSize: 12, color: '#64748b' }}>+{team.members.length - 4} more members</span>
                  )}
                </div>
              </div>

              {/* Invite Code */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                background: 'rgba(15,23,42,0.5)', borderRadius: 8
              }}>
                <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>
                  Invite: <code style={{ color: '#a5b4fc', fontWeight: 600 }}>{team.inviteCode}</code>
                </span>
                <button onClick={() => copyInviteCode(team.inviteCode)} className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }}>
                  {copiedCode === team.inviteCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Create Team</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Team Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="input" placeholder="e.g., Engineering Team" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="input" placeholder="What does this team work on?" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={createTeam} className="btn btn-primary" style={{ flex: 1 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Join Team</h3>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Invite Code</label>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="input" placeholder="Enter invite code" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowJoin(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={joinTeam} className="btn btn-primary" style={{ flex: 1 }}>Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
