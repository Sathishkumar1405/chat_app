const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get a specific chat
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('members', 'name avatar email');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat', error });
    }
});

// Get chats for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const chats = await Chat.find({ members: req.params.userId })
            .populate('members', 'name avatar email') // Populate member details
            .sort({ 'lastMessage.timestamp': -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats', error });
    }
});

// Create a new chat or get existing private chat
router.post('/', async (req, res) => {
    try {
        const { userId, otherUserId, name, type, members } = req.body;

        // Specialized logic for starting a private chat from frontend
        if (userId && otherUserId) {
            // Check if private chat already exists
            const existingChat = await Chat.findOne({
                type: 'personal',
                members: { $all: [userId, otherUserId] }
            });

            if (existingChat) {
                // Ensure we populate members so frontend receives identifying info
                await existingChat.populate('members', 'name avatar email');
                return res.json(existingChat);
            }

            // Create new private chat
            const user1 = await User.findById(userId);
            const user2 = await User.findById(otherUserId);

            if (!user1 || !user2) {
                return res.status(404).json({ message: 'User not found' });
            }

            const newPrivateChat = new Chat({
                name: `${user1.name} & ${user2.name}`, // Fallback name
                type: 'personal',
                members: [userId, otherUserId],
                lastMessage: { text: 'Start of conversation', timestamp: new Date() }
            });

            const savedChat = await newPrivateChat.save();
            // Populate before returning
            await savedChat.populate('members', 'name avatar email');
            return res.status(201).json(savedChat);
        }

        // Standard creation (fallback for group chats etc if payload differs)
        const newChat = new Chat({
            name,
            type,
            members,
            lastMessage: { text: 'Chat created', timestamp: new Date() }
        });
        const savedChat = await newChat.save();
        res.status(201).json(savedChat);
    } catch (error) {
        console.error("Create Chat Error:", error);
        res.status(500).json({ message: `Error creating chat: ${error.message || error}` });
    }
});

// Get messages for a specific chat
router.get('/:chatId/messages', async (req, res) => {
    try {
        const messages = await Message.find({
            chatId: req.params.chatId,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        })
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
});

// Toggle star status of a message
router.put('/:chatId/messages/:messageId/star', async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        message.starred = !message.starred;
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error });
    }
});

// Update Chat Settings
router.put('/:chatId', async (req, res) => {
    try {
        const { disappearingMessagesDuration } = req.body;
        const chat = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { disappearingMessagesDuration },
            { new: true }
        );
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error updating chat settings', error });
    }
});

// Send a message (also used by HTTP fallback, mainly WebSocket is used)
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { sender, text, type } = req.body;

        // Try to determine receiver if personal chat
        let receiverId = null;
        let receiverName = '';
        let senderName = '';
        let senderAvatar = '';
        const chat = await Chat.findById(req.params.chatId);

        if (chat && chat.type === 'personal') {
            const otherMember = chat.members.find((m) => m.toString() !== sender);
            if (otherMember) {
                receiverId = otherMember;
                const receiverUser = await User.findById(receiverId);
                if (receiverUser) receiverName = receiverUser.name;
            }
        }

        const senderUser = await User.findById(sender);
        if (senderUser) {
            senderName = senderUser.name;
            senderAvatar = senderUser.avatar || '';
        }

        // Calculate expiration if enabled
        let expiresAt = undefined;
        if (chat && chat.disappearingMessagesDuration && chat.disappearingMessagesDuration > 0) {
            expiresAt = new Date(Date.now() + chat.disappearingMessagesDuration * 1000);
        }

        const newMessage = new Message({
            chatId: req.params.chatId,
            // Combined string "Sender . Receiver" as requested
            sender: receiverName ? `${senderName} . ${receiverName}` : (senderName || 'Unknown'),
            receiver: receiverName,

            senderId: sender,
            senderName: senderName, // Explicit pure name
            receiverId: receiverId,
            senderAvatar: senderAvatar,

            text,
            type: type || 'text',
            expiresAt
        });
        const savedMessage = await newMessage.save();

        await Chat.findByIdAndUpdate(req.params.chatId, {
            lastMessage: {
                text: text,
                timestamp: savedMessage.timestamp,
            },
        });

        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
});

// ============================================
// Group Management Routes
// ============================================

// Create a new group
router.post('/groups', async (req, res) => {
    try {
        const { name, members, admin, groupIcon } = req.body;

        if (!members || members.length < 2) {
            return res.status(400).json({ message: 'Group must have at least 2 members' });
        }

        const newGroup = new Chat({
            name,
            type: 'group',
            members,
            admin: admin || members[0],
            groupIcon: groupIcon || '',
            lastMessage: { text: 'Group created', timestamp: new Date() }
        });

        const savedGroup = await newGroup.save();
        await savedGroup.populate('members', 'name avatar email');
        res.status(201).json(savedGroup);
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({
            message: `Error creating group: ${error.message}`,
            details: error.toString()
        });
    }
});

// Delete a chat
router.delete('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ _id: req.params.chatId });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Also delete associated messages
        await Message.deleteMany({ chatId: req.params.chatId });

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting chat', error });
    }
});

// Remove a member from a group
router.delete('/:chatId/members/:userId', async (req, res) => {
    try {
        const { chatId, userId } = req.params;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (chat.type !== 'group') {
            return res.status(400).json({ message: 'Can only remove members from group chats' });
        }

        // Remove the member
        chat.members = chat.members.filter((memberId) => memberId.toString() !== userId);

        await chat.save();

        // Return updated chat with populated members
        await chat.populate('members', 'name avatar email');

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error removing member', error });
    }
});

module.exports = router;
