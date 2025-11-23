import React, { useState } from 'react';
import { MessageCircle, Search, ChevronRight, User, Bot } from 'lucide-react';

const ParentQueryBot = () => {
    const [activeChat, setActiveChat] = useState(0);

    const chats = [
        { id: 1, parent: "Mrs. Lakshmi", student: "Arun (Class 5)", lastMsg: "When is the school reopening?", time: "10:30 AM", unread: true },
        { id: 2, parent: "Mr. Rajesh", student: "Priya (Class 8)", lastMsg: "Fee payment issue", time: "Yesterday", unread: false },
        { id: 3, parent: "Mrs. Sarah", student: "John (Class 10)", lastMsg: "Leave application for 2 days", time: "Yesterday", unread: false },
    ];

    return (
        <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Query Bot</h1>
                <p className="text-slate-500 dark:text-slate-400">Automated responses for common queries.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
                {/* Chat List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input type="text" placeholder="Search parents..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.map((chat, i) => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(i)}
                                className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${activeChat === i ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium text-sm ${chat.unread ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{chat.parent}</h3>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{chat.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{chat.student}</p>
                                <p className={`text-xs truncate ${chat.unread ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{chat.lastMsg}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{chats[activeChat].parent}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{chats[activeChat].student}</p>
                            </div>
                        </div>
                        <button className="text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20">
                            View Student Profile
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30 dark:bg-slate-950/30">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                                <User size={16} className="text-slate-500 dark:text-slate-300" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                                <p className="text-sm text-slate-700 dark:text-slate-200">Hello, when is the school reopening after the rain holidays?</p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">10:30 AM</span>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-row-reverse">
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="bg-primary-600 dark:bg-primary-700 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                                <p className="text-sm">Hello! The school is scheduled to reopen on Monday, 25th Nov. We will send an official circular if there are any changes due to weather.</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] text-primary-100 dark:text-primary-200">10:30 AM</span>
                                    <span className="text-[10px] bg-white/20 px-1 rounded text-white">AI Auto-Reply</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type a reply..."
                                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            <button className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white px-4 rounded-xl font-medium transition-colors">
                                Send
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                            <button className="whitespace-nowrap text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                Take over chat
                            </button>
                            <button className="whitespace-nowrap text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                Mark as resolved
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentQueryBot;
