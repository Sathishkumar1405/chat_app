"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    chatId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: String, required: true }, // Store Name (e.g. "John")
    receiver: { type: String }, // Store Name (e.g. "Jane")
    // Aux fields to keep app smart
    senderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    receiverId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
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
exports.default = mongoose_1.default.model('Message', messageSchema);
