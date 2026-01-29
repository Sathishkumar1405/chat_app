import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Call02Icon, CameraVideoIcon } from '@hugeicons/core-free-icons';
import { User } from '../types/chat';

interface CallsSidebarProps {
    users: User[];
    onCall: (userId: string, type: 'audio' | 'video') => void;
    isOpen: boolean;
    onToggle: () => void;
}

const CallsSidebar: React.FC<CallsSidebarProps> = ({ users, onCall, isOpen, onToggle }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-20 w-80 h-full bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none`}>
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Calls
                    </h2>
                    <button onClick={onToggle} className="lg:hidden p-2 hover:bg-white/50 rounded-full">
                        {/* Close icon for mobile */}
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search users to call..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-purple-500/20 text-gray-700 dark:text-gray-200 placeholder-gray-400 font-medium transition-all shadow-sm hover:shadow-md"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-100 dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-purple-200 dark:hover:scrollbar-thumb-gray-600 p-2">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="p-3 flex items-center justify-between rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {/* Online Status (simulated or real if available) */}
                                        {user.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onCall(user.id, 'audio')}
                                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all"
                                        title="Voice Call"
                                    >
                                        <HugeiconsIcon icon={Call02Icon} className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onCall(user.id, 'video')}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                                        title="Video Call"
                                    >
                                        <HugeiconsIcon icon={CameraVideoIcon} className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallsSidebar;
