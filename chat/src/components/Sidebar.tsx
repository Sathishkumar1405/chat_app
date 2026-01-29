import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Settings01Icon, Message01Icon, Cancel01Icon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { Chat, User } from '../types/chat';
import axios from 'axios';

interface SidebarProps {
  user: User;
  users: User[];
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onSettingsOpen: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onStartChat: (otherUserId: string) => void;
  onGroupCreated?: (group: Chat) => void;
}
const Sidebar: React.FC<SidebarProps> = ({ user, users, chats, activeChat, onChatSelect, onSettingsOpen, isOpen, onToggle, onStartChat, onGroupCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456'); // Default password for simplicity
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group creation state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'groups'>('all');

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split chats by type
  const groupChats = filteredChats.filter(chat => chat.type === 'group');
  const personalChats = filteredChats.filter(chat => chat.type === 'personal');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) && u.id !== user.id
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(e.target.value.length > 0);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/users/register', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword
      });

      // Clear form and close modal
      setNewUserName('');
      setNewUserEmail('');
      setIsAddUserModalOpen(false);
      alert('User added successfully! They appear in the search list.');
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGroupError('');

    if (selectedMembers.length < 2) {
      setGroupError('Please select at least 2 members');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/chats/groups', {
        name: groupName,
        members: [...selectedMembers, user.id], // Include current user
        admin: user.id
      });

      // Clear form and close modal
      setGroupName('');
      setSelectedMembers([]);
      setIsCreateGroupModalOpen(false);

      if (onGroupCreated) {
        onGroupCreated(response.data);
      } else {
        // Fallback if prop not provided (though it should be)
        alert(`Group "${groupName}" created successfully!`);
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Group creation error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.details || err.message || 'Failed to create group';
      setGroupError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatTime = (timestamp: Date | undefined) => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (hours < 168) {
      return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChatDetails = (chat: Chat) => {
    if (chat.type === 'personal') {
      const otherMember = chat.members?.find((m: any) => {
        if (!m || typeof m === 'string') return false;
        const memberId = m.id || m._id;
        return memberId !== user.id;
      }) as any;

      return {
        name: otherMember?.name || 'Unknown User',
        avatar: otherMember?.avatar || '',
        initial: otherMember?.name ? otherMember.name.charAt(0).toUpperCase() : '?'
      };
    }
    return {
      name: chat.name || 'Group Chat',
      avatar: chat.groupIcon || '',
      initial: chat.name ? chat.name.charAt(0).toUpperCase() : 'G'
    };
  };

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const { name, avatar, initial } = getChatDetails(chat);

    return (
      <div
        key={chat.id}
        onClick={() => {
          onChatSelect(chat.id);
          if (window.innerWidth < 1024) {
            onToggle();
          }
        }}
        className={`p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-gray-800 active:scale-[0.98] group ${activeChat === chat.id ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-r-4 border-purple-500 shadow-sm' : ''
          }`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-medium text-sm sm:text-base transition-transform duration-300 group-hover:scale-110 overflow-hidden ${chat.type === 'group' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
              chat.type === 'channel' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            {chat.online && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{name}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{formatTime(chat.lastMessage?.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage?.text}</p>
              {chat.unreadCount > 0 && (
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-[1rem] sm:min-w-[1.25rem] text-center ml-2 flex-shrink-0 shadow-md animate-bounce-subtle">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="p-3 sm:p-4 border-b border-gray-100/50 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-glow ring-2 ring-purple-200 ring-offset-2 transition-transform hover:scale-110 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gradient truncate">{user.name}</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onSettingsOpen}
                className="p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Settings"
              >
                <HugeiconsIcon icon={Settings01Icon} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/80 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 lg:hidden"
                aria-label="Close sidebar"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="relative group">
            <HugeiconsIcon icon={Search01Icon} className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base shadow-sm transition-all duration-300 focus:shadow-glow text-gray-900 dark:text-white"
            />
          </div>

          {/* Chat Format Tabs */}
          <div className="flex p-1 mt-3 gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'all'
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'personal'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50'
                }`}
            >
              Personal
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'groups'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50'
                }`}
            >
              Groups
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-white to-gray-50 dark:from-dark-sidebar dark:to-gray-900">
          {isSearching ? (
            <div className="animate-fade-in">
              {filteredUsers.length > 0 && <h2 className="p-3 text-sm font-bold text-purple-600 uppercase tracking-wide">Users</h2>}
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => onStartChat(u.id)}
                  className="p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-gray-800 dark:hover:to-gray-800 active:scale-[0.98] flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-medium text-sm sm:text-base shadow-md group-hover:scale-110 transition-transform overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{u.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-all duration-300 hover:scale-110">
                    <HugeiconsIcon icon={Message01Icon} className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  </button>
                </div>
              ))}

              {(activeTab === 'all' || activeTab === 'groups') && groupChats.length > 0 && (
                <>
                  <h2 className="p-3 text-sm font-bold text-purple-600 uppercase tracking-wide">Groups</h2>
                  {groupChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)}
                </>
              )}
              {(activeTab === 'all' || activeTab === 'personal') && personalChats.length > 0 && (
                <>
                  <h2 className="p-3 text-sm font-bold text-purple-600 uppercase tracking-wide">Personal</h2>
                  {personalChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)}
                </>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Groups Section */}
              {(activeTab === 'all' || activeTab === 'groups') && groupChats.length > 0 && (
                <div className="mb-2">
                  {(activeTab === 'all') && (
                    <h3 className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Groups</span>
                      <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px]">{groupChats.length}</span>
                    </h3>
                  )}
                  {groupChats.map(chat => (
                    <ChatItem key={chat.id} chat={chat} />
                  ))}
                </div>
              )}

              {/* Direct Messages Section */}
              {(activeTab === 'all' || activeTab === 'personal') && personalChats.length > 0 && (
                <div className="mb-2">
                  {(activeTab === 'all') && (
                    <h3 className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Direct Messages</span>
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">{personalChats.length}</span>
                    </h3>
                  )}
                  {personalChats.map(chat => (
                    <ChatItem key={chat.id} chat={chat} />
                  ))}
                </div>
              )}

              {/* Empty state specifically for tabs */}
              {activeTab === 'groups' && groupChats.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <HugeiconsIcon icon={UserGroupIcon} className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No groups joined</p>
                </div>
              )}
              {activeTab === 'personal' && personalChats.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <HugeiconsIcon icon={Message01Icon} className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No personal chats</p>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Add User FAB - only show on All tab */}
        {activeTab === 'all' && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="absolute bottom-6 right-20 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 group"
            aria-label="Add new contact"
          >
            <HugeiconsIcon icon={UserAdd01Icon} className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* New Group FAB - only show on Groups tab */}
        {activeTab === 'groups' && (
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="absolute bottom-6 right-6 p-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 group"
            aria-label="Create new group"
          >
            <HugeiconsIcon icon={UserGroupIcon} className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add New Contact</h3>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full p-1 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="e.g. Sarah Connor"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="sarah@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transform transition-all
                              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:-translate-y-1'}`}
                  >
                    {isLoading ? 'Adding...' : 'Save Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {isCreateGroupModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Group</h3>
                <button
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full p-1 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                {groupError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {groupError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="e.g. Family, Work Team"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Members (min. 2)
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {users.map(u => (
                      <label
                        key={u.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.id)}
                          onChange={() => toggleMemberSelection(u.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-medium text-sm overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || selectedMembers.length < 2}
                    className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transform transition-all
                      ${isLoading || selectedMembers.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 hover:-translate-y-1'}`}
                  >
                    {isLoading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div >
    </>
  );
};

export default Sidebar;
