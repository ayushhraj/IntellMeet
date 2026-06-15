import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket';

import authRoutes from './routes/auth.routes';
import meetingRoutes from './routes/meeting.routes';
import teamRoutes from './routes/team.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/workspace', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Error handler
app.use(errorHandler);

// Initialize Socket.io
initializeSocket(io);

// Start server
const start = async () => {
  await connectDB();
  await connectRedis();

  server.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 IntellMeet Server                       ║
║   Running on port ${config.port}                     ║
║   Environment: ${config.nodeEnv}              ║
║   AI Mode: ${config.openai.apiKey ? 'OpenAI' : 'Mock/Demo'}                 ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
  });
};

start().catch(console.error);
