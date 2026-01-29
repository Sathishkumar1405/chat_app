import React, { useState, useRef } from 'react';

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Tv01Icon, Key01Icon, Message01Icon, CameraVideoIcon, Notification01Icon, PaintBoardIcon, Database01Icon, CommandIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { User } from '../types/chat';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate?: (updates: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('general');
  const { language, setLanguage, t } = useLanguage();
  const [startMinimized, setStartMinimized] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreviewAvatar(user.avatar || null);
  }, [user.avatar]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // optimistically show preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        // Import axios if not present (Wait, I need to check imports. It is not imported in original file)
        // I will assume axios is global or I need to add import. 
        // Checking imports... Settings.tsx does NOT import axios. 
        // I will use fetch for now to avoid messing with imports at top of file if I can't easily mult-edit.
        // Actually, I can use axios since it is in package.json, but I need to `import axios from 'axios';`
        // I'll try to use fetch to be safe or just add the import in a separate step?
        // Let's use fetch.

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
        }

        const data = await uploadResponse.json();
        const avatarUrl = data.url; // /uploads/filename.ext

        // Update user profile on server
        const updateResponse = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: avatarUrl })
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Update failed: ${updateResponse.status} ${errorText}`);
        }

        const updatedUser = await updateResponse.json();

        // Update local state via callback
        onUpdate?.({ avatar: updatedUser.avatar });

      } catch (error: any) {
        console.error('Failed to change profile photo:', error);
        alert(`Failed to change profile photo: ${error.message}`);
        // Revert preview if needed, or just let it be
      }
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'general', label: t.settings.general, icon: Tv01Icon },
    { id: 'account', label: t.settings.account, icon: Key01Icon },
    { id: 'chats', label: t.settings.chats, icon: Message01Icon },
    { id: 'video-voice', label: t.settings.videoVoice, icon: CameraVideoIcon },
    { id: 'notifications', label: t.settings.notifications, icon: Notification01Icon },
    { id: 'personalization', label: t.settings.personalization, icon: PaintBoardIcon },
    { id: 'storage', label: t.settings.storage, icon: Database01Icon },
    { id: 'shortcuts', label: t.settings.shortcuts, icon: CommandIcon },
    { id: 'help', label: t.settings.help, icon: HelpCircleIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl w-full max-w-5xl h-full sm:h-[90vh] lg:h-[85vh] flex overflow-hidden animate-slide-up">
        {/* Sidebar */}
        <div className="w-72 bg-gray-50 dark:bg-dark-sidebar border-r border-gray-200 dark:border-gray-700/50 flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Close settings"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-dark-bg rounded-xl shadow-sm border border-gray-100 dark:border-transparent">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user.name}</h3>
                <p className="text-xs text-gray-400 truncate">Hey there! I'm using Ne...</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-scroll scrollbar-thin">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg'
                    }`}
                >
                  <HugeiconsIcon icon={section.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-dark-input">
          <div className="flex-1 p-8 overflow-y-scroll scrollbar-thin">
            {activeSection === 'general' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">General</h3>
                </div>

                {/* Language */}
                <div>
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase mb-4 tracking-wider">Language</h4>
                  <div className="bg-white dark:bg-dark-bg rounded-xl p-4 shadow-sm border border-gray-100 dark:border-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-gray-900 dark:text-white font-medium mb-1">{t.settings.language.title}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.language.description}</p>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                      >
                        {Object.entries(t.settings.language.options).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Startup */}
                <div>
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase mb-4 tracking-wider">Startup</h4>
                  <div className="bg-white dark:bg-dark-bg rounded-xl p-4 shadow-sm border border-gray-100 dark:border-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-gray-900 dark:text-white font-medium mb-1">{t.settings.startup.title}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.startup.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={startMinimized}
                          onChange={(e) => setStartMinimized(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Account</h3>
                </div>

                {/* Profile Picture */}
                <div className="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-transparent">
                  <div className="flex items-center space-x-4 mb-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden">
                      {previewAvatar ? (
                        <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <button
                      onClick={handlePhotoClick}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all hover:scale-105"
                    >
                      Change Photo
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Username</label>
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Bio</label>
                      <textarea
                        rows={3}
                        defaultValue="Hey there! I'm using CHAT KARO"
                        className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'chats' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chats</h3>
                </div>

                <div className="bg-white dark:bg-dark-bg rounded-xl p-4 space-y-4 shadow-sm border border-gray-100 dark:border-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-gray-900 dark:text-white font-medium mb-1">Enter is Send</h5>
                      <p className="text-sm text-gray-400">Press Enter to send messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-gray-900 dark:text-white font-medium mb-1">Media Auto-Download</h5>
                      <p className="text-sm text-gray-400">Automatically download media files</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'video-voice' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Video & Voice</h3>
                </div>

                <div className="bg-white dark:bg-dark-bg rounded-xl p-6 space-y-6 shadow-sm border border-gray-100 dark:border-transparent">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Camera</label>
                    <select className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Default Camera</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Microphone</label>
                    <select className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Default Microphone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Speaker</label>
                    <select className="w-full bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Default Speaker</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Notifications</h3>
                </div>

                <div className="bg-white dark:bg-dark-bg rounded-xl p-4 space-y-4 shadow-sm border border-gray-100 dark:border-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-gray-900 dark:text-white font-medium mb-1">Enable Notifications</h5>
                      <p className="text-sm text-gray-400">Receive notifications for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-gray-900 dark:text-white font-medium mb-1">Sound</h5>
                      <p className="text-sm text-gray-400">Play sound for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-gray-900 dark:text-white font-medium mb-1">Desktop Notifications</h5>
                      <p className="text-sm text-gray-400">Show notifications on desktop</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'personalization' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Personalization</h3>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-dark-bg rounded-xl p-4 shadow-sm border border-gray-100 dark:border-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-gray-900 dark:text-white font-medium mb-1">Dark Mode</h5>
                        <p className="text-sm text-gray-400">Switch to dark theme</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDarkMode}
                          onChange={toggleTheme}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-transparent">
                    <h5 className="text-gray-900 dark:text-white font-medium mb-4">Theme Color</h5>
                    <div className="grid grid-cols-6 gap-3">
                      {[
                        'bg-purple-500',
                        'bg-blue-500',
                        'bg-green-500',
                        'bg-red-500',
                        'bg-yellow-500',
                        'bg-pink-500'
                      ].map((color, idx) => (
                        <button
                          key={idx}
                          className={`w-12 h-12 rounded-full ${color} ring-2 ring-offset-2 ring-offset-dark-bg ring-transparent hover:ring-indigo-400 hover:scale-110 transition-all duration-300 shadow-lg`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'storage' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Storage</h3>
                </div>

                <div className="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-transparent">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Storage Used</span>
                        <span className="text-white font-medium">2.4 GB / 5 GB</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-dark-input rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '48%' }}></div>
                      </div>
                    </div>

                    <button className="w-full px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all hover:scale-105">
                      Clear Cache
                    </button>

                    <div className="pt-4 border-t border-gray-700">
                      <h5 className="text-gray-900 dark:text-white font-medium mb-3">Storage Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Messages</span>
                          <span className="text-white">1.2 GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Media</span>
                          <span className="text-white">1.0 GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Other</span>
                          <span className="text-white">0.2 GB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'shortcuts' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Shortcuts</h3>
                </div>

                <div className="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-transparent">
                  <div className="space-y-4">
                    {[
                      { action: 'New Chat', key: 'Ctrl + N' },
                      { action: 'Search', key: 'Ctrl + F' },
                      { action: 'Settings', key: 'Ctrl + ,' },
                      { action: 'Close Chat', key: 'Esc' },
                      { action: 'Next Chat', key: 'Ctrl + Tab' },
                      { action: 'Previous Chat', key: 'Ctrl + Shift + Tab' },
                    ].map((shortcut, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2">
                        <span className="text-gray-600 dark:text-gray-300">{shortcut.action}</span>
                        <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-dark-input text-gray-900 dark:text-white text-xs rounded border border-gray-200 dark:border-gray-700 font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'help' && (
              <div className="space-y-8 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Help</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-dark-bg rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-[#1f2235] transition-colors cursor-pointer shadow-sm border border-gray-100 dark:border-transparent">
                    <h5 className="text-gray-900 dark:text-white font-medium mb-2">Contact Support</h5>
                    <p className="text-sm text-gray-400">Need help? Our support team is here for you.</p>
                  </div>

                  <div className="bg-white dark:bg-dark-bg rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-[#1f2235] transition-colors cursor-pointer shadow-sm border border-gray-100 dark:border-transparent">
                    <h5 className="text-gray-900 dark:text-white font-medium mb-2">FAQ</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Find answers to commonly asked questions.</p>
                  </div>

                  <div className="bg-white dark:bg-dark-bg rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-[#1f2235] transition-colors cursor-pointer shadow-sm border border-gray-100 dark:border-transparent">
                    <h5 className="text-gray-900 dark:text-white font-medium mb-2">Privacy Policy</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Learn how we protect your data.</p>
                  </div>

                  <div className="bg-white dark:bg-dark-bg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-transparent">
                    <h5 className="text-gray-900 dark:text-white font-medium mb-2">About</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">CHAT KARO v1.0.0</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
    </div >
  );
};

export default Settings;
