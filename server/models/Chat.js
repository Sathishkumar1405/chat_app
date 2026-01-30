const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['personal', 'group', 'channel'], required: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupIcon: { type: String, default: '' },
    lastMessage: {
        text: String,
        timestamp: Date,
    },
    disappearingMessagesDuration: { type: Number, default: 0 }, // 0 means off, value in seconds
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Chat', chatSchema);
