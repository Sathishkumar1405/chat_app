const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: String, required: true }, // Store Name (e.g. "John")
    receiver: { type: String }, // Store Name (e.g. "Jane")

    // Aux fields to keep app smart
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderAvatar: { type: String },
    senderName: { type: String }, // Pure sender name for UI display
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    type: { type: String, enum: ['text', 'image', 'file', 'voice', 'poll', 'channel_post'], default: 'text' },
    starred: { type: Boolean, default: false },
    fileName: String,

    // Rich Card Fields
    title: String,
    imageUrl: String,
    description: String,
    link: String,

    poll: {
        question: String,
        options: [{
            id: String,
            text: String,
            votes: [String]
        }],
        allowMultiple: Boolean
    },

    // Disappearing Messages
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Message', messageSchema);
