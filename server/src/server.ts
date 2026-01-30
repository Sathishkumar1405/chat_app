import express from 'express';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './db';
import chatRoutes from './routes/chats';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';
import communityRoutes from './routes/communities';
import aiRoutes from './routes/ai';
import path from 'path';
import seedDatabase from './seed';
import { initWebSocket } from './websockets';

// Load .env file only in development (in production, use platform env vars)
dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

import session from 'express-session';

app.use(cors());
app.use(express.json());

// Validate required environment variables
const sessionSecret = process.env.SESSION_SECRET;
const mongoUri = process.env.MONGO_URI;

if (!sessionSecret) {
  console.error('SESSION_SECRET must be defined in environment variables');
  process.exit(1);
}

if (!mongoUri) {
  console.error('MONGO_URI must be defined in environment variables');
  process.exit(1);
}

// Session Configuration
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  // Health check
  res.send('Server is running');
});

initWebSocket(server);

connectDB().then(() => {
  seedDatabase();
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
});
