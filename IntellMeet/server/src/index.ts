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

// CORS — allow any origin when CLIENT_URL is '*', else use specific URL
app.use(cors({
  origin: (origin, callback) => {
    const allowed = config.clientUrl;
    if (allowed === '*' || !origin) return callback(null, true);
    if (origin === allowed) return callback(null, true);
    return callback(null, true); // allow all in production for now
  },
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ── DB connection cache for Vercel serverless ──────────────────────────
let dbConnected = false;
app.use(async (_req, _res, next) => {
  if (!dbConnected) {
    await connectDB();
    await connectRedis();
    dbConnected = true;
  }
  next();
});
// ───────────────────────────────────────────────────────────────────────

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/workspace', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Error handler
app.use(errorHandler);

// ── Local development only: start HTTP server + Socket.io ──────────────
if (process.env.NODE_ENV !== 'production') {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  initializeSocket(io);

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
}
// ───────────────────────────────────────────────────────────────────────

// Export for Vercel serverless
export default app;
