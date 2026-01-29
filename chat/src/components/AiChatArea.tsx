import React, { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SentIcon, Mic02Icon, SparklesIcon, Copy01Icon, ThumbsUpIcon, ThumbsDownIcon, RefreshIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { Message, User } from '../types/chat';
import { API_BASE_URL } from '../config';

interface AiChatAreaProps {
    user: User;
}

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy class:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`transition-colors ${copied ? 'text-green-500' : 'hover:text-purple-600'}`}
            title={copied ? "Copied!" : "Copy"}
        >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="w-4 h-4" />
        </button>
    );
};

const AiChatArea: React.FC<AiChatAreaProps> = ({ user }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome-msg',
            text: "Hello! I'm your AI Assistant powered by Google Gemini. I can help you with code, questions, and more. How can I help you today?",
            sender: 'AI Assistant',
            senderId: 'ai-bot',
            timestamp: new Date(),
            type: 'text',
            isSent: false,
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const streamAiResponse = async (prompt: string, aiMsgId: string) => {
        setIsTyping(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error('AI response failed');
            if (!response.body) throw new Error('Response body is null');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullTextBuffer = '';
            let isStreamDone = false;

            const readStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        isStreamDone = true;
                        break;
                    }
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) fullTextBuffer += parsed.text;
                                else if (parsed.error) throw new Error(parsed.error);
                            } catch (e) {
                                console.error('Error parsing stream data:', e);
                            }
                        }
                    }
                }
            };

            readStream();

            let currentDisplayedIndex = 0;

            await new Promise<void>((resolve) => {
                const typeInterval = setInterval(() => {
                    if (currentDisplayedIndex < fullTextBuffer.length) {
                        const charsToType = Math.floor(Math.random() * 5) + 1;
                        const nextIndex = Math.min(currentDisplayedIndex + charsToType, fullTextBuffer.length);
                        const textChunk = fullTextBuffer.slice(currentDisplayedIndex, nextIndex);

                        setMessages(prev => prev.map(msg =>
                            msg.id === aiMsgId
                                ? { ...msg, text: msg.text + textChunk }
                                : msg
                        ));

                        currentDisplayedIndex = nextIndex;
                        scrollToBottom();
                    } else if (isStreamDone && currentDisplayedIndex >= fullTextBuffer.length) {
                        clearInterval(typeInterval);
                        resolve();
                    }
                }, 20);
            });

        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                text: "I'm sorry, I'm having trouble connecting to the AI service. Please check your internet connection.",
                sender: 'AI Assistant',
                senderId: 'ai-bot',
                timestamp: new Date(),
                type: 'text',
                isSent: false,
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: user.id,
            senderId: user.id,
            timestamp: new Date(),
            type: 'text',
            isSent: true,
        };

        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg: Message = {
            id: aiMsgId,
            text: '',
            sender: 'AI Assistant',
            senderId: 'ai-bot',
            timestamp: new Date(),
            type: 'text',
            isSent: false,
        };

        setMessages(prev => [...prev, userMsg, aiMsg]);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        await streamAiResponse(userMsg.text, aiMsgId);
    };

    const handleRegenerate = async (msgId: string) => {
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return;

        // Find the previous user message
        let prompt = '';
        for (let i = msgIndex - 1; i >= 0; i--) {
            if (messages[i].isSent) {
                prompt = messages[i].text;
                break;
            }
        }

        if (!prompt) return;

        // Clear the current AI message
        setMessages(prev => prev.map(msg =>
            msg.id === msgId ? { ...msg, text: '' } : msg
        ));

        await streamAiResponse(prompt, msgId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0b0e14] relative overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 flex justify-between items-center shadow-sm sticky top-0 z-20 shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <HugeiconsIcon icon={SparklesIcon} className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">AI Assistant</h2>
                        <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg) => {
                    const isUser = msg.isSent; // Simplified check
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            {!isUser && (
                                <div className="mr-2 self-start mt-1 hidden sm:block">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                                        <HugeiconsIcon icon={SparklesIcon} className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                            <div className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 shadow-sm ${isUser
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                {!isUser && (
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 opacity-70">
                                        <CopyButton text={msg.text} />
                                        <button className="hover:text-green-600 transition-colors" title="Good response">
                                            <HugeiconsIcon icon={ThumbsUpIcon} className="w-4 h-4" />
                                        </button>
                                        <button className="hover:text-red-600 transition-colors" title="Bad response">
                                            <HugeiconsIcon icon={ThumbsDownIcon} className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRegenerate(msg.id)}
                                            className="hover:text-blue-600 transition-colors ml-auto"
                                            title="Regenerate"
                                        >
                                            <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="mr-2 self-start mt-1 hidden sm:block">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                                <HugeiconsIcon icon={SparklesIcon} className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-3xl border border-transparent focus-within:border-purple-500/50 focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:shadow-lg transition-all duration-300">
                    <button className="p-3 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <HugeiconsIcon icon={Mic02Icon} className="w-5 h-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            adjustTextareaHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 resize-none py-3 max-h-32 min-h-[44px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim()}
                        className={`p-3 rounded-full transition-all duration-300 ${input.trim()
                            ? 'bg-purple-600 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                    AI can make mistakes. Please verify important information.
                </p>
            </div>
        </div>
    );
};

export default AiChatArea;
