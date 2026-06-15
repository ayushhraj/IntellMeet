import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  host: mongoose.Types.ObjectId;
  participants: {
    user: mongoose.Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
    role: 'host' | 'co-host' | 'participant';
  }[];
  roomId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  recording?: {
    url: string;
    size: number;
    duration: number;
  };
  transcript: string;
  summary: string;
  actionItems: {
    text: string;
    assignee: mongoose.Types.ObjectId | null;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: Date;
  }[];
  teamId?: mongoose.Types.ObjectId;
  tags: string[];
  isRecurring: boolean;
  maxParticipants: number;
  settings: {
    muteOnEntry: boolean;
    allowScreenShare: boolean;
    allowRecording: boolean;
    waitingRoom: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        role: { type: String, enum: ['host', 'co-host', 'participant'], default: 'participant' },
      },
    ],
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    scheduledAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number },
    recording: {
      url: { type: String },
      size: { type: Number },
      duration: { type: Number },
    },
    transcript: { type: String, default: '' },
    summary: { type: String, default: '' },
    actionItems: [
      {
        text: { type: String, required: true },
        assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
        dueDate: { type: Date },
      },
    ],
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    tags: [{ type: String }],
    isRecurring: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 50 },
    settings: {
      muteOnEntry: { type: Boolean, default: false },
      allowScreenShare: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: true },
      waitingRoom: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

meetingSchema.index({ host: 1, status: 1 });
meetingSchema.index({ scheduledAt: -1 });
meetingSchema.index({ 'participants.user': 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
