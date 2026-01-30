const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const session = require('express-session');
let MongoStore = require('connect-mongo');
if (MongoStore.default) MongoStore = MongoStore.default;

const connectDB = require('./db');
const chatRoutes = require('./routes/chats');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const communityRoutes = require('./routes/communities');
const aiRoutes = require('./routes/ai');
const seedDatabase = require('./seed');
const { initWebSocket } = require('./websockets');

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(cors({
    origin: ['https://chat-app-6-y7uf.onrender.com', 'http://localhost:5173', 'https://chat-karo.pages.dev'], // Add your Cloudflare domain later
    credentials: true
}));
app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;
const mongoUri = process.env.MONGO_URI;

if (!sessionSecret || !mongoUri) {
    console.error('❌ SESSION_SECRET or MONGO_URI missing in environment variables');
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
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send("Backend running 🚀");
});

// Initialize WebSocket
initWebSocket(server);

// Connect DB and Start
connectDB().then(() => {
    seedDatabase();
    server.listen(Number(port), '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    });
}).catch(err => {
    console.error('❌ Failed to connect to database:', err);
});
