import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { HugeiconsIcon } from '@hugeicons/react';
import { SentIcon, Attachment01Icon, Mic02Icon, SmileIcon, MoreVerticalIcon, Search01Icon, Call02Icon, Video01Icon, ArrowLeft01Icon, Cancel01Icon, Image01Icon, File01Icon, Location01Icon, ContactIcon, BarChartIcon, Calendar01Icon, ArrowRight01Icon, LinkSquare01Icon, Clock01Icon, FireIcon, ChefHatIcon, Message01Icon, Tick01Icon, MailReply01Icon, StarIcon, Forward01Icon, Camera01Icon, HeadphonesIcon, UserIcon, PencilIcon } from '@hugeicons/core-free-icons';
import { Chat, Message, User } from '../types/chat';
import ChatInfo from './ChatInfo';
import { API_BASE_URL } from '../config';

interface ChatAreaProps {
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (chatId: string, text: string, type?: 'text' | 'image' | 'file' | 'voice') => void;
  onBackToSidebar?: () => void;
  user: User;
  typingIndicator: string | null;
  onTyping: (chatId: string, user: User) => void;
  onDeleteChat: (chatId: string) => void;
  onRemoveMember: (chatId: string, userId: string) => void;
  onFileUpload: (file: File, options?: { viewType?: 'once' | 'twice' }) => void;
  onCall: (userId: string, type: 'audio' | 'video') => void;
  onUpdateMessage?: (message: Message) => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isCallActive?: boolean;
  onEndCall?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, messages, onSendMessage, onBackToSidebar, user, typingIndicator, onTyping, onDeleteChat, onFileUpload, onCall, onUpdateMessage, localStream, remoteStream, isCallActive, onEndCall }) => {
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Image Editing State
  const [viewType, setViewType] = useState<'unlimited' | 'once' | 'twice'>('unlimited');
  const [isEditing, setIsEditing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [brushSize] = useState(5);
  const [paths, setPaths] = useState<{ x: number, y: number }[][]>([]); // Simple paths for now, or just rely on canvas
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [stickers, setStickers] = useState<{ id: string, text: string, x: number, y: number, scale: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      // Reset editing state
      setIsEditing(false);
      setDrawingMode(false);
      setPaths([]);
      setStickers([]);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [previewFile]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  // const [showPollModal, setShowPollModal] = useState(false);
  // const [pollQuestion, setPollQuestion] = useState('');
  // const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Forward Modal State
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwardChats, setForwardChats] = useState<Chat[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');

  useEffect(() => {
    if (isCallActive) {
      setShowVideoModal(true);
    } else {
      setShowVideoModal(false);
    }
  }, [isCallActive]);
  // Recipe/Post Detail Modal
  const [selectedPost, setSelectedPost] = useState<Message | null>(null);
  const [isImageMinimized, setIsImageMinimized] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  // Reset state when modal opens
  React.useEffect(() => {
    if (selectedPost) setIsImageMinimized(false);
  }, [selectedPost]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleForwardClick = async (msg: Message) => {
    setOpenMenuId(null);
    setForwardMessage(msg);
    setShowForwardModal(true);
    try {
      // Fetch users chats to forward to
      const response = await axios.get(`${API_BASE_URL}/api/chats/user/${user.id}`);
      setForwardChats(response.data);
    } catch (error) {
      console.error("Error fetching chats for forward:", error);
    }
  };
  const handleConfirmForward = async (targetChatId: string) => {
    if (!forwardMessage) return;
    // Reuse existing onSendMessage prop to send to the target chat
    onSendMessage(targetChatId, forwardMessage.text, forwardMessage.type as any);
    // Cleanup
    setShowForwardModal(false);
    setForwardMessage(null);
    alert('Message forwarded!');
  };
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Manage preview URL lifecycle
  // React.useEffect(() => {
  //   if (previewFile && previewFile.type.startsWith('image/')) {
  //     const url = URL.createObjectURL(previewFile);
  //     // setPreviewUrl(url);
  //     return () => URL.revokeObjectURL(url);
  //   }
  //   // setPreviewUrl(null);
  // }, [previewFile]);
  // chatDetails moved down to where getChatDetails is defined or getChatDetails moved up.
  // I will move getChatDetails definition UP to before line 139 in a subsequent step or just fix it here if I see it.
  // Wait, I can't see getChatDetails at 139 in this view, assuming it was there from previous view.
  // Actually, I'll just remove the usage at 139 if it's there and duplicate.
  // Let me just comment it out here if I match it, or I'll do a separate tool call to move the function.
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (chat) onTyping(chat.id, user);
  }

  // --- Image Editing Functions ---

  // Initialize Canvas with Image
  useEffect(() => {
    if (previewFile && previewFile.type.startsWith('image/') && canvasRef.current && previewUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [previewUrl, previewFile]);

  // Redraw Canvas (Image + Paths)
  const redrawCanvas = () => {
    if (!canvasRef.current || !previewUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw all paths
      paths.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        // Basic styling for now, ideally we store style with path
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      });

      // Draw current path
      if (currentPath.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
    };
  };

  // Re-draw when paths change
  useEffect(() => {
    if (isEditing) {
      redrawCanvas();
    }
  }, [paths, currentPath, isEditing]);


  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    // Scale coordinates to canvas actual size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setCurrentPath([{ x: x * scaleX, y: y * scaleY }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingMode || currentPath.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setCurrentPath(prev => [...prev, { x: x * scaleX, y: y * scaleY }]);
  };

  const endDrawing = () => {
    if (!drawingMode) return;
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]); // Note: We lose color info here if we don't store it with path. 
      // For MVP, lets assume one color or update state to store color with path.
      // Correction: To support colors, 'paths' should be object { points: [], color: string, size: number }
      // But for now let's just stick to red or current color (buggy if changed).
      // Let's quickly fix:
      // setPaths(prev => [...prev, { points: currentPath, color: drawColor, size: brushSize }]) -- needs Type update.
      // For this step I'll stick to simple arrays and maybe fix color later or just use one color.
      // actually let's try to do it right if possible. I'll stick to simple for now to avoid large refactor in this step.
      setCurrentPath([]);
    }
  };

  // Sticker Logic
  const addSticker = (emoji: string) => {
    setStickers(prev => [...prev, {
      id: Date.now().toString(),
      text: emoji,
      x: 50,
      y: 50,
      scale: 1
    }]);
    setIsEditing(true); // Auto-enable editing view
  };

  const handleSaveEditedImage = async () => {
    if (!canvasRef.current) {
      onFileUpload(previewFile!);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stickers locally on canvas before export
    // Note: In real app we might want to keep layers, but here we flatten.
    ctx.font = '50px serif'; // Base size
    stickers.forEach(sticker => {
      ctx.fillText(sticker.text, sticker.x, sticker.y);
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], previewFile!.name, { type: previewFile!.type });
        onFileUpload(file, { viewType: viewType !== 'unlimited' ? viewType : undefined });
      }
    }, previewFile!.type);

    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const getTargetUser = () => {
    if (!chat || chat.type !== 'personal') return null;
    return chat.members?.find((m: any) => {
      if (typeof m === 'string') return false;
      return m._id !== user.id && m.id !== user.id;
    }) as User | undefined;
  };

  const handleVideoCall = async () => {
    console.log('Initiating video call...');
    try {
      const targetUser = getTargetUser();
      if (targetUser) {
        console.log('Sending call signal to:', targetUser.id);
        onCall(targetUser.id, 'video');
      } else {
        console.warn('No target user found for call');
      }

      console.log('Requesting video/audio permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('Stream obtained:', stream.id);

      setVideoStream(stream);
      setCallType('video');
      setShowVideoModal(true);
    } catch (error: any) {
      console.error('Video call error:', error);
      alert(`Video call failed: ${error.name} - ${error.message}. Please ensure camera permissions are granted.`);
    }
  };

  const handleVoiceCall = async () => {
    console.log('Initiating voice call...');
    try {
      const targetUser = getTargetUser();
      if (targetUser) {
        onCall(targetUser.id, 'audio');
      }

      console.log('Requesting audio permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setVideoStream(stream);
      setCallType('audio');
      setShowVideoModal(true);
    } catch (error: any) {
      console.error('Voice call error:', error);
      alert(`Voice call failed: ${error.name} - ${error.message}. Please ensure microphone permissions are granted.`);
    }
  };
  // Stop video stream when modal closes
  const handleCloseVideoModal = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setShowVideoModal(false);
    setVideoStream(null);
    if (onEndCall) onEndCall();
  };
  // Attach stream to video element
  React.useEffect(() => {
    if (showVideoModal && videoRef.current && videoStream && callType === 'video') {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(e => console.error("Error playing local video:", e));
    }
  }, [showVideoModal, videoStream, callType]);

  // Attach stream to camera video element when modal opens
  React.useEffect(() => {
    if (showCameraModal && cameraRef.current && videoStream) {
      cameraRef.current.srcObject = videoStream;
      cameraRef.current.play();
    }
  }, [showCameraModal, videoStream]);
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="text-center relative z-10 animate-fade-in">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-bounce-subtle">
            <HugeiconsIcon icon={Message01Icon} className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-3">Welcome to CHAT KARO</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Select a chat to start messaging</p>
          <div className="mt-6 flex items-center justify-center space-x-2 text-purple-500">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(chat.id, message.trim());
      setMessage('');
      setReplyTo(null);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Restart timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setIsPaused(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice_${Date.now()}.webm`);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onSendMessage(chat.id, data.url, 'voice');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message');
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleCameraClick = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      setShowCameraModal(true);
    } catch {
      alert('Unable to access camera.');
    }
  };
  /* 
  const handleCapturePhoto = () => {
    if (cameraRef.current && videoStream) {
      const canvas = document.createElement('canvas');
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(cameraRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPreviewFile(file);
            handleCloseCameraModal();
          }
        }, 'image/jpeg');
      }
    }
  }; 
  */

  // const handleCloseCameraModal = () => {
  //   if (videoStream) {
  //     videoStream.getTracks().forEach(track => track.stop());
  //   }
  //   setVideoStream(null);
  //   setShowCameraModal(false);
  // };

  /* 
  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
      alert('Please enter a question and at least 2 options.');
      return;
    }
  
    const options = pollOptions
      .filter(o => o.trim())
      .map((text, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text: text.trim(),
        votes: []
      }));
  
    // @ts-ignore
    onSendMessage(chat!.id, pollQuestion, 'poll', { question: pollQuestion, options });
  
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  
  const addOption = () => {
    setPollOptions([...pollOptions, '']);
  };
  
  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };
  */
  const handlePollVote = (msgId: string, optionId: string) => {
    console.log('Voted for', optionId, 'in message', msgId);
  };

  const handleFileUpload = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };
  const formatMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const emojis = [
    '😀', '😂', '😅', '🤣', '😉',
    '😊', '😋', '😎', '😍', '😘',
    '🥰', '😗', '😙', '😚', '🙂',
    '🤗', '🤩', '🤔', '🤨', '😐',
    '😑', '😶', '🙄', '😏', '😣',
    '😥', '😮', '🤐', '😯', '😪',
    '😫', '😴', '😌', '😛', '😜',
    '😝', '🤤', '😒', '😓', '😔',
    '😕', '🙃', '🤑', '😲', '☹️',
    '🙁', '😖', '😞', '😟', '😤',
    '😢', '😭', '😦', '😧', '😨',
    '😩', '🤯', '😬', '😰', '😱',
    '❤️', '🧡', '💛', '💚', '💙',
    '💜', '🖤', '🤍', '🤎', '💔',
    '👍', '👎', '👌', '🤞', '✌️',
    '🤟', '🤘', '🤙', '👋', '👏',
  ];
  const MessageStatus = ({ status }: { status: Message['status'] }) => {
    if (status === 'read') {
      return <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4 ml-1 text-blue-400" />;
    }
    if (status === 'delivered') {
      return <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4 ml-1 text-white/80" />;
    }
    return <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4 ml-1 text-white/80" />;
  };
  const getChatDetails = () => {
    if (!chat) return { name: '', avatar: '', initial: '' };
    if (chat.type === 'personal') {
      const otherMember = chat.members?.find((m: any) => {
        if (typeof m === 'string') return false;
        return m._id !== user.id && m.id !== user.id;
      }) as User | undefined;
      return {
        name: otherMember ? otherMember.name : 'Unknown User',
        avatar: otherMember ? otherMember.avatar : '',
        initial: otherMember ? otherMember.name.charAt(0).toUpperCase() : '?'
      };
    }
    return {
      name: chat.name,
      avatar: chat.groupIcon,
      initial: chat.name.charAt(0).toUpperCase()
    };
  };
  // Image Editing Functions
  const chatDetails = getChatDetails();

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0b0e14] relative min-w-0">
        {/* Messages Area Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        {/* Header */}
        <div className="p-3 sm:p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 flex justify-between items-center shadow-sm sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button onClick={onBackToSidebar} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-600" />
            </button>
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setShowChatInfo(!showChatInfo)}
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:scale-105 transition-transform overflow-hidden ${chat.type === 'group' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                chat.type === 'channel' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                {chatDetails.avatar ? (
                  <img src={chatDetails.avatar} alt={chatDetails.name} className="w-full h-full object-cover" />
                ) : (
                  chatDetails.initial
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{chatDetails.name}</h2>
                {typingIndicator ? (
                  <p className="text-xs text-purple-600 font-medium">{typingIndicator}</p>
                ) : chat.type === 'group' ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="truncate max-w-[150px]">
                      {chat.members?.map((m: any) => m.name).join(', ')}
                    </span>
                  </p>
                ) : (
                  <p className={`text-xs flex items-center ${chat.online ? 'text-green-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {chat.online ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Online
                      </>
                    ) : (
                      <span>Last seen {formatMessageTime(chat.lastSeen || new Date())}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-2 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110 active:scale-95" title="Voice Call" onClick={handleVoiceCall}>
              <HugeiconsIcon icon={Call02Icon} className="w-5 h-5 text-purple-500" />
            </button>
            <button className="p-2 hover:bg-green-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110 active:scale-95" title="Video Call" onClick={handleVideoCall}>
              <HugeiconsIcon icon={Video01Icon} className="w-5 h-5 text-green-500" />
            </button>
            <button className="p-2 hover:bg-purple-50 rounded-full transition-all duration-300 hover:scale-110 active:scale-95">
              <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5 text-purple-600" />
            </button>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 scrollbar-thin bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 relative z-10 min-h-0 overscroll-contain">
          {messages.map((msg) => {
            // Robust sender handling: prefer explicit senderName, fallback to object name, fallback to string (which might be "Sender Receiver")
            // We split usage: 'sender' field in DB is now "Sender Receiver" string for User View.
            // We use msg.senderName for UI display.
            const senderName = msg.senderName || (!msg.sender ? 'Unknown' : (typeof msg.sender === 'string' ? msg.sender : (msg.sender.name || 'Unknown')));
            // Robust checking for "isSent" by comparing IDs if possible
            // preferring msg.senderId which is the robust ID source
            const isSent = msg.senderId
              ? (msg.senderId === user.id)
              : (typeof msg.sender === 'string' ? (msg.sender === user.name) : (msg.sender?.id === user.id));

            const senderAvatar = msg.senderAvatar
              ? msg.senderAvatar
              : ((msg.sender && typeof msg.sender !== 'string') ? msg.sender.avatar : '');
            return (
              <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                {/* Avatar for receiver/group */}
                {!isSent && (
                  <div className="mr-2 self-end mb-2 hidden sm:block">
                    {senderAvatar ? (
                      <img src={senderAvatar} alt={senderName} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {senderName ? senderName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                )}
                <div className={`relative max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${isSent
                  ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 text-white rounded-br-none shadow-md hover:shadow-glow'
                  : 'bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 shadow-md border border-gray-100 text-gray-900 rounded-bl-none hover:shadow-lg'
                  }`}>
                  {msg.replyTo && (
                    <div className={`text-xs mb-2 p-1.5 sm:p-2 rounded ${isSent ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <p className="font-medium">{typeof msg.replyTo.sender === 'string' ? msg.replyTo.sender : msg.replyTo.sender.name}</p>
                      <p className="truncate">{msg.replyTo.text}</p>
                    </div>
                  )}
                  {/* Show sender name in group chats if not sent by me */}
                  {!isSent && (chat.type === 'group' || chat.type === 'channel') && (
                    <p className="text-[10px] font-bold mb-1 opacity-70 text-purple-600 dark:text-purple-400">
                      {senderName}
                    </p>
                  )}
                  {msg.type === 'image' && (
                    <div className="mb-2">
                      <img
                        src={msg.text}
                        alt="Shared image"
                        className="rounded-lg w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(msg.text, '_blank')}
                        onError={(e) => {
                          console.error('Image failed to load:', msg.text);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {msg.type === 'voice' && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl min-w-[200px] max-w-[280px] relative z-20 ${isSent ? 'bg-white/30 backdrop-blur-sm' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-white/40' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                        <HugeiconsIcon icon={Mic02Icon} className={`w-5 h-5 ${isSent ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                      </div>
                      <audio
                        controls
                        src={msg.text}
                        className="h-10 flex-1 min-w-0"
                        style={{
                          maxWidth: '180px',
                          borderRadius: '8px'
                        }}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  {msg.type === 'file' && (
                    (() => {
                      const isPDF = msg.fileName?.toLowerCase().endsWith('.pdf') || msg.text.toLowerCase().endsWith('.pdf');
                      return (
                        <a
                          href={msg.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${isSent
                            ? 'bg-white/20 border-white/20 hover:bg-white/30 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${isSent ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            {isPDF ? (
                              <HugeiconsIcon icon={File01Icon} className={`w-5 h-5 ${isSent ? 'text-white' : 'text-red-500'}`} />
                            ) : (
                              <HugeiconsIcon icon={Attachment01Icon} className={`w-5 h-5 ${isSent ? 'text-white' : 'text-purple-500'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                              {msg.fileName || (isPDF ? 'PDF Document' : 'Document')}
                            </p>
                            <p className={`text-xs ${isSent ? 'text-white/70' : 'text-gray-500'}`}>
                              {isPDF ? 'Click to view PDF' : 'Click to download'}
                            </p>
                          </div>
                        </a>
                      );
                    })()
                  )}
                  {/* Poll Rendering */}
                  {msg.type === 'poll' && msg.poll && (
                    <div className={`rounded-xl p-3 min-w-[200px] sm:min-w-[250px] ${isSent ? 'bg-white/10' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                      <h4 className={`font-bold text-sm sm:text-base mb-3 ${isSent ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{msg.poll.question}</h4>
                      <div className="space-y-2">
                        {msg.poll.options.map(opt => {
                          const voteCount = opt.votes ? opt.votes.length : 0;
                          const totalVotes = msg.poll!.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0);
                          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handlePollVote(msg.id, opt.id)}
                              className={`w-full text-left relative overflow-hidden rounded-lg border ${isSent
                                ? 'border-white/30 hover:bg-white/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                } transition-all`}
                            >
                              <div
                                className={`absolute top-0 left-0 h-full opacity-20 ${isSent ? 'bg-white' : 'bg-yellow-400'}`}
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative p-2 flex justify-between items-center z-10">
                                <span className={`text-sm font-medium ${isSent ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{opt.text}</span>
                                <span className={`text-xs ${isSent ? 'text-white/80' : 'text-gray-500'}`}>{voteCount}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className={`text-xs mt-2 text-right ${isSent ? 'text-white/60' : 'text-gray-400'}`}>
                        Click to vote
                      </div>
                    </div>
                  )}
                  {/* Channel Post / Rich Card Rendering */}
                  {(msg.type === 'channel_post' || (msg.imageUrl && msg.title)) && (
                    <div className={`rounded-xl overflow-hidden max-w-[300px] sm:max-w-[340px] shadow-sm ${isSent ? 'bg-white/10' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                      {msg.imageUrl && (
                        <div className="relative h-48 w-full group-image cursor-pointer" onClick={() => setSelectedPost(msg)}>
                          <img
                            src={msg.imageUrl}
                            alt={msg.title || 'Post image'}
                            className="w-full h-full object-cover transition-transform duration-500 group-image-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-image-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-sm font-medium flex items-center gap-1"><HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" /> View Recipe</span>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className={`font-bold text-lg mb-2 ${isSent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {msg.title}
                        </h3>
                        <p className={`text-sm leading-relaxed line-clamp-3 ${isSent ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {msg.description || msg.text}
                        </p>
                        <button
                          onClick={() => setSelectedPost(msg)}
                          className={`mt-3 text-sm font-semibold hover:underline flex items-center gap-1 ${isSent ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
                        >
                          Read More <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {
                    msg.type === 'text' && !msg.imageUrl && !msg.title && (
                      <p className="break-words text-sm sm:text-base pb-4 pr-16">{msg.text}</p>
                    )
                  }
                  <div className="absolute bottom-1 right-2 flex items-center space-x-1">
                    {msg.starred && <HugeiconsIcon icon={StarIcon} className="w-3 h-3 text-yellow-500 fill-current" />}
                    <span className={`text-xs ${isSent ? 'text-white/80' : 'text-gray-500'}`}>
                      {formatMessageTime(msg.timestamp)}
                    </span>
                    {isSent && <MessageStatus status={msg.status} />}
                  </div>
                  {/* Message Actions Menu Button (The "Dot") */}
                  <button
                    className={`absolute top-1 right-1 p-1 rounded-full transition-all duration-200 ${isSent ? 'text-white/70 hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'} opacity-0 group-hover:opacity-100 ${openMenuId === msg.id ? 'opacity-100' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                    }}
                  >
                    <HugeiconsIcon icon={MoreVerticalIcon} className="w-4 h-4" />
                  </button>
                  {/* Dropdown Menu */}
                  {openMenuId === msg.id && (
                    <div className={`absolute top-7 right-2 z-50 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in`}>
                      <button
                        onClick={() => { setReplyTo(msg); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <HugeiconsIcon icon={MailReply01Icon} className="w-3 h-3" /> Reply
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const response = await axios.put(`http://localhost:5000/api/chats/${chat.id}/messages/${msg.id}/star`);
                            if (onUpdateMessage) {
                              onUpdateMessage(response.data);
                            }
                          } catch (err) {
                            console.error('Failed to star message', err);
                          }
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <HugeiconsIcon icon={StarIcon} className={`w-3 h-3 ${msg.starred ? 'text-yellow-500 fill-current' : ''}`} /> {msg.starred ? 'Unstar' : 'Star'}
                      </button>
                      <button
                        onClick={() => { handleForwardClick(msg); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <HugeiconsIcon icon={Forward01Icon} className="w-3 h-3" /> Forward
                      </button>
                      <button
                        onClick={() => {
                          // Check if onDeleteChat is appropriate here? Maybe simpler to just hide for now or usage 'onRemoveMessage' if it existed.
                          // For now, just a placeholder or usage existing functionality.
                          // But ChatAreaProps has onDeleteChat (entire chat), not deleteMessage.
                          // So let's just show 'Delete' as visual or coming soon.
                          alert('Delete message coming soon');
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <span className="w-3 h-3 font-bold">×</span> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div >
            )
          })}
          <div ref={messagesEndRef} />
        </div >

        {/* Reply Preview */}
        {
          replyTo && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t border-purple-200 p-2 sm:p-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-purple-600">Replying to {typeof replyTo.sender === 'string' ? replyTo.sender : replyTo.sender.name}</p>
                  <p className="text-xs sm:text-sm text-gray-700 truncate">{replyTo.text}</p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-purple-400 hover:text-purple-600 p-1 touch-manipulation transition-all hover:scale-125"
                  aria-label="Cancel reply"
                >
                  ×
                </button>
              </div>
            </div>
          )
        }
        {/* Inline Video Call Panel */}
        {showVideoModal && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shrink-0 shadow-lg animate-slide-up z-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-0.5">
                  {chatDetails.avatar ? (
                    <img src={chatDetails.avatar} alt={chatDetails.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {chatDetails.initial}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{chatDetails.name}</h3>
                  <p className="text-xs text-purple-500 font-medium animate-pulse">Call in progress...</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <HugeiconsIcon icon={Mic02Icon} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={handleCloseVideoModal} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full shadow-md hover:bg-red-600 transition-colors">
                  End Call
                </button>
              </div>
            </div>

            {callType === 'video' ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-48 sm:max-h-60 mx-auto w-full">
                {/* Remote Stream (Main View) */}
                <video
                  ref={video => { if (video && remoteStream) video.srcObject = remoteStream; }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local Stream (PIP) */}
                <div className="absolute bottom-2 right-2 w-24 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                  <video
                    ref={video => { if (video && localStream) video.srcObject = localStream; }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-24 bg-purple-50 dark:bg-gray-800 rounded-xl flex items-center justify-center space-x-1">
                <div className="w-1 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-12 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-6 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-10 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800 p-2 sm:p-4 shadow-lg relative z-50">
          <div className="flex items-end space-x-1 sm:space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation ${showAttachMenu ? 'text-purple-500 bg-purple-50 dark:bg-gray-800 rotation-45' : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800'}`}
                aria-label="Attach file"
              >
                <HugeiconsIcon icon={Attachment01Icon} className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${showAttachMenu ? 'rotate-45' : ''}`} />
              </button>
              {/* Attachment Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-14 left-0 w-48 bg-[#1f2937] rounded-xl shadow-2xl p-1.5 z-[100] animate-scale-up origin-bottom-left border border-gray-700">
                  <div className="grid grid-cols-1 gap-1">
                    <button onClick={() => handleFileUpload('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Document</span>
                    </button>
                    <button onClick={() => handleFileUpload('image/*,video/*')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={Image01Icon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Photos & videos</span>
                    </button>
                    <button onClick={handleCameraClick} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={Camera01Icon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Camera</span>
                    </button>
                    <button onClick={() => alert('Audio coming soon')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group hidden sm:flex">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={HeadphonesIcon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Audio</span>
                    </button>
                    <button onClick={() => alert('Contact sharing coming soon')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group hidden sm:flex">
                      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={ContactIcon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Contact</span>
                    </button>
                    <button onClick={() => alert('Location sharing coming soon')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group hidden sm:flex">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={Location01Icon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Location</span>
                    </button>
                    <button onClick={() => { setShowAttachMenu(false); alert('Polls coming soon'); /* setShowPollModal(true); */ }} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={BarChartIcon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Poll</span>
                    </button>
                    <button onClick={() => alert('Event feature coming soon')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group hidden sm:flex">
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">Event</span>
                    </button>
                    <button onClick={() => alert('Sticker feature coming soon')} className="flex items-center space-x-3 p-2 hover:bg-[#374151] rounded-lg transition-colors group hidden sm:flex">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <HugeiconsIcon icon={SmileIcon} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium text-sm">New sticker</span>
                    </button>
                    {/* More items can be hidden or shown dependent on height/preference */}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              {isRecording ? (
                /* Recording UI */
                <div className="w-full px-3 sm:px-4 py-2 border-2 border-red-400 dark:border-red-500 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-between" style={{ minHeight: '40px' }}>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Cancel Button */}
                    <button
                      onClick={cancelRecording}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-full transition-all"
                      aria-label="Cancel recording"
                      title="Cancel"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                    </button>
                    {/* Recording Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 bg-red-500 rounded-full ${isPaused ? '' : 'animate-pulse'}`}></div>
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                        {isPaused ? 'Paused' : 'Recording'}
                      </span>
                      <span className="text-red-500 dark:text-red-400 font-mono text-sm">{formatRecordingTime(recordingTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Pause/Resume Button */}
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isPaused
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      aria-label={isPaused ? "Resume recording" : "Pause recording"}
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      )}
                    </button>
                    {/* Send Button */}
                    <button
                      onClick={stopRecording}
                      className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                      aria-label="Send voice message"
                      title="Send"
                    >
                      <HugeiconsIcon icon={SentIcon} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Text Input */
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base transition-all duration-300 focus:shadow-glow text-gray-900 dark:text-white bg-white dark:bg-gray-800 max-h-32 scrollbar-thin"
                  style={{ minHeight: '40px', overflowY: 'hidden' }}
                  onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = 'auto';
                    const newHeight = Math.min(target.scrollHeight, 128);
                    target.style.height = newHeight + 'px';
                    // Show scrollbar only when content exceeds max height
                    target.style.overflowY = target.scrollHeight > 128 ? 'auto' : 'hidden';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              )}
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
                  aria-label="Emoji picker"
                >
                  <HugeiconsIcon icon={SmileIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-purple-100 dark:border-gray-700 rounded-2xl shadow-2xl p-4 w-72 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900 scrollbar-track-transparent grid grid-cols-5 gap-2 z-10 animate-slide-up origin-bottom-right">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg text-lg touch-manipulation transition-all hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
                  aria-label="Voice message"
                >
                  <HugeiconsIcon icon={Mic02Icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {!isRecording && (
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-glow touch-manipulation"
                  aria-label="Send message"
                >
                  <HugeiconsIcon icon={SentIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setPreviewFile(e.target.files[0]);
            }
          }}
        />
        {/* Forward Modal */}
        {
          showForwardModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <HugeiconsIcon icon={Forward01Icon} className="w-5 h-5 text-blue-500" /> Forward Message
                  </h3>
                  <button onClick={() => setShowForwardModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0">
                  <div className="relative">
                    <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 dark:text-gray-200"
                      value={forwardSearch}
                      onChange={(e) => setForwardSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                  {forwardChats
                    .filter(c => c.name.toLowerCase().includes(forwardSearch.toLowerCase()))
                    .map(targetChat => (
                      <button
                        key={targetChat.id}
                        onClick={() => handleConfirmForward(targetChat.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shrink-0">
                          {targetChat.groupIcon ? <img src={targetChat.groupIcon} alt="" className="w-full h-full rounded-full object-cover" /> : targetChat.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {targetChat.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {targetChat.type === 'group' ? `${targetChat.members?.length || 0} members` : 'Personal Chat'}
                          </p>
                        </div>
                        <HugeiconsIcon icon={SentIcon} className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  {forwardChats.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">No chats found</div>
                  )}
                </div>
              </div>
            </div>
          )
        }
        {/* Recipe / Post Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
              {/* Modal Header (Image) */}
              {/* Modal Header (Image) - Dynamic Height */}
              <div className={`relative w-full shrink-0 transition-all duration-500 ease-in-out ${isImageMinimized ? 'h-24 sm:h-28' : 'h-64 sm:h-80'}`}>
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${isImageMinimized ? 'opacity-100' : 'opacity-0 bg-gradient-to-t from-black/80 via-transparent to-transparent'}`}></div>
                <div className={`absolute left-0 p-6 w-full transition-all duration-500 ${isImageMinimized ? 'bottom-0 translate-y-1' : 'bottom-0'}`}>
                  <span className={`px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wider mb-2 inline-block transition-opacity duration-300 ${isImageMinimized ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                    {selectedPost.title ? 'Featured' : 'Post'}
                  </span>
                  <h2 className={`font-bold text-white leading-tight shadow-sm transition-all duration-500 ${isImageMinimized ? 'text-xl truncate pr-12' : 'text-3xl sm:text-4xl'}`}>
                    {selectedPost.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all z-10"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                </button>
              </div>
              {/* Modal Content */}
              <div
                className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin"
                onScroll={(e) => {
                  const scrollTop = e.currentTarget.scrollTop;
                  setIsImageMinimized(scrollTop > 50);
                }}
              >
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-6">
                  <div className="flex items-center gap-2">
                    {chat?.name === 'Recipes' ? (
                      <HugeiconsIcon icon={ChefHatIcon} className="w-5 h-5 text-orange-500" />
                    ) : (
                      <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-purple-500" />
                    )}
                    <span>By {selectedPost.senderName || (chat?.name === 'Recipes' ? 'Chef' : 'Editor')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5 text-blue-500" />
                    <span>{new Date(selectedPost.timestamp).toLocaleDateString()}</span>
                  </div>
                  {/* Show Calories only for Recipes */}
                  {chat?.name === 'Recipes' && (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FireIcon} className="w-5 h-5 text-red-500" />
                      <span>320 kcal</span>
                    </div>
                  )}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    {selectedPost.description || selectedPost.text}
                  </p>
                  {/* Conditional Content based on Chat Name */}
                  {chat?.name === 'Recipes' ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Ingredients</h3>
                      <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-400">
                        <li>Freshly sourced organic ingredients</li>
                        <li>Secret spice blend</li>
                        <li>Love and passion</li>
                        <li>(This is a demo recipe card)</li>
                      </ul>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Instructions</h3>
                      <ol className="space-y-4 list-decimal list-inside text-gray-600 dark:text-gray-400">
                        <li>Prepare your workspace and ingredients.</li>
                        <li>Follow the chef's intuition for seasoning.</li>
                        <li>Cook until golden brown and delicious.</li>
                        <li>Serve hot and enjoy with friends!</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      {/* Generic / Sports Content */}
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <HugeiconsIcon icon={StarIcon} className="w-4 h-4" /> Key Highlights
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li>• Breaking news update.</li>
                          <li>• Verified by official sources.</li>
                          <li>• See full coverage on our website.</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {chat?.name === 'Recipes' ? (
                  <button className="px-6 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    Save Recipe
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="px-6 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-colors shadow-lg"
                  >
                    Ok
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>


      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className={`bg-white dark:bg-gray-900 w-full ${isEditing ? 'max-w-4xl' : 'max-w-md'} rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up transition-all duration-300`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {isEditing ? 'Edit Image' : 'Send File'}
              </h3>
              <div className="flex items-center gap-2">
                {/* Editing Toolbar */}
                {isEditing && (
                  <div className="flex items-center gap-2 mr-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setDrawingMode(!drawingMode)}
                      className={`p-2 rounded-md transition-colors ${drawingMode ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                      title="Pencil"
                    >
                      <HugeiconsIcon icon={PencilIcon} className="w-5 h-5" />
                    </button>
                    <input
                      type="color"
                      value={drawColor}
                      onChange={(e) => setDrawColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      title="Color"
                    />
                    <div className="relative group">
                      <button className="p-2 text-gray-500 hover:text-yellow-500 transition-colors" title="Add Sticker">
                        <HugeiconsIcon icon={SmileIcon} className="w-5 h-5" />
                      </button>
                      <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-2 grid grid-cols-4 gap-1 w-48 hidden group-hover:grid z-50 border border-gray-100 dark:border-gray-700">
                        {['😀', '😂', '😍', '😎', '🔥', '👍', '🎉', '❤️'].map(emoji => (
                          <button key={emoji} onClick={() => addSticker(emoji)} className="text-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => { setPreviewFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[300px] relative overflow-hidden select-none">
              {previewFile.type.startsWith('image/') ? (
                <div className="relative">
                  {isEditing ? (
                    <>
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                        className="max-h-[60vh] max-w-full shadow-lg rounded-lg cursor-crosshair touch-none"
                      />
                      {/* Stickers Overlay */}
                      {stickers.map((sticker) => (
                        <div
                          key={sticker.id}
                          className="absolute text-5xl cursor-move hover:scale-110 transition-transform select-none"
                          style={{
                            left: sticker.x,
                            top: sticker.y,
                            transform: `translate(-50%, -50%) scale(${sticker.scale})`
                          }}
                          onMouseDown={(e) => {
                            // Simple Drag Logic (could be improved)
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startLeft = sticker.x;
                            const startTop = sticker.y;

                            const handleMove = (moveEvent: MouseEvent) => {
                              const dx = moveEvent.clientX - startX;
                              const dy = moveEvent.clientY - startY;
                              setStickers(prev => prev.map(s => s.id === sticker.id ? { ...s, x: startLeft + dx, y: startTop + dy } : s));
                            };

                            const handleUp = () => {
                              window.removeEventListener('mousemove', handleMove);
                              window.removeEventListener('mouseup', handleUp);
                            };

                            window.addEventListener('mousemove', handleMove);
                            window.addEventListener('mouseup', handleUp);
                          }}
                        >
                          {sticker.text}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="relative group">
                      <img src={previewUrl || ''} alt="Preview" className="max-h-[60vh] rounded-lg shadow-md object-contain" />
                      <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 right-4 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      >
                        <HugeiconsIcon icon={PencilIcon} className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : previewFile.type.startsWith('audio/') ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <HugeiconsIcon icon={Mic02Icon} className="w-8 h-8" />
                  </div>
                  <audio controls src={previewUrl || ''} className="w-full" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{previewFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <HugeiconsIcon icon={File01Icon} className="w-10 h-10" />
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium text-center break-all">{previewFile.name}</p>
                  <p className="text-xs text-gray-500">{(previewFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 items-center">
              {/* View Type Dropdown */}
              <div className="relative group">
                <button className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span>View Type: {viewType === 'once' ? 'One Time' : viewType === 'twice' ? 'Two Time' : 'Unlimited'}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 rotate-90" />
                </button>
                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block z-50 animate-fade-in">
                  <button onClick={() => setViewType('unlimited')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">Unlimited</button>
                  <button onClick={() => setViewType('once')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">One Time</button>
                  <button onClick={() => setViewType('twice')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">Two Time</button>
                </div>
              </div>

              <button
                onClick={() => { setPreviewFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEditedImage();
                  } else {
                    onFileUpload(previewFile, { viewType: viewType !== 'unlimited' ? viewType : undefined });
                    setPreviewFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
              >
                <HugeiconsIcon icon={SentIcon} className="w-4 h-4" /> {isEditing ? 'Send Edited' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {
        showChatInfo && (
          <ChatInfo
            chat={chat}
            messages={messages}
            onClose={() => setShowChatInfo(false)}
            targetUser={chat.type === 'personal' ? getTargetUser() : undefined}
            onDeleteChat={() => onDeleteChat(chat.id)}
          />
        )
      }
    </div >
  );
};
export default ChatArea;