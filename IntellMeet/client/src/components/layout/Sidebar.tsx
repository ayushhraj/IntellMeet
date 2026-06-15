import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Video, Users, FolderKanban,
  BarChart3, LogOut, Sparkles, Settings
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meetings', icon: Video, label: 'Meetings' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  const colorIndex = user?.name ? user.name.charCodeAt(0) % avatarColors.length : 0

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 6px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.2 }}>IntellMeet</h1>
          <p style={{ fontSize: 10, color: '#64748b', fontWeight: 500, letterSpacing: '0.5px' }}>AI Meeting Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{
        borderTop: '1px solid rgba(99, 102, 241, 0.1)',
        paddingTop: 16,
        marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px' }}>
          <div
            className="avatar"
            style={{ background: avatarColors[colorIndex] }}
          >
            {user ? getInitials(user.name) : '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </p>
          </div>
          <button onClick={handleLogout} className="btn-icon btn-ghost" title="Logout" style={{ flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
