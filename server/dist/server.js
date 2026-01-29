"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const db_1 = __importDefault(require("./db"));
const chats_1 = __importDefault(require("./routes/chats"));
const users_1 = __importDefault(require("./routes/users"));
const upload_1 = __importDefault(require("./routes/upload"));
const communities_1 = __importDefault(require("./routes/communities"));
const ai_1 = __importDefault(require("./routes/ai"));
const path_1 = __importDefault(require("path"));
const seed_1 = __importDefault(require("./seed"));
const websockets_1 = require("./websockets");
dotenv_1.default.config({ path: './.env' });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const port = process.env.PORT || 5000;
const express_session_1 = __importDefault(require("express-session"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Session Configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use('/api/chats', chats_1.default);
app.use('/api/users', users_1.default);
app.use('/api/communities', communities_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/ai', ai_1.default);
app.get('/', (req, res) => {
    // Health check
    res.send('Server is running');
});
(0, websockets_1.initWebSocket)(server);
(0, db_1.default)().then(() => {
    (0, seed_1.default)();
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(err => {
    console.error('Failed to connect to database:', err);
});
