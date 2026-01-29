export interface Message {
  id: string;
  text: string;
  sender: string | User;
  senderId?: string; // ID for logic (isSent)
  senderName?: string; // Display name (decoupled from 'sender' field)
  senderAvatar?: string; // Avatar URL
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  isSent?: boolean; // Optimistic update flag
  type?: 'text' | 'image' | 'file' | 'voice' | 'poll' | 'channel_post';
  fileName?: string; // Added fileName
  content?: string; // Legacy field, usage replaced by text/type logic but kept for safety? No, let's just stick to text.
  replyTo?: Message;
  reactions?: string[];
  poll?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: string[]; // array of user IDs/names
    }[];
    allowMultiple?: boolean;
  };
  // Rich Card Fields
  title?: string;
  imageUrl?: string;
  description?: string;
  link?: string;
  starred?: boolean;
  viewType?: 'once' | 'twice';
  viewCount?: number; // Current view count (0 initially)
}



export interface Community {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: string[];
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  type: 'personal' | 'group' | 'channel';
  communityId?: string; // Link to community
  lastMessage: {
    text: string;
    timestamp: Date;
  };
  unreadCount: number;
  online?: boolean;  // For personal chats
  memberCount?: number;
  subscriberCount?: number; // legacy?
  members?: User[] | string[];
  groupIcon?: string;
  lastSeen?: Date;
  status?: string; // For personal chats
  disappearingMessagesDuration?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
  statusMedia?: string;
  statusMediaType?: 'image' | 'video';
  isOnline?: boolean;
}