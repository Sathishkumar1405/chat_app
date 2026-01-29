import React from 'react';

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Notification01Icon, StarIcon, Clock01Icon, AiLockIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Chat, Message } from '../types/chat';

interface ChatInfoProps {
    chat: Chat;
    messages: Message[];
    onClose: () => void;
    targetUser?: any; // For personal chats to get user specific details
    onDeleteChat: () => void;
}

const ChatInfo: React.FC<ChatInfoProps> = ({ chat, messages, onClose, targetUser, onDeleteChat }) => {
    // Extract media messages
    const mediaMessages = messages.filter(m => m.type === 'image' || m.imageUrl || m.type === 'channel_post');
    const docMessages = messages.filter(m => m.type === 'file' || m.fileName);
    const linkMessages = messages.filter(m => m.link || (m.text && /(https?:\/\/[^\s]+)/g.test(m.text)));

    const displayName = targetUser ? targetUser.name : chat.name;
    const displayAvatar = targetUser ? targetUser.avatar : (chat.groupIcon || chat.avatar);
    const displayStatus = targetUser ? targetUser.status : (chat as any).description || chat.status || (chat.members ? `${chat.members.length} members` : 'No status');

    const [view, setView] = React.useState<'main' | 'starred' | 'media' | 'disappearing'>('main');
    const [mediaTab, setMediaTab] = React.useState<'media' | 'docs' | 'links'>('media');
    const [disappearingDuration, setDisappearingDuration] = React.useState<number>(chat.disappearingMessagesDuration || 0);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    React.useEffect(() => {
        setDisappearingDuration(chat.disappearingMessagesDuration || 0);
    }, [chat.disappearingMessagesDuration]);

    const updateDisappearingDuration = async (duration: number) => {
        // Optimistic update
        setDisappearingDuration(duration);
        (chat as any).disappearingMessagesDuration = duration;

        try {
            await fetch(`http://localhost:5000/api/chats/${chat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disappearingMessagesDuration: duration })
            });
            // Don't close view automatically, let user go back
        } catch (error) {
            console.error('Failed to update disappearing messages duration', error);
            // Revert on error
            setDisappearingDuration(chat.disappearingMessagesDuration || 0);
        }
    };

    if (view === 'disappearing') {
        return (
            <div className="w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0e14] flex flex-col h-full animate-slide-in-right z-30">
                <div className="h-16 flex items-center px-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 space-x-4">
                    <button onClick={() => setView('main')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 text-gray-500 dark:text-gray-400 transform rotate-180" />
                    </button>
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">Disappearing Messages</h2>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                            <HugeiconsIcon icon={Clock01Icon} className="w-12 h-12" />
                        </div>
                        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                            Make messages in this chat disappear after a set period of time.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {[
                            { label: '24 Hours', value: 86400 },
                            { label: '7 Days', value: 604800 },
                            { label: '30 Days', value: 2592000 },
                            { label: 'Off', value: 0 },
                        ].map((option) => (
                            <label key={option.value} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">{option.label}</span>
                                <input
                                    type="radio"
                                    name="disappearing-duration"
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                                    checked={disappearingDuration === option.value}
                                    onChange={() => updateDisappearingDuration(option.value)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const starredMessages = messages.filter(m => m.starred);

    if (view === 'starred') {
        return (
            <div className="w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0e14] flex flex-col h-full animate-slide-in-right z-30">
                <div className="h-16 flex items-center px-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 space-x-4">
                    <button onClick={() => setView('main')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 text-gray-500 dark:text-gray-400 transform rotate-180" />
                    </button>
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">Starred Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                    {starredMessages.length > 0 ? (
                        starredMessages.map(msg => (
                            <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                        {msg.senderName || (typeof msg.sender === 'string' ? msg.sender : msg.sender.name)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(msg.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{msg.text}</p>
                                {msg.imageUrl && (
                                    <div className="mt-2 h-20 w-20 rounded-md overflow-hidden">
                                        <img src={msg.imageUrl} className="w-full h-full object-cover" alt="Starred attachment" />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2 opacity-60">
                            <HugeiconsIcon icon={StarIcon} className="w-12 h-12" />
                            <p>No starred messages yet</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'media') {
        return (
            <div className="w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0e14] flex flex-col h-full animate-slide-in-right z-30">
                <div className="h-16 flex items-center px-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 space-x-4">
                    <button onClick={() => setView('main')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 text-gray-500 dark:text-gray-400 transform rotate-180" />
                    </button>
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">Media, Docs & Links</h2>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-around border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0e14]">
                    {['media', 'docs', 'links'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMediaTab(tab as any)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${mediaTab === tab
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {mediaTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                    {mediaTab === 'media' && (
                        mediaMessages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 p-2">
                                {mediaMessages.map((msg, i) => (
                                    <div key={msg.id || i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700">
                                        <img
                                            src={msg.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm mt-10">
                                <p>No media shared</p>
                            </div>
                        )
                    )}

                    {mediaTab === 'docs' && (
                        docMessages.length > 0 ? (
                            <div className="space-y-2 p-2">
                                {docMessages.map((msg, i) => (
                                    <div key={msg.id || i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400">
                                            <span className="text-xs font-bold">DOC</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {msg.fileName || 'Document'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(msg.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm mt-10">
                                <p>No documents shared</p>
                            </div>
                        )
                    )}

                    {mediaTab === 'links' && (
                        linkMessages.length > 0 ? (
                            <div className="space-y-2 p-2">
                                {linkMessages.map((msg, i) => {
                                    const url = msg.link || (msg.text?.match(/(https?:\/\/[^\s]+)/)?.[0]);
                                    return (
                                        <div key={msg.id || i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => url && window.open(url, '_blank')}>
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
                                                <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 -rotate-45" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate hover:underline">
                                                    {url}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(msg.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm mt-10">
                                <p>No links shared</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b0e14] flex flex-col h-full animate-slide-in-right z-30">

            {/* Header */}
            <div className="h-16 flex items-center px-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <button onClick={onClose} className="mr-4 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">Contact Info</h2>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {/* Profile Section */}
                <div className="flex flex-col items-center py-8 border-b-8 border-gray-50 dark:border-gray-900">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-4 shadow-inner">
                        {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                                {displayName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{displayName}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-6">
                        {targetUser?.email || '+1 234 567 890'}
                    </p>
                </div>

                {/* About Section */}
                <div className="p-4 border-b-8 border-gray-50 dark:border-gray-900">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">About</h3>
                    <p className="text-gray-800 dark:text-gray-200 text-base">{displayStatus || 'Available'}</p>
                </div>

                {/* Media Section */}
                <div
                    className="p-4 border-b-8 border-gray-50 dark:border-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                    onClick={() => setView('media')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Media, links and docs</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {mediaMessages.length + docMessages.length + linkMessages.length} <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                        </div>
                    </div>

                    {mediaMessages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {mediaMessages.slice(0, 6).map((msg, i) => (
                                <div key={msg.id || i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative cursor-pointer hover:opacity-90 transition-opacity">
                                    <img
                                        src={msg.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                            {mediaMessages.length > 6 && (
                                <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-medium cursor-pointer">
                                    +{mediaMessages.length - 6} more
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic py-2 text-center">No media shared</p>
                    )}
                </div>

                {/* Actions List */}
                <div className="p-2">
                    <OptionItem icon={<HugeiconsIcon icon={StarIcon} className="w-5 h-5" />} label="Starred messages" onClick={() => setView('starred')} />
                    <OptionItem icon={<HugeiconsIcon icon={Notification01Icon} className="w-5 h-5" />} label="Mute notifications" hasSwitch />
                    <OptionItem
                        icon={<HugeiconsIcon icon={Clock01Icon} className="w-5 h-5" />}
                        label="Disappearing messages"
                        subLabel={
                            chat.disappearingMessagesDuration
                                ? (chat.disappearingMessagesDuration === 86400 ? '24 Hours' : chat.disappearingMessagesDuration === 604800 ? '7 Days' : '30 Days')
                                : 'Off'
                        }
                        onClick={() => setView('disappearing' as any)}
                    />
                    <OptionItem icon={<HugeiconsIcon icon={AiLockIcon} className="w-5 h-5" />} label="Encryption" subLabel="Messages are end-to-end encrypted." />
                </div>

                <div className="p-4 mt-2">
                    <button className="w-full py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors px-4">
                        <span className="font-medium">Block {displayName}</span>
                    </button>
                    <button className="w-full py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors px-4">
                        <span className="font-medium">Report {displayName}</span>
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors px-4"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                        <span className="font-medium">Delete {chat.type === 'group' ? 'Group' : 'Chat'}</span>
                    </button>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-3/4 max-w-sm p-6 transform scale-100 transition-all border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
                                <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete {chat.type === 'group' ? 'Group' : 'Chat'}?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this {chat.type === 'group' ? 'group' : 'chat'}? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteChat();
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-md shadow-red-500/20 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for list items
const OptionItem = ({ icon, label, subLabel, hasSwitch, onClick }: any) => (
    <div onClick={onClick} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors">
        <div className="text-gray-400 mr-4">{icon}</div>
        <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</h4>
            {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
        </div>
        {hasSwitch && (
            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
            </div>
        )}
        {!hasSwitch && <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-gray-400" />}
    </div>
);

export default ChatInfo;
