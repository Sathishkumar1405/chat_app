import React from 'react';
import { X, Mail, User as UserIcon } from 'lucide-react';
import { User } from '../types/chat';

interface UserProfileModalProps {
    user: User;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Your Profile</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full p-1 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-input rounded-lg">
                            <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Name</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-input rounded-lg">
                            <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
