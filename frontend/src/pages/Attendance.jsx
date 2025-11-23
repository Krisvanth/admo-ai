import React, { useState } from 'react';
import { Upload, FileText, Bell, Check, X, Search } from 'lucide-react';

const Attendance = () => {
    const [isUploaded, setIsUploaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpload = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsUploaded(true);
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Agent</h1>
                    <p className="text-slate-500 dark:text-slate-400">Automate attendance collection and parent notification.</p>
                </div>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30">
                    <Bell size={18} />
                    Notify All Absentees
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Upload Attendance Sheet</h2>
                        <div
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all cursor-pointer group"
                            onClick={handleUpload}
                        >
                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400"></div> : <Upload size={24} />}
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag & drop</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports JPG, PNG, PDF</p>
                        </div>
                    </div>

                    {isUploaded && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-900 dark:text-white">Extraction Summary</h2>
                                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Success</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Total Students</span>
                                    <span className="font-medium text-slate-900 dark:text-white">45</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Present</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">42</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Absent</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">3</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Absentees List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 dark:text-white">Absentees List</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Student Name</th>
                                    <th className="px-6 py-3">Class</th>
                                    <th className="px-6 py-3">Parent Contact</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {[
                                    { name: "Arjun Kumar", class: "10-A", contact: "+91 98765 43210", status: "Pending" },
                                    { name: "Priya Sharma", class: "10-A", contact: "+91 98765 43211", status: "Notified" },
                                    { name: "Rahul V", class: "10-A", contact: "+91 98765 43212", status: "Pending" },
                                ].map((student, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{student.name}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{student.class}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{student.contact}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Notified' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-xs">Notify</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4">Recent Attendance Logs</h2>
                <div className="space-y-2">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Class 10-A Attendance</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded 2 hours ago</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">42/45 Present</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Notifications Sent</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
