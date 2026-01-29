import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import Message from './models/Message';
import Chat from './models/Chat';

export let wss: WebSocketServer;

export const broadcastStatusUpdate = (userId: string, status: string, statusMedia?: string, statusMediaType?: string) => {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'status_update',
    userId,
    status,
    statusMedia,
    statusMediaType
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export const initWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.type === 'register') {
          clients.set(parsedMessage.userId, ws);
          return;
        }

        if (parsedMessage.type === 'typing') {
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage));
            }
          });
          return;
        }

        // Call Signaling
        if (parsedMessage.type === 'call_initiate') {
          const targetSocket = clients.get(parsedMessage.targetUserId);
          if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            console.log(`Forwarding call from ${parsedMessage.callerId} to ${parsedMessage.targetUserId}`);
            targetSocket.send(JSON.stringify({
              type: 'incoming_call',
              callerId: parsedMessage.callerId,
              callerName: parsedMessage.callerName,
              callType: parsedMessage.callType
            }));
          } else {
            console.log(`Target user ${parsedMessage.targetUserId} not connected for call`);
          }
          return;
        }

        if (parsedMessage.type === 'call_accepted' || parsedMessage.type === 'call_rejected' || parsedMessage.type === 'ice-candidate' || parsedMessage.type === 'offer' || parsedMessage.type === 'answer') {
          const targetSocket = clients.get(parsedMessage.targetUserId);
          if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify(parsedMessage));
          }
          return;
        }

        // Fetch chat to decide receiver and update lastMessage
        const chat = await Chat.findById(parsedMessage.chatId);
        let receiverId = null;
        let receiverName = '';
        let senderName = '';
        let senderAvatar = '';

        if (chat && chat.type === 'personal') {
          // Identify the other user in the chat
          const otherMember = chat.members.find((m: any) => m.toString() !== parsedMessage.sender);
          if (otherMember) {
            receiverId = otherMember;
            // Fetch receiver details
            const receiverUser = await Chat.db.model('User').findById(receiverId);
            if (receiverUser) receiverName = receiverUser.name;
          }
        }

        // Fetch sender details
        const senderUser = await Chat.db.model('User').findById(parsedMessage.sender);
        if (senderUser) {
          senderName = senderUser.name;
          senderAvatar = senderUser.avatar || '';
        }


        // Calculate expiration if enabled
        let expiresAt = undefined;
        if (chat?.disappearingMessagesDuration && chat.disappearingMessagesDuration > 0) {
          expiresAt = new Date(Date.now() + chat.disappearingMessagesDuration * 1000);
        }

        const newMessage = new Message({
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
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(savedMessage));
          }
        });
      } catch (error) {
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
