"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = exports.broadcastStatusUpdate = exports.wss = void 0;
const ws_1 = require("ws");
const Message_1 = __importDefault(require("./models/Message"));
const Chat_1 = __importDefault(require("./models/Chat"));
const broadcastStatusUpdate = (userId, status, statusMedia, statusMediaType) => {
    if (!exports.wss)
        return;
    const message = JSON.stringify({
        type: 'status_update',
        userId,
        status,
        statusMedia,
        statusMediaType
    });
    exports.wss.clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
};
exports.broadcastStatusUpdate = broadcastStatusUpdate;
const initWebSocket = (server) => {
    exports.wss = new ws_1.WebSocketServer({ server });
    const clients = new Map();
    exports.wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('message', async (message) => {
            try {
                const parsedMessage = JSON.parse(message.toString());
                if (parsedMessage.type === 'register') {
                    clients.set(parsedMessage.userId, ws);
                    return;
                }
                if (parsedMessage.type === 'typing') {
                    exports.wss.clients.forEach(client => {
                        if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify(parsedMessage));
                        }
                    });
                    return;
                }
                // Call Signaling
                if (parsedMessage.type === 'call_initiate') {
                    const targetSocket = clients.get(parsedMessage.targetUserId);
                    if (targetSocket && targetSocket.readyState === ws_1.WebSocket.OPEN) {
                        console.log(`Forwarding call from ${parsedMessage.callerId} to ${parsedMessage.targetUserId}`);
                        targetSocket.send(JSON.stringify({
                            type: 'incoming_call',
                            callerId: parsedMessage.callerId,
                            callerName: parsedMessage.callerName,
                            callType: parsedMessage.callType
                        }));
                    }
                    else {
                        console.log(`Target user ${parsedMessage.targetUserId} not connected for call`);
                    }
                    return;
                }
                if (parsedMessage.type === 'call_accepted' || parsedMessage.type === 'call_rejected' || parsedMessage.type === 'ice-candidate' || parsedMessage.type === 'offer' || parsedMessage.type === 'answer') {
                    const targetSocket = clients.get(parsedMessage.targetUserId);
                    if (targetSocket && targetSocket.readyState === ws_1.WebSocket.OPEN) {
                        targetSocket.send(JSON.stringify(parsedMessage));
                    }
                    return;
                }
                // Fetch chat to decide receiver and update lastMessage
                const chat = await Chat_1.default.findById(parsedMessage.chatId);
                let receiverId = null;
                let receiverName = '';
                let senderName = '';
                let senderAvatar = '';
                if (chat && chat.type === 'personal') {
                    // Identify the other user in the chat
                    const otherMember = chat.members.find((m) => m.toString() !== parsedMessage.sender);
                    if (otherMember) {
                        receiverId = otherMember;
                        // Fetch receiver details
                        const receiverUser = await Chat_1.default.db.model('User').findById(receiverId);
                        if (receiverUser)
                            receiverName = receiverUser.name;
                    }
                }
                // Fetch sender details
                const senderUser = await Chat_1.default.db.model('User').findById(parsedMessage.sender);
                if (senderUser) {
                    senderName = senderUser.name;
                    senderAvatar = senderUser.avatar || '';
                }
                // Calculate expiration if enabled
                let expiresAt = undefined;
                if (chat?.disappearingMessagesDuration && chat.disappearingMessagesDuration > 0) {
                    expiresAt = new Date(Date.now() + chat.disappearingMessagesDuration * 1000);
                }
                const newMessage = new Message_1.default({
                    chatId: parsedMessage.chatId,
                    // Legacy format (String Names) as requested by User: "Sender . Receiver"
                    sender: receiverName ? `${senderName} . ${receiverName}` : (senderName || 'Unknown'),
                    receiver: receiverName,
                    // Smart Data (Hidden in DB view but used by App)
                    senderId: parsedMessage.sender,
                    receiverId: receiverId,
                    senderAvatar: senderAvatar,
                    senderName: senderName, // Ensure we store pure name for UI
                    text: parsedMessage.text,
                    timestamp: parsedMessage.timestamp,
                    type: parsedMessage.type,
                    expiresAt
                });
                const savedMessage = await newMessage.save();
                // No need to populate 'sender' anymore since it's a string, we have the data.
                if (chat) {
                    chat.lastMessage = {
                        text: parsedMessage.type === 'text' ? parsedMessage.text : `Sent a ${parsedMessage.type}`,
                        timestamp: new Date(parsedMessage.timestamp)
                    };
                    await chat.save();
                }
                // Broadcast the saved message to all clients
                exports.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify(savedMessage));
                    }
                });
            }
            catch (error) {
                console.error('Error handling message:', error);
            }
        });
        ws.on('close', () => {
            console.log('Client disconnected');
            clients.forEach((socket, userId) => {
                if (socket === ws) {
                    clients.delete(userId);
                }
            });
        });
    });
};
exports.initWebSocket = initWebSocket;
