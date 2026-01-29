"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User_1.default.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = new User_1.default({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            avatar,
        });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: `Error registering user: ${error.message || error}` });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: `Error logging in: ${error.message || error}` });
    }
});
// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User_1.default.find({}, '-password'); // Exclude password
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});
// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id, '-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching user: ${error.message || error}` });
    }
});
const websockets_1 = require("../websockets");
// Update User Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, statusMedia, statusMediaType } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, {
            status: status,
            statusMedia: statusMedia || '',
            statusMediaType: statusMediaType || 'text'
        }, { new: true, select: '-password' });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Broadcast to all connected clients
        (0, websockets_1.broadcastStatusUpdate)(user.id, user.status, user.statusMedia, user.statusMediaType);
        res.json(user);
    }
    catch (error) {
        console.error('Status Update Error:', error);
        res.status(500).json({ message: `Error updating status: ${error.message || error}` });
    }
});
// Update user profile
router.put('/:id', async (req, res) => {
    try {
        const { name, avatar, status } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (avatar)
            updateData.avatar = avatar;
        if (status)
            updateData.status = status;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true, select: '-password' });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating user: ${error.message || error}` });
    }
});
exports.default = router;
