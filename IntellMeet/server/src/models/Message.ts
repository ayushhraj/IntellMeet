import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  meetingId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'file' | 'system' | 'action-item';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'file', 'system', 'action-item'], default: 'text' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ meetingId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
