import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  avatar: string;
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    avatar: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    inviteCode: { type: String, unique: true },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', teamSchema);
