import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon, Call02Icon, CircleIcon, UserGroupIcon, Settings01Icon, Logout01Icon, AiChat02Icon } from '@hugeicons/core-free-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationRailProps {
    activeTab: 'chats' | 'calls' | 'status' | 'communities' | 'ai';
    onTabChange: (tab: 'chats' | 'calls' | 'status' | 'communities' | 'ai') => void;
    onLogout?: () => void;
    onSettingsClick?: () => void;
    onProfileClick?: () => void;
    currentUserAvatar?: string;
}

const NavigationRail: React.FC<NavigationRailProps> = ({ activeTab, onTabChange, onLogout, onSettingsClick, onProfileClick, currentUserAvatar }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'chats', icon: BubbleChatIcon, label: t.navigation.chats },
        { id: 'calls', icon: Call02Icon, label: t.navigation.calls },
        { id: 'status', icon: CircleIcon, label: t.navigation.status },
        { id: 'communities', icon: UserGroupIcon, label: t.navigation.communities },
        { id: 'ai', icon: AiChat02Icon, label: t.navigation.ai },
    ] as const;

    return (
        <div className="w-16 flex flex-col items-center py-4 bg-slate-50 dark:bg-dark-sidebar border-r border-gray-200 dark:border-gray-800 h-full z-50">
            {/* Top Section */}
            <div className="flex-1 flex flex-col space-y-6 w-full">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex justify-center py-2 relative group focus:outline-none`}
                            title={item.label}
                            aria-label={item.label}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 w-1 bg-purple-600 rounded-r-lg" />
                            )}
                            <HugeiconsIcon
                                icon={item.icon}
                                className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-purple-600 fill-current' : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-500'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            {/* Unread Indicator for Status (Mock) */}
                            {item.id === 'status' && (
                                <div className="absolute top-2 right-4 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Section */}
            <div className="mt-auto space-y-4 w-full">
                <button
                    onClick={onSettingsClick}
                    className="w-full flex justify-center py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors duration-200 group"
                    title={t.navigation.settings}
                    aria-label={t.navigation.settings}
                >
                    <HugeiconsIcon icon={Settings01Icon} className="w-6 h-6" />
                </button>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full flex justify-center py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors duration-200 group"
                        title={t.navigation.logout}
                        aria-label={t.navigation.logout}
                    >
                        <HugeiconsIcon icon={Logout01Icon} className="w-6 h-6 ml-1" />
                    </button>
                )}
            </div>

            {/* Profile Section */}
            {onProfileClick && (
                <div className="mt-4">
                    <button
                        onClick={onProfileClick}
                        className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                        title={t.navigation.profile}
                        aria-label={t.navigation.profile}
                    >
                        {currentUserAvatar ? (
                            <img
                                src={currentUserAvatar}
                                alt={t.navigation.profile}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-sm">
                                {t.navigation.profile.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NavigationRail;
