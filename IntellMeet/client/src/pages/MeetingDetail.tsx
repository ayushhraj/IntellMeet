import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import {
  ArrowLeft, Video, Calendar, Clock, Users, Brain,
  CheckCircle2, Circle, FileText, Download
} from 'lucide-react'
import { format } from 'date-fns'

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const [meeting, setMeeting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const { data } = await api.get(`/meetings/${id}`)
        setMeeting(data.meeting)
      } catch (error) {
        console.error('Failed to fetch meeting:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchMeeting()
  }, [id])

  const generateSummary = async () => {
    if (!meeting) return
    setGenerating(true)
    try {
      const transcript = meeting.transcript || `Meeting "${meeting.title}" with ${meeting.participants?.length || 0} participants discussing key topics and action items.`
      const { data } = await api.post('/ai/summarize', { transcript })
      await api.put(`/meetings/${meeting._id}/summary`, {
        summary: data.summary,
        actionItems: data.actionItems,
        transcript,
      })
      setMeeting({ ...meeting, summary: data.summary, actionItems: data.actionItems, transcript })
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setGenerating(false)
    }
  }

  const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (loading) return (
    <div style={{ padding: 32 }}>
      {[200, 120, 300].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, marginBottom: 16, borderRadius: 12 }} />
      ))}
    </div>
  )

  if (!meeting) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <p style={{ fontSize: 16, color: '#94a3b8' }}>Meeting not found</p>
      <Link to="/meetings" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Meetings</Link>
    </div>
  )

  const statusColors: Record<string, string> = { scheduled: '#f59e0b', active: '#10b981', ended: '#6366f1', cancelled: '#ef4444' }

  return (
    <div className="animate-fade-in">
      <Link to="/meetings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Meetings
      </Link>

      {/* Header */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>{meeting.title}</h1>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {format(new Date(meeting.scheduledAt), 'MMM d, yyyy')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} /> {format(new Date(meeting.scheduledAt), 'h:mm a')}
                {meeting.duration ? ` • ${meeting.duration} min` : ''}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={14} /> {meeting.participants?.length || 0} participants
              </span>
            </div>
          </div>
          <span className="badge" style={{
            background: `${statusColors[meeting.status]}20`,
            color: statusColors[meeting.status],
          }}>
            {meeting.status}
          </span>
        </div>

        {/* Participants */}
        <div style={{ display: 'flex', gap: -4, marginTop: 16 }}>
          {meeting.participants?.slice(0, 6).map((p: any, i: number) => (
            <div key={i} className="avatar avatar-sm" style={{
              background: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5],
              marginLeft: i > 0 ? -8 : 0, border: '2px solid #0f172a', zIndex: 6 - i
            }} title={p.user?.name}>
              {getInitials(p.user?.name || '')}
            </div>
          ))}
          {(meeting.participants?.length || 0) > 6 && (
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, alignSelf: 'center' }}>
              +{meeting.participants.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['summary', 'transcript', 'actions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}>
            {tab === 'summary' && <Brain size={14} />}
            {tab === 'transcript' && <FileText size={14} />}
            {tab === 'actions' && <CheckCircle2 size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card" style={{ padding: 28, minHeight: 300 }}>
        {activeTab === 'summary' && (
          <div>
            {meeting.summary ? (
              <div style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1' }}
                dangerouslySetInnerHTML={{
                  __html: meeting.summary
                    .replace(/^## (.+)/gm, '<h2 style="font-size:18px;font-weight:700;color:#e2e8f0;margin:20px 0 8px">$1</h2>')
                    .replace(/^### (.+)/gm, '<h3 style="font-size:15px;font-weight:600;color:#a5b4fc;margin:16px 0 6px">$1</h3>')
                    .replace(/^- (.+)/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#6366f1">•</span><span>$1</span></div>')
                    .replace(/^\d+\. (.+)/gm, '<div style="margin:4px 0;padding-left:16px">$1</div>')
                    .replace(/\*(.+?)\*/g, '<em style="color:#94a3b8">$1</em>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Brain size={40} color="#64748b" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No Summary Yet</p>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Generate an AI-powered summary of this meeting</p>
                <button onClick={generateSummary} className="btn btn-primary" disabled={generating}>
                  <Brain size={16} /> {generating ? 'Generating...' : 'Generate AI Summary'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div>
            {meeting.transcript ? (
              <pre style={{ fontSize: 13, lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {meeting.transcript}
              </pre>
            ) : (
              <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: 48 }}>
                No transcript available. Start transcription during the meeting to capture conversation.
              </p>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div>
            {meeting.actionItems?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {meeting.actionItems.map((item: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                    borderRadius: 10, background: 'rgba(15,23,42,0.5)'
                  }}>
                    {item.status === 'completed' ? (
                      <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <Circle size={18} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 14, color: item.status === 'completed' ? '#64748b' : '#e2e8f0',
                        textDecoration: item.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {item.text}
                      </p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                        {item.assignee && (
                          <span>Assigned to: {item.assignee.name || 'Unassigned'}</span>
                        )}
                        {item.dueDate && (
                          <span>Due: {format(new Date(item.dueDate), 'MMM d')}</span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${item.status === 'completed' ? 'badge-success' : item.status === 'in-progress' ? 'badge-warning' : 'badge-primary'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <CheckCircle2 size={40} color="#64748b" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: '#64748b' }}>No action items extracted yet</p>
                {!meeting.summary && (
                  <button onClick={generateSummary} className="btn btn-primary" style={{ marginTop: 16 }} disabled={generating}>
                    <Brain size={16} /> {generating ? 'Extracting...' : 'Extract with AI'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
