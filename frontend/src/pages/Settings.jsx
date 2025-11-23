import React, { useState } from 'react';
import { School, MessageSquare, Users, Bell, Globe, Save, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    // Mock state for teacher's schedule
    const [schedule, setSchedule] = useState([
        { id: 1, day: 'Monday', period: '1', className: 'Class 10-A', subject: 'Mathematics' },
        { id: 2, day: 'Monday', period: '2', className: 'Class 9-B', subject: 'Mathematics' },
        { id: 3, day: 'Tuesday', period: '3', className: 'Class 8-C', subject: 'Math Lab' },
    ]);

    const [newSlot, setNewSlot] = useState({ day: 'Monday', period: '1', className: 'Class 10-A', subject: 'Mathematics' });

    const handleAddSlot = () => {
        setSchedule([...schedule, { ...newSlot, id: Date.now() }]);
    };

    const handleDeleteSlot = (id) => {
        setSchedule(schedule.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Configure your profile and preferences.</p>
            </div>

            <div className="space-y-6">
                {/* Teacher Specific: My Schedule */}
                {isTeacher && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-primary-500" />
                            My Class Schedule
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add your weekly class schedule here. This will be reflected in the main timetable.</p>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                                <select
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                    value={newSlot.day}
                                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} className="dark:bg-slate-900">{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Period</label>
                                <select
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                    value={newSlot.period}
                                    onChange={(e) => setNewSlot({ ...newSlot, period: e.target.value })}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} className="dark:bg-slate-900">{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                                <select
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                    value={newSlot.className}
                                    onChange={(e) => setNewSlot({ ...newSlot, className: e.target.value })}
                                >
                                    {['Class 10-A', 'Class 10-B', 'Class 9-A', 'Class 9-B', 'Class 8-A', 'Class 8-B'].map(c => <option key={c} className="dark:bg-slate-900">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    value={newSlot.subject}
                                    onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleAddSlot}
                                className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Day</th>
                                        <th className="px-4 py-3">Period</th>
                                        <th className="px-4 py-3">Class</th>
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {schedule.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{slot.day}</td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{slot.period}</td>
                                            <td className="px-4 py-3 text-slate-900 dark:text-white">{slot.className}</td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{slot.subject}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {schedule.length === 0 && (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                                    No schedule added yet. Add your periods above.
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
