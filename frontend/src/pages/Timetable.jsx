import React, { useState } from 'react';
import { Calendar, UserX, ArrowRight, Bell, Clock, Users, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Timetable = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';
    const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
    const [selectedEntity, setSelectedEntity] = useState('Class 10-A'); // Default selection

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timetable & Leave Agent</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {isPrincipal ? "Manage teacher leaves and automate substitution." : "View timetable and submit leave requests."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Approvals (Principal) OR Submission (Teacher) */}
                <div className="lg:col-span-1 space-y-6">
                    {isPrincipal ? (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserX size={20} className="text-red-500" />
                                New Leave Requests
                            </h2>
                            {/* Principal View: Approvals */}
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Sarah Johnson</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Science Dept • Sick Leave</p>
                                        </div>
                                        <span className="text-xs font-bold bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/30">Today</span>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Suggested Substitutes (AI)</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">MR</div>
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Mr. Rao</span>
                                                </div>
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Free</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <button className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20">Reject</button>
                                            <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-red-500/20">
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserX size={20} className="text-red-500" />
                                Submit Leave Request
                            </h2>
                            {/* Teacher View: Submission Form */}
                            <div className="space-y-3 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                                    <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white">
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>On Duty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                    <input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white" />
                                </div>
                                <button className="w-full bg-slate-900 dark:bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-primary-700">Submit Request</button>
                            </div>

                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Clock size={20} className="text-orange-500" />
                                My History
                            </h2>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Sick Leave</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Nov 12, 2024</p>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Approved</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timetable View */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar size={20} className="text-primary-500" />
                                {viewMode === 'class' ? `${selectedEntity} Timetable` : (isPrincipal ? `${selectedEntity}'s Schedule` : "My Timetable")}
                            </h2>

                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => { setViewMode('class'); setSelectedEntity('Class 10-A'); }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'class' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    Class View
                                </button>
                                <button
                                    onClick={() => { setViewMode('teacher'); setSelectedEntity(isPrincipal ? 'Mrs. Sarah' : 'Me'); }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'teacher' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    {isPrincipal ? "Teacher View" : "My View"}
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4">
                            {viewMode === 'class' && (
                                <select
                                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                    value={selectedEntity}
                                    onChange={(e) => setSelectedEntity(e.target.value)}
                                >
                                    <option className="dark:bg-slate-900">Class 10-A</option>
                                    <option className="dark:bg-slate-900">Class 10-B</option>
                                    <option className="dark:bg-slate-900">Class 9-A</option>
                                    <option className="dark:bg-slate-900">Class 9-B</option>
                                </select>
                            )}

                            {isPrincipal && viewMode === 'teacher' && (
                                <select
                                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                    value={selectedEntity}
                                    onChange={(e) => setSelectedEntity(e.target.value)}
                                >
                                    <option className="dark:bg-slate-900">Mrs. Sarah</option>
                                    <option className="dark:bg-slate-900">Mr. Rao</option>
                                    <option className="dark:bg-slate-900">Ms. Devi</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-x-auto">
                        <div className="grid grid-cols-8 gap-4 min-w-[800px]">
                            {/* Header */}
                            <div className="col-span-1"></div>
                            {['1', '2', '3', 'Break', '4', '5', '6'].map((period, i) => (
                                <div key={i} className="col-span-1 text-center">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">Period {period}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">09:00 - 09:45</div>
                                </div>
                            ))}

                            {/* Rows */}
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                                <React.Fragment key={day}>
                                    <div className="col-span-1 flex items-center font-bold text-slate-900 dark:text-white">{day}</div>
                                    {['Math', 'Eng', 'Sci', 'Break', 'Hist', 'Geo', 'PE'].map((subject, i) => (
                                        <div key={i} className={`col-span-1 p-3 rounded-xl text-center border ${subject === 'Break' ? 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-500' :
                                            subject === 'Math' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                subject === 'Sci' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' :
                                                    'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}>
                                            <div className="text-sm font-bold">{subject}</div>
                                            {subject !== 'Break' && (
                                                <div className="text-xs opacity-70">
                                                    {viewMode === 'teacher' ? 'Class 10-A' : 'Mr. X'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timetable;
