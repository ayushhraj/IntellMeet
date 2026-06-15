import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  FolderKanban, Plus, Circle, Clock, CheckCircle2, Eye,
  AlertTriangle, ArrowUp, ArrowDown, Minus, Calendar, X
} from 'lucide-react'
import { format } from 'date-fns'

const columns = [
  { id: 'todo', label: 'To Do', color: '#94a3b8', icon: Circle },
  { id: 'in-progress', label: 'In Progress', color: '#f59e0b', icon: Clock },
  { id: 'review', label: 'Review', color: '#8b5cf6', icon: Eye },
  { id: 'done', label: 'Done', color: '#10b981', icon: CheckCircle2 },
]

const priorities: Record<string, { color: string; icon: any }> = {
  urgent: { color: '#ef4444', icon: AlertTriangle },
  high: { color: '#f59e0b', icon: ArrowUp },
  medium: { color: '#6366f1', icon: Minus },
  low: { color: '#10b981', icon: ArrowDown },
}

export default function Projects() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskStatus, setNewTaskStatus] = useState('todo')

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProject) fetchTasks() }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/workspace/projects')
      setProjects(data.projects)
      if (data.projects.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0]._id)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    if (!selectedProject) return
    try {
      const { data } = await api.get('/workspace/tasks', { params: { projectId: selectedProject } })
      setTasks(data.tasks)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return
    try {
      // Get first team
      const { data: teamData } = await api.get('/workspace/teams')
      const teamId = teamData.teams?.[0]?._id
      if (!teamId) { alert('Create a team first'); return }

      const { data } = await api.post('/workspace/projects', {
        name: newProjectName, teamId,
      })
      setProjects(prev => [data.project, ...prev])
      setSelectedProject(data.project._id)
      setShowNewProject(false)
      setNewProjectName('')
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim() || !selectedProject) return
    try {
      await api.post('/workspace/tasks', {
        title: newTaskTitle, projectId: selectedProject,
        priority: newTaskPriority, status: newTaskStatus,
      })
      setShowNewTask(false)
      setNewTaskTitle('')
      fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/workspace/tasks/${taskId}`, { status: newStatus })
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>Projects</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Kanban boards for task management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowNewTask(true)} className="btn btn-secondary" disabled={!selectedProject}>
            <Plus size={16} /> Add Task
          </button>
          <button onClick={() => setShowNewProject(true)} className="btn btn-primary">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Project Tabs */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
          {projects.map(p => (
            <button key={p._id} onClick={() => setSelectedProject(p._id)}
              className={`btn btn-sm ${selectedProject === p._id ? 'btn-primary' : 'btn-ghost'}`}>
              <FolderKanban size={14} /> {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {selectedProject ? (
        <div className="kanban-board">
          {columns.map(col => {
            const ColIcon = col.icon
            const columnTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ColIcon size={14} color={col.color} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{col.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: col.color,
                      background: `${col.color}15`, padding: '2px 8px', borderRadius: 10
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div style={{ minHeight: 100 }}>
                  {columnTasks.map(task => {
                    const prio = priorities[task.priority] || priorities.medium
                    const PrioIcon = prio.icon
                    return (
                      <div key={task._id} className="kanban-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <PrioIcon size={12} color={prio.color} />
                          <span style={{ fontSize: 11, color: prio.color, fontWeight: 600 }}>{task.priority}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.3 }}>
                          {task.title}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {task.assignee ? (
                            <div className="avatar avatar-sm" style={{
                              background: '#6366f1', fontSize: 9
                            }} title={task.assignee.name}>
                              {getInitials(task.assignee.name)}
                            </div>
                          ) : <div />}
                          {task.dueDate && (
                            <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Calendar size={10} /> {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {/* Quick status move */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {columns.filter(c => c.id !== task.status).map(c => (
                            <button key={c.id} onClick={() => updateTaskStatus(task._id, c.id)}
                              style={{
                                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                background: `${c.color}10`, color: c.color, border: 'none', cursor: 'pointer'
                              }}>
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 64, textAlign: 'center' }}>
          <FolderKanban size={48} color="#64748b" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>No Projects Yet</p>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Create a project to start tracking tasks</p>
          <button onClick={() => setShowNewProject(true)} className="btn btn-primary">
            <Plus size={16} /> Create Project
          </button>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>New Project</h3>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Project Name</label>
              <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="input" placeholder="e.g., Platform Launch" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowNewProject(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={createProject} className="btn btn-primary" style={{ flex: 1 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Add Task</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Task Title</label>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="input" placeholder="What needs to be done?" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Priority</label>
                <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} className="input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Status</label>
                <select value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value)} className="input">
                  {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowNewTask(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={createTask} className="btn btn-primary" style={{ flex: 1 }}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
