import { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';
import NavigationRail from './components/NavigationRail';
import { Message, User, Chat, Community } from './types/chat';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import UserProfileModal from './components/UserProfileModal';
import CallsSidebar from './components/CallsSidebar';
import StatusSidebar from './components/StatusSidebar';
import CommunitiesSidebar from './components/CommunitiesSidebar';
import AiSidebar from './components/AiSidebar';
import AiChatArea from './components/AiChatArea';


import { webRTC } from './utils/webrtc';
import { API_BASE_URL } from './config';

function App() {

  const handleInitiateCall = (userId: string, type: 'audio' | 'video') => {
    console.log(`Starting ${type} call with user ${userId}`);
    if (ws.current && currentUser) {
      ws.current.send(JSON.stringify({
        type: 'call_initiate',
        targetUserId: userId,
        callType: type,
        callerId: currentUser.id,
        callerName: currentUser.name
      }));
      // Note: Media stream acquisition should ideally start here or be coordinated
    }
  };
  // ... existing state ...
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'status' | 'communities' | 'ai'>('chats');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string, callerName: string, callType: 'audio' | 'video' } | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // WebRTC State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    // Construct WebSocket URL from API_BASE_URL
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'typing') {
        setTypingIndicator(`${messageData.user.name} is typing...`);
        setTimeout(() => setTypingIndicator(null), 3000);
      } else if (messageData.type === 'incoming_call') {
        setIncomingCall({
          callerId: messageData.callerId,
          callerName: messageData.callerName || 'Unknown Caller',
          callType: messageData.callType
        });
      } else if (messageData.type === 'status_update') {
        setUsers(prevUsers => prevUsers.map(user =>
          user.id === messageData.userId
            ? {
              ...user,
              status: messageData.status,
              statusMedia: messageData.statusMedia,
              statusMediaType: messageData.statusMediaType,
              isOnline: messageData.isOnline
            }
            : user
        ));
      } else if (messageData.type === 'call_accepted') {
        // Caller receives call_accepted
        console.log('Call accepted by', messageData.callerId); // Note: server swaps ids, so here target is confirming
        setIsCallActive(true);
        // Start WebRTC negotiation
        // Start WebRTC negotiation
        startWebRTCCall(messageData.callerId);
      } else if (messageData.type === 'offer') {
        handleWebRTCOffer(messageData);
      } else if (messageData.type === 'answer') {
        handleWebRTCAnswer(messageData);
      } else if (messageData.type === 'ice-candidate') {
        handleWebRTCCandidate(messageData);
      } else if (messageData.chatId && messageData.sender) {
        // Handle new message
        setMessages(prev => {
          return {
            ...prev,
            [messageData.chatId]: [...(prev[messageData.chatId] || []), messageData],
          };
        });

        setChats(prevChats => {
          const chatExists = prevChats.some(chat => chat.id === messageData.chatId);
          if (chatExists) {
            return prevChats.map(chat =>
              chat.id === messageData.chatId
                ? { ...chat, lastMessage: { text: messageData.text, timestamp: messageData.timestamp } }
                : chat
            );
          }
          return prevChats;
        });
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleWebRTCOffer = async (data: any) => {
    // 1. Get User Media (if not already) - strictly we should have it.
    // For simplicity, let's assume we request it now if missing.
    let stream = localStream;
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (e) { console.error('Failed to get media for offer', e); return; }
    }

    await webRTC.initialize(stream);
    webRTC.onRemoteStream = (s) => setRemoteStream(s);
    webRTC.onIceCandidate = (candidate) => {
      ws.current?.send(JSON.stringify({
        type: 'ice-candidate',
        targetUserId: data.callerId, // Send back to caller
        candidate
      }));
    };

    const answer = await webRTC.createAnswer(data.offer);
    ws.current?.send(JSON.stringify({
      type: 'answer',
      targetUserId: data.callerId,
      answer
    }));
    setIsCallActive(true);
  };

  const handleWebRTCAnswer = async (data: any) => {
    await webRTC.setRemoteDescription(data.answer);
  };

  const handleWebRTCCandidate = async (data: any) => {
    await webRTC.addIceCandidate(data.candidate);
  };

  // Helper to start call (Caller side) - called when we receive 'call_accepted' OR we initiate?
  // Actually, 'call_accepted' is the trigger.
  const startWebRTCCall = async (targetUserId: string) => {
    let stream = localStream;
    if (!stream) {
      // This might happen if 'ChatArea' handled gum.
      // We need to sync state. For now, request again or use ref?
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (e) { console.error('Failed to get media for start', e); return; }
    }

    await webRTC.initialize(stream);
    webRTC.onRemoteStream = (s) => setRemoteStream(s);
    webRTC.onIceCandidate = (candidate) => {
      ws.current?.send(JSON.stringify({
        type: 'ice-candidate',
        targetUserId: targetUserId,
        candidate
      }));
    };

    const offer = await webRTC.createOffer();
    ws.current?.send(JSON.stringify({
      type: 'offer',
      targetUserId: targetUserId,
      offer
    }));
  };

  useEffect(() => {
    // Listen for call_accepted in the main socket hook?
    // Added above.
    // We need to trigger startWebRTCCall inside the socket listener.
    // Since 'startWebRTCCall' depends on state/socket, might be hard to access inside useEffect closure if not careful.
    // Refactoring socket listen to use a ref or depend on methods is better.
    // For now, let's move the logic INTO the socket listener or use a separate effect if we store 'callState'.
  }, []);


  useEffect(() => {
    if (!currentUser) return;

    // Register user with WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'register', userId: currentUser.id }));
    } else if (ws.current) {
      const socket = ws.current;
      const originalOnOpen = socket.onopen;
      socket.onopen = (e: Event) => {
        if (originalOnOpen) originalOnOpen.call(socket, e);
        socket.send(JSON.stringify({ type: 'register', userId: currentUser.id }));
      };
    }

    const fetchUserData = async () => {
      try {
        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data.filter((u: User) => u.id !== currentUser.id));

        const chatsResponse = await axios.get(`/api/chats/user/${currentUser.id}`);
        setChats(chatsResponse.data);


        if (chatsResponse.data.length > 0 && !activeChat) {
          setActiveChat(chatsResponse.data[0].id);
        }

        // Fetch communities
        try {
          const communitiesResponse = await axios.get('/api/communities');
          setCommunities(communitiesResponse.data);
        } catch (error) {
          console.error('Failed to fetch communities', error);
        }

      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Effect to sync chats when new messages arrive for unknown chats
  const failedChatsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const chatIds = Object.keys(messages);
    chatIds.forEach(async (chatId) => {
      if (!chats.find(c => c.id === chatId) && !failedChatsRef.current.has(chatId)) {
        try {
          const response = await axios.get(`/api/chats/${chatId}`);
          setChats(prev => {
            if (prev.find(c => c.id === chatId)) return prev;
            return [...prev, response.data];
          });
        } catch (error) {
          console.error(`Failed to fetch chat ${chatId}`, error);
          failedChatsRef.current.add(chatId); // Mark as failed to avoid infinite loop
        }
      }
    });
  }, [messages, chats]);

  useEffect(() => {
    if (activeChat) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`/api/chats/${activeChat}/messages`);
          setMessages(prev => ({
            ...prev,
            [activeChat]: response.data
          }));
        } catch (error) {
          console.error(`Failed to fetch messages for chat ${activeChat}`, error);
        }
      };
      fetchMessages();
    }
  }, [activeChat]);

  const handleFileUpload = async (file: File, options?: { viewType?: 'once' | 'twice' }) => {
    if (!currentUser || !activeChat) return;

    const formData = new FormData();
    formData.append('file', file);
    if (options?.viewType) {
      formData.append('viewType', options.viewType);
    }

    try {
      const response = await axios.post('/api/upload', formData);
      // ... (response handling)

      const { url, fileName, type } = response.data;
      let msgType: 'image' | 'file' = 'file';
      if (type.startsWith('image/')) {
        msgType = 'image';
      }

      if (!ws.current) return;

      const message = {
        chatId: activeChat,
        text: url,
        sender: currentUser.id,
        timestamp: new Date(),
        type: msgType,
        fileName: fileName,
        viewType: options?.viewType // Add viewType to message
      };

      ws.current.send(JSON.stringify(message));

    } catch (error) {
      console.error('File upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        alert(`File upload failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error instanceof Error) {
        alert(`File upload failed: ${error.message}`);
      } else {
        alert('File upload failed: Unknown error');
      }
    }
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!currentUser) return;
    try {
      const response = await axios.post('/api/chats', {
        userId: currentUser.id,
        otherUserId,
      });
      const newChat = response.data;
      if (!chats.some(c => c.id === newChat.id)) {
        setChats(prev => [newChat, ...prev]);
      }
      setActiveChat(newChat.id);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to start chat', error);
    }
  };

  const handleGroupCreated = (newGroup: Chat) => {
    setChats(prev => [newGroup, ...prev]);
    setActiveChat(newGroup.id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const currentChat = chats.find(chat => chat.id === activeChat) || null;
  const currentMessages = activeChat ? messages[activeChat] || [] : [];

  const handleSendMessage = (chatId: string, text: string, type: 'text' | 'image' | 'file' | 'voice' | 'poll' = 'text', pollData?: any) => {
    if (!currentUser || !ws.current) return;

    const message = {
      chatId,
      text,
      sender: currentUser.id,
      timestamp: new Date(),
      type,
      poll: pollData
    };

    ws.current.send(JSON.stringify(message));
  };

  const handleTyping = (chatId: string, user: User) => {
    if (!ws.current) return;
    ws.current.send(JSON.stringify({ type: 'typing', chatId, user }));
  };

  const handleDeleteChat = async (chatId: string) => {
    // Confirmation handled by caller (UI component)


    try {
      await axios.delete(`/api/chats/${chatId}`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
      if (activeChat === chatId) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    }
  };

  const handleRemoveMember = async (chatId: string, userId: string) => {
    try {
      const response = await axios.delete(`/api/chats/${chatId}/members/${userId}`);
      const updatedChat = response.data;
      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const handleLogout = () => {
    // Close WebSocket connection
    if (ws.current) {
      ws.current.close();
    }
    // Clear current user and return to login
    setCurrentUser(null);
    setChats([]);
    setMessages({});
    setActiveChat(null);
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white overflow-hidden">
          {/* Navigation Rail */}
          <NavigationRail
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSettingsClick={() => setSettingsOpen(true)}
            onProfileClick={() => setShowUserProfile(true)}
            onLogout={handleLogout}
            currentUserAvatar={currentUser.avatar}
          />

          {/* Main Content Area - wrapped in flex to sit right of rail */}
          <div className="flex-1 flex overflow-hidden relative">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-20 z-30 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {activeTab === 'chats' && (
              <Sidebar
                user={currentUser}
                users={users}
                chats={chats}
                activeChat={activeChat}
                onChatSelect={setActiveChat}
                onSettingsOpen={() => setSettingsOpen(true)}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onStartChat={handleStartChat}
                onGroupCreated={handleGroupCreated}
                isOpen={sidebarOpen}
              />
            )}

            {activeTab === 'calls' && (
              <CallsSidebar
                users={users}
                onCall={handleInitiateCall}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            )}

            {activeTab === 'status' && currentUser && (
              <StatusSidebar
                currentUser={currentUser}
                users={users} // These users need to have 'status' populated from API
                onUpdateStatus={async (newStatus) => {
                  try {
                    await axios.put(`/api/users/${currentUser.id}/status`, { status: newStatus });
                    // Update current user state
                    setCurrentUser(prev => prev ? { ...prev, status: newStatus } : null);
                  } catch (error) {
                    console.error('Failed to update status', error);
                    throw error;
                  }
                }}
                onUploadStatus={async (file, caption) => {
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadResponse = await axios.post('/api/upload', formData);
                    const { url, type } = uploadResponse.data;

                    const mediaType = type.startsWith('video') ? 'video' : 'image';

                    await axios.put(`/api/users/${currentUser.id}/status`, {
                      status: caption,
                      statusMedia: url,
                      statusMediaType: mediaType
                    });

                    setCurrentUser(prev => prev ? {
                      ...prev,
                      status: caption,
                      statusMedia: url,
                      statusMediaType: mediaType
                    } : null);
                  } catch (error) {
                    console.error('Failed to upload status', error);
                    alert('Failed to upload status media');
                    throw error;
                  }
                }}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            )}

            {activeTab === 'communities' && (
              <CommunitiesSidebar
                communities={communities}
                onChannelSelect={(channelId) => {
                  setActiveChat(channelId);
                  // Ensure we have the chat in our list if not already
                  // Check if it's already in chats, if not, we might need to fetch it or rely on the messaging effect
                  if (!chats.find(c => c.id === channelId)) {
                    axios.get(`/api/chats/${channelId}`).then(res => {
                      setChats(prev => [...prev, res.data]);
                    });
                  }
                }}
                activeChat={activeChat}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            )}

            {activeTab === 'ai' && (
              <>
                <AiSidebar />
                <div className="flex-1 flex relative">
                  {currentUser && <AiChatArea user={currentUser} />}
                </div>
              </>
            )}

            {activeTab !== 'chats' && activeTab !== 'calls' && activeTab !== 'status' && activeTab !== 'communities' && activeTab !== 'ai' && (
              <div className="w-full sm:w-80 border-r bg-white dark:bg-dark-sidebar dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <p className="font-bold text-lg capitalize text-gray-900 dark:text-white">{activeTab}</p>
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            )}

            <div className="flex-1 flex relative">
              {activeChat ? (
                <ChatArea
                  chat={currentChat}
                  user={currentUser}
                  messages={currentMessages}
                  typingIndicator={typingIndicator}
                  onTyping={handleTyping}
                  onSendMessage={handleSendMessage}
                  onBackToSidebar={() => setActiveChat(null)}
                  onRemoveMember={handleRemoveMember}
                  onDeleteChat={handleDeleteChat}
                  onFileUpload={handleFileUpload}
                  onCall={handleInitiateCall}
                  onUpdateMessage={(updatedMsg) => {
                    setMessages(prev => {
                      const chatMessages = prev[activeChat] || [];
                      return {
                        ...prev,
                        [activeChat]: chatMessages.map(m => m.id === updatedMsg.id ? updatedMsg : m)
                      };
                    });
                  }}
                  // WebRTC Props
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isCallActive={isCallActive}
                  onEndCall={() => {
                    webRTC.close();
                    setLocalStream(null);
                    setRemoteStream(null);
                    setIsCallActive(false);
                    // Notify server?
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-dark-bg/50 backdrop-blur-sm">
                  <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                      <MessageSquare className="w-12 h-12 text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to Chat App</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Select a chat from the sidebar to start messaging, or create a new group to connect with friends.
                    </p>
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all lg:hidden"
                    >
                      Start Messaging
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Settings
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            user={currentUser}
            onUpdate={(updates) => setCurrentUser(prev => prev ? { ...prev, ...updates } : null)}
          />

          {showUserProfile && (
            <UserProfileModal
              user={currentUser}
              onClose={() => setShowUserProfile(false)}
            />
          )}

          {/* Incoming Call Modal */}
          {incomingCall && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center animate-bounce-subtle border border-gray-100 dark:border-gray-700">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 mb-6 shadow-glow relative">
                  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-3xl font-bold text-gray-700 dark:text-white">{incomingCall.callerName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{incomingCall.callerName}</h3>
                <p className="text-purple-600 dark:text-purple-400 font-medium mb-8">Incoming {incomingCall.callType} call...</p>

                <div className="flex items-center space-x-6 w-full justify-center">
                  <button
                    onClick={() => {
                      if (ws.current && incomingCall) {
                        ws.current.send(JSON.stringify({
                          type: 'call_rejected',
                          targetUserId: incomingCall.callerId,
                          callerId: currentUser.id
                        }));
                      }
                      setIncomingCall(null);
                    }}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-2 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-red-500/40">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Decline</span>
                  </button>

                  <button
                    onClick={() => {
                      if (ws.current && incomingCall) {
                        ws.current.send(JSON.stringify({
                          type: 'call_accepted',
                          targetUserId: incomingCall.callerId,
                          callerId: currentUser.id
                        }));
                      }
                      setIncomingCall(null);
                      alert('Call Connected! (Signaling successful)');
                    }}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-green-500/40 animate-pulse">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Accept</span>
                  </button>
                </div>
              </div>
            </div>
          )}        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;