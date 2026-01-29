"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chatSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['personal', 'group', 'channel'], required: true },
    communityId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Community' },
    members: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
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
exports.default = mongoose_1.default.model('Chat', chatSchema);
