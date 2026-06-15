import { useState, useEffect } from 'react'
import api from '../lib/api'
import {
  BarChart3, TrendingUp, Clock, Users, CheckCircle2, Video,
  Calendar, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/analytics', { params: { period } })
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const tasksPieData = analytics?.tasksByStatus
    ? Object.entries(analytics.tasksByStatus).map(([name, value]) => ({ name, value }))
    : []

  const statusPieData = analytics?.statusDistribution
    ? Object.entries(analytics.statusDistribution).filter(([, v]) => (v as number) > 0).map(([name, value]) => ({ name, value }))
    : []

  const customTooltipStyle = {
    background: '#0f172a',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    color: '#e2e8f0',
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>Analytics & Insights</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Meeting statistics and productivity metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: '7', l: '7 days' }, { v: '30', l: '30 days' }, { v: '90', l: '90 days' }].map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`btn btn-sm ${period === p.v ? 'btn-primary' : 'btn-ghost'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { icon: Video, label: 'Total Meetings', value: analytics?.totalMeetings || 0, color: '#6366f1' },
              { icon: Clock, label: 'Avg Duration', value: `${analytics?.avgDuration || 0}min`, color: '#8b5cf6' },
              { icon: Users, label: 'Avg Participants', value: analytics?.avgParticipants || 0, color: '#f59e0b' },
              { icon: CheckCircle2, label: 'Action Items Done', value: `${analytics?.actionItemCompletion || 0}%`, color: '#10b981' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Meeting Trend */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="#6366f1" /> Meeting Activity
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics?.meetingTrend || []}>
                  <defs>
                    <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Area type="monotone" dataKey="meetings" stroke="#6366f1" fill="url(#colorMeetings)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Task Distribution */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#8b5cf6" /> Task Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={tasksPieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false} fontSize={11}>
                    {tasksPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Hours per Day */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#f59e0b" /> Hours in Meetings
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics?.meetingTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Meeting Status */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color="#10b981" /> Meeting Status
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                    dataKey="value" label fontSize={11}>
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{analytics?.totalActionItems || 0}</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Total Action Items</p>
            </div>
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{analytics?.completedActionItems || 0}</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Completed Items</p>
            </div>
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
                {(analytics?.totalActionItems || 0) - (analytics?.completedActionItems || 0)}
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Pending Items</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
