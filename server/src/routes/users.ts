import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            avatar,
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: `Error registering user: ${error.message || error}` });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        res.json(user);
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ message: `Error logging in: ${error.message || error}` });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: `Error fetching user: ${error.message || error}` });
    }
});

import { broadcastStatusUpdate } from '../websockets';

// Update User Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, statusMedia, statusMediaType } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                status: status,
                statusMedia: statusMedia || '',
                statusMediaType: statusMediaType || 'text'
            },
            { new: true, select: '-password' }
        );

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Broadcast to all connected clients
        broadcastStatusUpdate(user.id, user.status, user.statusMedia, user.statusMediaType);

        res.json(user);
    } catch (error: any) {
        console.error('Status Update Error:', error);
        res.status(500).json({ message: `Error updating status: ${error.message || error}` });
    }
});

// Update user profile
router.put('/:id', async (req, res) => {
    try {
        const { name, avatar, status } = req.body;
        const updateData: any = {};
        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;
        if (status) updateData.status = status;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, select: '-password' }
        );

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: `Error updating user: ${error.message || error}` });
    }
});

export default router;
