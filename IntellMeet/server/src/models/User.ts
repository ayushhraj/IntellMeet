import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: 'admin' | 'member';
  teams: mongoose.Types.ObjectId[];
  isOnline: boolean;
  lastSeen: Date;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    settings: {
      notifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
