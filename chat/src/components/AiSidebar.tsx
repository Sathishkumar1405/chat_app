import React from 'react';

const AiSidebar: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-dark-sidebar border-r border-gray-200 dark:border-gray-800 w-full sm:w-80 md:w-96 lg:w-80 xl:w-96 transition-all duration-300 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 transition-all"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 absolute left-3 top-2.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Recent Conversations
                </div>
                {/* Mock History Items */}
                <div className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">React Component Help</span>
                        <span className="text-[10px] text-gray-400">2m ago</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-purple-500 transition-colors">
                        How do I create a functional component...
                    </p>
                </div>
                <div className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">Debug API Error</span>
                        <span className="text-[10px] text-gray-400">1h ago</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-purple-500 transition-colors">
                        I'm getting a 500 error when uploading...
                    </p>
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                    <span className="text-xl">+</span> New Chat
                </button>
            </div>
        </div>
    );
};

export default AiSidebar;
