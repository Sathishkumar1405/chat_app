import React, { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PencilEdit01Icon, Camera01Icon, Cancel01Icon, SentIcon, Add01Icon } from '@hugeicons/core-free-icons';
import { User } from '../types/chat';
import { API_BASE_URL } from '../config';

interface StatusSidebarProps {
    currentUser: User;
    users: User[];
    onUpdateStatus: (newStatus: string) => Promise<void>;
    onUploadStatus?: (file: File, caption: string) => Promise<void>;
    isOpen: boolean;
    onToggle: () => void;
}

const StatusSidebar: React.FC<StatusSidebarProps> = ({ currentUser, users, onUploadStatus, isOpen, onToggle }) => {
    const [statusText, setStatusText] = useState(currentUser.status || '');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    // Auto-close viewer after 5s if it's an image
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (viewingUser && viewingUser.statusMediaType === 'image') {
            timer = setTimeout(() => setViewingUser(null), 5000);
        }
        return () => clearTimeout(timer);
    }, [viewingUser]);

    useEffect(() => {
        if (previewFile) {
            const url = URL.createObjectURL(previewFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [previewFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPreviewFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!previewFile || !onUploadStatus) return;
        setIsLoading(true);
        try {
            await onUploadStatus(previewFile, statusText);
            setPreviewFile(null);
            setStatusText('');
        } catch (error) {
            console.error('Failed to upload', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMyStatusClick = () => {
        if (currentUser.statusMedia) {
            setViewingUser(currentUser);
        } else {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg: translate - x - 0 fixed lg:relative z - 20 w - 80 h - full bg - white dark: bg - dark - sidebar border - r border - gray - 100 dark: border - gray - 800 flex flex - col transition - transform duration - 300 shadow - 2xl lg: shadow - none`}>
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img src={currentUser.avatar || 'https://via.placeholder.com/40'} alt="Profile" className="w-10 h-10 rounded-full" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Status</h2>
                </div>
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                    {/* Add Status Button (Camera) */}
                    <button onClick={() => fileInputRef.current?.click()} className="hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-full transition-colors">
                        <HugeiconsIcon icon={Camera01Icon} className="w-5 h-5" />
                    </button>
                    <button onClick={onToggle} className="lg:hidden p-2 hover:bg-white/50 rounded-full">
                        <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">

                {/* My Status Tile */}
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={handleMyStatusClick}>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt="Me" className={`w - 12 h - 12 rounded - full object - cover ${currentUser.statusMediaType ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900' : ''} `} />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white text-lg">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {!currentUser.statusMediaType && (
                                <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                                    <HugeiconsIcon icon={Add01Icon} className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">My Status</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {currentUser.statusMediaType ? 'Tap to view status' : 'Tap to add status update'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-4" />

                {/* Recent Updates Header */}
                <div className="px-4 py-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent updates</h3>
                </div>

                {/* Users List */}
                <div className="pb-20"> {/* Padding bottom for FAB */}
                    {users.filter(u => u.statusMediaType).map(user => (
                        <div key={user.id} className="px-4 py-3 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => setViewingUser(user)}>
                            <div className={`rounded - full p - [2px] ${user.statusMediaType ? 'bg-green-500' : 'bg-gray-300'} `}>
                                <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {users.filter(u => !u.statusMediaType).map(user => (
                        <div key={user.id} className="px-4 py-3 flex items-center space-x-4 opacity-70">
                            <div className="rounded-full p-[2px] bg-gray-300 dark:bg-gray-700">
                                <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover grayscale" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {user.status || 'No updates'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-6 right-6 flex flex-col space-y-4">
                <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <HugeiconsIcon icon={PencilEdit01Icon} className="w-5 h-5" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-105 active:scale-95">
                    <HugeiconsIcon icon={Camera01Icon} className="w-6 h-6" />
                </button>
            </div>

            {/* Hidden File Input */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

            {/* Editor Overlay (Preview before Upload) */}
            {previewFile && previewUrl && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/50 to-transparent">
                        <button onClick={() => { setPreviewFile(null); setStatusText(''); }} className="p-2 hover:bg-white/10 rounded-full"><HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" /></button>
                        <h3 className="font-semibold">Send Status</h3>
                        <div className="w-8" />
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        {previewFile.type.startsWith('video') ? (
                            <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg" />
                        ) : (
                            <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                        )}
                    </div>
                    <div className="p-4 bg-black/80 flex items-center space-x-3">
                        <input
                            type="text"
                            value={statusText}
                            onChange={e => setStatusText(e.target.value)}
                            placeholder="Add a caption..."
                            className="flex-1 bg-gray-800 text-white border-none rounded-full px-4 py-3 focus:ring-1 focus:ring-green-500"
                        />
                        <button onClick={handleUpload} disabled={isLoading} className="p-3 bg-green-500 rounded-full text-white hover:bg-green-600 disabled:opacity-50">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Viewer Overlay */}
            {viewingUser && viewingUser.statusMedia && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
                    {/* Progress Bar (Simulated for image) */}
                    <div className="absolute top-0 left-0 w-full p-2 z-20 flex space-x-1">
                        <div className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
                            <div className={`h - full bg - white ${viewingUser.statusMediaType === 'image' ? 'animate-progress origin-left' : 'w-full'} `} style={{ animationDuration: '5s' }}></div>
                        </div>
                    </div>

                    <div className="absolute top-4 w-full px-4 flex items-center justify-between z-10">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => setViewingUser(null)}><HugeiconsIcon icon={Cancel01Icon} className="text-white w-6 h-6" /></button>
                            <img src={viewingUser.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full border border-white/20" />
                            <div className="text-white">
                                <h4 className="font-semibold text-sm">{viewingUser.name}</h4>
                                <p className="text-xs opacity-70">Just now</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center bg-black">
                        {viewingUser.statusMediaType === 'video' ? (
                            <video src={`${API_BASE_URL}${viewingUser.statusMedia}`} autoPlay className="max-h-full max-w-full" onEnded={() => setViewingUser(null)} />
                        ) : (
                            <img src={`${API_BASE_URL}${viewingUser.statusMedia}`} className="max-h-full max-w-full object-contain" />
                        )}
                    </div >

                    {
                        viewingUser.status && (
                            <div className="bg-black/40 p-4 text-center">
                                <p className="text-white text-lg">{viewingUser.status}</p>
                            </div>
                        )
                    }
                </div >
            )}
        </div >
    );
};

export default StatusSidebar;
