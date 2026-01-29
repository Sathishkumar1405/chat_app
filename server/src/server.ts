import express from 'express';
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

dotenv.config({ path: './.env' });

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
