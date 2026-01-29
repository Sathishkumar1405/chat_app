import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    status: { type: String, default: 'Hey there! I am using this chat app' },
    statusMedia: { type: String, default: '' },
    statusMediaType: { type: String, enum: ['image', 'video', 'text'], default: 'text' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model('User', userSchema);
