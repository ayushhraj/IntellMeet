import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  teamId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  status: 'active' | 'completed' | 'archived';
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);


export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  projectId: mongoose.Types.ObjectId;
  assignee: mongoose.Types.ObjectId | null;
  reporter: mongoose.Types.ObjectId;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags: string[];
  order: number;
  meetingId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date },
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1, order: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
