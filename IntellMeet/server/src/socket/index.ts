import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { Meeting } from '../models/Meeting';
import { User } from '../models/User';

interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
}

const rooms = new Map<string, Map<string, RoomParticipant>>();

export const initializeSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ===== Meeting/WebRTC Signaling =====
    socket.on('join-room', async (data: { roomId: string; userId: string; name: string; avatar: string }) => {
      const { roomId, userId, name, avatar } = data;
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId)!;
      room.set(userId, { socketId: socket.id, userId, name, avatar });

      // Notify existing participants
      socket.to(roomId).emit('user-joined', {
        userId,
        name,
        avatar,
        socketId: socket.id,
      });

      // Send existing participants list to new user
      const participants = Array.from(room.values()).filter(p => p.userId !== userId);
      socket.emit('existing-participants', participants);

      // Update user online status
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

      console.log(`👤 ${name} joined room ${roomId} (${room.size} participants)`);
    });

    // WebRTC Signaling
    socket.on('offer', (data: { to: string; offer: { type: string; sdp?: string }; from: string }) => {
      io.to(data.to).emit('offer', { offer: data.offer, from: socket.id, userId: data.from });
    });

    socket.on('answer', (data: { to: string; answer: { type: string; sdp?: string } }) => {
      io.to(data.to).emit('answer', { answer: data.answer, from: socket.id });
    });

    socket.on('ice-candidate', (data: { to: string; candidate: { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null } }) => {
      io.to(data.to).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
    });

    // Screen share notifications
    socket.on('screen-share-started', (data: { roomId: string; userId: string; name: string }) => {
      socket.to(data.roomId).emit('screen-share-started', { userId: data.userId, name: data.name });
    });

    socket.on('screen-share-stopped', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('screen-share-stopped', { userId: data.userId });
    });

    // Media toggle notifications
    socket.on('toggle-audio', (data: { roomId: string; userId: string; enabled: boolean }) => {
      socket.to(data.roomId).emit('user-toggle-audio', { userId: data.userId, enabled: data.enabled });
    });

    socket.on('toggle-video', (data: { roomId: string; userId: string; enabled: boolean }) => {
      socket.to(data.roomId).emit('user-toggle-video', { userId: data.userId, enabled: data.enabled });
    });

    // ===== Chat =====
    socket.on('send-message', async (data: {
      roomId: string;
      meetingId: string;
      senderId: string;
      content: string;
      type: string;
    }) => {
      try {
        const message = await Message.create({
          sender: data.senderId,
          meetingId: data.meetingId,
          content: data.content,
          type: data.type || 'text',
        });

        const populated = await Message.findById(message._id).populate('sender', 'name email avatar');
        io.to(data.roomId).emit('new-message', populated);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('typing', (data: { roomId: string; userId: string; name: string }) => {
      socket.to(data.roomId).emit('user-typing', { userId: data.userId, name: data.name });
    });

    socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-stop-typing', { userId: data.userId });
    });

    // Get chat history
    socket.on('get-messages', async (data: { meetingId: string }, callback: Function) => {
      try {
        const messages = await Message.find({ meetingId: data.meetingId })
          .populate('sender', 'name email avatar')
          .sort({ createdAt: 1 })
          .limit(200);
        callback(messages);
      } catch (error) {
        callback([]);
      }
    });

    // ===== Live Transcription =====
    socket.on('transcript-update', (data: { roomId: string; text: string; speaker: string; timestamp: number }) => {
      socket.to(data.roomId).emit('transcript-update', data);
    });

    // ===== Leave Room =====
    socket.on('leave-room', async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      socket.leave(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.delete(userId);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }

      socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
    });

    // ===== Disconnect =====
    socket.on('disconnect', async () => {
      // Find and clean up the user from all rooms
      for (const [roomId, room] of rooms) {
        for (const [userId, participant] of room) {
          if (participant.socketId === socket.id) {
            room.delete(userId);
            socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });

            if (room.size === 0) {
              rooms.delete(roomId);
            }
            break;
          }
        }
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
