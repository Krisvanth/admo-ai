import React, { useState } from 'react';
import { School, MessageSquare, Users, Bell, Globe, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const isTeacher = user?.role === 'TEACHER';

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Configure your profile and preferences.</p>
            </div>

            <div className="space-y-6">
                {/* School Profile (Only for Principal) */}
                {!isTeacher && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <School size={20} className="text-primary-500" />
                            School Profile
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">School Name</label>
                                <input type="text" defaultValue="Greenwood High School" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                <input type="text" defaultValue="123, Gandhi Road, Chennai" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                                <input type="email" defaultValue="admin@greenwood.edu" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                <input type="tel" defaultValue="+91 44 1234 5678" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Communication Channels */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquare size={20} className="text-green-500" />
                        Communication Channels
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">WhatsApp Business API</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Connected: +91 98765 43210</p>
                                </div>
                            </div>
                            <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Disconnect</button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">SMS Gateway</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Balance: ₹450.00</p>
                                </div>
                            </div>
                            <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">Top Up</button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                {!isTeacher && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Users size={20} className="text-orange-500" />
                            Data Management
                        </h2>
                        <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <p className="font-medium text-slate-900 dark:text-white">Update Student Database</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload new CSV to update student records</p>
                        </div>
                    </div>
                )}

                {/* Preferences */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Bell size={20} className="text-purple-500" />
                        Preferences
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Daily Summary Report</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Receive a daily summary email at 5 PM</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Auto-Translation</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Automatically translate messages based on parent preference</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
