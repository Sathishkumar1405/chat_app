import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, HashtagIcon, ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Chat, Community } from '../types/chat';
import axios from 'axios';

interface CommunitiesSidebarProps {
    communities: Community[];
    onChannelSelect: (chatId: string) => void;
    activeChat: string | null;
    isOpen: boolean;
    onToggle: () => void;
}

const CommunitiesSidebar: React.FC<CommunitiesSidebarProps> = ({
    communities,
    onChannelSelect,
    activeChat,
    isOpen,
    onToggle
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCommunities, setExpandedCommunities] = useState<string[]>([]);
    const [channels, setChannels] = useState<{ [communityId: string]: Chat[] }>({});

    useEffect(() => {
        // Expand all by default
        setExpandedCommunities(communities.map(c => c.id));

        // Fetch channels for each community
        communities.forEach(async (community) => {
            try {
                const response = await axios.get(`/api/communities/${community.id}/channels`);
                setChannels(prev => ({
                    ...prev,
                    [community.id]: response.data
                }));
            } catch (error) {
                console.error(`Failed to fetch channels for community ${community.name}`, error);
            }
        });

    }, [communities]);

    const toggleCommunity = (communityId: string) => {
        setExpandedCommunities(prev => {
            const isExpanding = !prev.includes(communityId);

            // Auto-select first channel if expanding (deferred to avoid setState during render)
            if (isExpanding) {
                const communityChannels = channels[communityId];
                if (communityChannels && communityChannels.length > 0) {
                    setTimeout(() => onChannelSelect(communityChannels[0].id), 0);
                }
            }

            return isExpanding
                ? [...prev, communityId]
                : prev.filter(id => id !== communityId);
        });
    };

    console.log('CommunitiesSidebar rendered with:', communities);

    const filteredCommunities = communities.filter(c => {
        if (!c) return false;
        return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
        w-80 sm:w-96 lg:w-80 xl:w-96
        bg-white/95 dark:bg-dark-sidebar/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800 flex flex-col h-full shadow-2xl lg:shadow-none
        transform transition-all duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-4 border-b border-gray-100/50 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Communities</h2>
                    <div className="relative group">
                        <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base shadow-sm transition-all duration-300 focus:shadow-glow text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-white to-gray-50 dark:from-dark-sidebar dark:to-gray-900 p-2">
                    {filteredCommunities.map(community => {
                        const communityId = community.id || (community as any)._id;
                        return (
                            <div key={communityId} className="mb-2">
                                <div
                                    onClick={() => toggleCommunity(communityId)}
                                    className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    {expandedCommunities.includes(communityId) ? (
                                        <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4 text-gray-500 mr-2" />
                                    ) : (
                                        <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-gray-500 mr-2" />
                                    )}
                                    <span className="text-2xl mr-3">{community.icon}</span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{community.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{community.description}</p>
                                    </div>
                                </div>

                                {expandedCommunities.includes(communityId) && (
                                    <div className="ml-8 mt-1 space-y-1">
                                        {channels[communityId]?.map(channel => {
                                            const channelId = channel.id || (channel as any)._id;
                                            return (
                                                <div
                                                    key={channelId}
                                                    onClick={() => {
                                                        onChannelSelect(channelId);
                                                        if (window.innerWidth < 1024) onToggle();
                                                    }}
                                                    className={`
                                        flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200
                                        ${activeChat === channelId
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                                                        }
                                    `}
                                                >
                                                    <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4 mr-2 opacity-70" />
                                                    <span className="text-sm font-medium">{channel.name}</span>
                                                </div>
                                            );
                                        })}
                                        {(!channels[communityId] || channels[communityId].length === 0) && (
                                            <p className="text-xs text-gray-400 italic p-2">No channels</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredCommunities.length === 0 && (
                        <div className="text-center p-8 text-gray-400">
                            <p>No communities found</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CommunitiesSidebar;
