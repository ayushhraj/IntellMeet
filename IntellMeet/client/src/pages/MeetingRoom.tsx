import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'
import {
  Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
  Phone, MessageSquare, FileText, Send, Sparkles, X, Users
} from 'lucide-react'

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState<any>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, { stream: MediaStream; name: string; avatar: string }>>(new Map())
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [transcriptText, setTranscriptText] = useState<string[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [joined, setJoined] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const socketRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  // Join meeting
  useEffect(() => {
    if (!roomId || !user) return

    const init = async () => {
      try {
        const { data } = await api.post(`/meetings/join/${roomId}`)
        setMeeting(data.meeting)
      } catch (err) {
        console.error('Meeting not found')
        navigate('/dashboard')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const socket = connectSocket()
        socketRef.current = socket

        socket.emit('join-room', {
          roomId, userId: user._id, name: user.name, avatar: user.avatar
        })

        socket.on('existing-participants', (participants: any[]) => {
          participants.forEach(p => createPeerConnection(p.socketId, p.name, p.avatar, stream, true))
        })

        socket.on('user-joined', (data: any) => {
          createPeerConnection(data.socketId, data.name, data.avatar, stream, false)
        })

        socket.on('offer', async (data: any) => {
          const pc = peerConnections.current.get(data.from)
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('answer', { to: data.from, answer })
          }
        })

        socket.on('answer', async (data: any) => {
          const pc = peerConnections.current.get(data.from)
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        })

        socket.on('ice-candidate', async (data: any) => {
          const pc = peerConnections.current.get(data.from)
          if (pc && data.candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch (e) {}
          }
        })

        socket.on('user-left', (data: any) => {
          peerConnections.current.get(data.socketId)?.close()
          peerConnections.current.delete(data.socketId)
          setPeers(prev => { const n = new Map(prev); n.delete(data.socketId); return n })
        })

        socket.on('new-message', (msg: any) => {
          setMessages(prev => [...prev, msg])
        })

        socket.on('transcript-update', (data: any) => {
          setTranscriptText(prev => [...prev, `${data.speaker}: ${data.text}`])
        })

        // Get chat history
        socket.emit('get-messages', { meetingId: '' }, (msgs: any[]) => setMessages(msgs))

        setJoined(true)
      } catch (err) {
        console.error('Failed to access media devices:', err)
      }
    }

    init()

    return () => {
      localStream?.getTracks().forEach(t => t.stop())
      peerConnections.current.forEach(pc => pc.close())
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId, userId: user?._id })
        disconnectSocket()
      }
      stopTranscription()
    }
  }, [roomId, user])

  const createPeerConnection = (socketId: string, name: string, avatar: string, stream: MediaStream, initiator: boolean) => {
    const pc = new RTCPeerConnection(iceServers)
    peerConnections.current.set(socketId, pc)

    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.ontrack = (event) => {
      setPeers(prev => {
        const n = new Map(prev)
        n.set(socketId, { stream: event.streams[0], name, avatar })
        return n
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { to: socketId, candidate: event.candidate })
      }
    }

    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socketRef.current?.emit('offer', { to: socketId, offer, from: user?._id })
        } catch (e) {}
      }
    }
  }

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMicOn(prev => !prev)
    socketRef.current?.emit('toggle-audio', { roomId, userId: user?._id, enabled: !isMicOn })
  }

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCamOn(prev => !prev)
    socketRef.current?.emit('toggle-video', { roomId, userId: user?._id, enabled: !isCamOn })
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      localStream?.getVideoTracks().forEach(t => t.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        // Replace track in all peer connections
        const videoTrack = stream.getVideoTracks()[0]
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(videoTrack)
        })
      } catch (e) {}
      setIsScreenSharing(false)
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const videoTrack = screenStream.getVideoTracks()[0]

        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(videoTrack)
        })

        if (localVideoRef.current) {
          const mixed = new MediaStream([videoTrack, ...(localStream?.getAudioTracks() || [])])
          localVideoRef.current.srcObject = mixed
        }

        videoTrack.onended = () => toggleScreenShare()
        setIsScreenSharing(true)
      } catch (e) {}
    }
  }

  const endCall = async () => {
    localStream?.getTracks().forEach(t => t.stop())
    peerConnections.current.forEach(pc => pc.close())
    socketRef.current?.emit('leave-room', { roomId, userId: user?._id })
    disconnectSocket()

    if (meeting?._id) {
      try {
        await api.put(`/meetings/${meeting._id}/end`)
        // Generate AI summary
        if (transcriptText.length > 0) {
          const { data } = await api.post('/ai/summarize', { transcript: transcriptText.join('\n') })
          await api.put(`/meetings/${meeting._id}/summary`, {
            transcript: transcriptText.join('\n'),
            summary: data.summary,
            actionItems: data.actionItems,
          })
        }
      } catch (e) {}
    }
    navigate('/dashboard')
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socketRef.current) return
    socketRef.current.emit('send-message', {
      roomId, meetingId: meeting?._id || '', senderId: user?._id,
      content: newMessage.trim(), type: 'text'
    })
    setNewMessage('')
  }

  // Web Speech API transcription
  const startTranscription = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim()
          if (text) {
            setTranscriptText(prev => [...prev, `${user?.name}: ${text}`])
            socketRef.current?.emit('transcript-update', {
              roomId, text, speaker: user?.name, timestamp: Date.now()
            })
          }
        }
      }
    }

    recognition.onerror = () => setIsTranscribing(false)
    recognition.onend = () => { if (isTranscribing) recognition.start() }
    recognition.start()
    recognitionRef.current = recognition
    setIsTranscribing(true)
  }

  const stopTranscription = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsTranscribing(false)
  }

  const getInitials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const participantCount = 1 + peers.size

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#020617' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid rgba(99,102,241,0.1)',
        background: 'rgba(2,6,23,0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles size={20} color="#6366f1" />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
            {meeting?.title || 'Meeting Room'}
          </h2>
          <span className="badge badge-success" style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 }} />
            Live
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}>
          <Users size={14} /> {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Grid */}
        <div style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="video-grid" data-count={participantCount} style={{ maxHeight: '100%', width: '100%' }}>
            {/* Local Video */}
            <div className="video-tile">
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div className="participant-info">
                {!isMicOn && <MicOff size={12} color="#fca5a5" />}
                {user?.name} (You)
              </div>
            </div>

            {/* Remote Videos */}
            {Array.from(peers.entries()).map(([socketId, peer]) => (
              <div key={socketId} className="video-tile">
                <video
                  autoPlay playsInline
                  ref={el => { if (el && peer.stream) el.srcObject = peer.stream }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="participant-info">{peer.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat/Transcript Panel */}
        {(showChat || showTranscript) && (
          <div style={{
            width: 340, borderLeft: '1px solid rgba(99,102,241,0.1)',
            display: 'flex', flexDirection: 'column', background: 'rgba(2,6,23,0.95)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid rgba(99,102,241,0.1)'
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowChat(true); setShowTranscript(false) }}
                  className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`}>Chat</button>
                <button onClick={() => { setShowTranscript(true); setShowChat(false) }}
                  className={`btn btn-sm ${showTranscript ? 'btn-primary' : 'btn-ghost'}`}>Transcript</button>
              </div>
              <button onClick={() => { setShowChat(false); setShowTranscript(false) }}
                className="btn-icon btn-ghost" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {showChat && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                  {messages.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 32 }}>
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg: any, i: number) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div className="avatar avatar-sm" style={{ background: '#6366f1', fontSize: 9 }}>
                            {getInitials(msg.sender?.name || 'U')}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
                            {msg.sender?.name || 'User'}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#e2e8f0', paddingLeft: 34, lineHeight: 1.4 }}>
                          {msg.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={sendMessage} style={{
                  padding: 12, borderTop: '1px solid rgba(99,102,241,0.1)',
                  display: 'flex', gap: 8
                }}>
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    className="input" placeholder="Type a message..." style={{ fontSize: 13 }} />
                  <button type="submit" className="btn btn-primary btn-icon">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {showTranscript && (
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {isTranscribing ? '🔴 Recording...' : 'Not recording'}
                  </span>
                  <button onClick={isTranscribing ? stopTranscription : startTranscription}
                    className={`btn btn-sm ${isTranscribing ? 'btn-danger' : 'btn-primary'}`}>
                    {isTranscribing ? 'Stop' : 'Start'} AI Transcription
                  </button>
                </div>
                {transcriptText.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 32 }}>
                    Start transcription to see live text here
                  </p>
                ) : (
                  transcriptText.map((line, i) => (
                    <p key={i} style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.4 }}>
                      {line}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '16px 0',
        background: 'rgba(2,6,23,0.95)', borderTop: '1px solid rgba(99,102,241,0.1)'
      }}>
        <div className="meeting-controls">
          <button onClick={toggleMic} className={`control-btn ${isMicOn ? 'active' : 'muted'}`} title={isMicOn ? 'Mute' : 'Unmute'}>
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button onClick={toggleCam} className={`control-btn ${isCamOn ? 'active' : 'muted'}`} title={isCamOn ? 'Turn off camera' : 'Turn on camera'}>
            {isCamOn ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
          <button onClick={toggleScreenShare} className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            style={{ background: isScreenSharing ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)' }}
            title="Share screen">
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          <button onClick={() => { setShowChat(!showChat); setShowTranscript(false) }}
            className={`control-btn ${showChat ? 'active' : ''}`}
            style={{ background: showChat ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)' }}
            title="Chat">
            <MessageSquare size={20} />
          </button>
          <button onClick={() => { setShowTranscript(!showTranscript); setShowChat(false) }}
            className={`control-btn ${showTranscript ? 'active' : ''}`}
            style={{ background: showTranscript ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)' }}
            title="AI Transcript">
            <FileText size={20} />
          </button>
          <div style={{ width: 1, height: 28, background: 'rgba(99,102,241,0.2)', margin: '0 4px' }} />
          <button onClick={endCall} className="control-btn end-call" title="End call">
            <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
