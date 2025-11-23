import React, { useState } from 'react';
import { Upload, IndianRupee, Send, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const FeeReminders = () => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fee Reminder Agent</h1>
                    <p className="text-slate-500 dark:text-slate-400">Automated fee collection follow-ups.</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>1</div>
                        <span className="font-medium">Upload Data</span>
                    </div>
                    <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
                        <span className="font-medium">{isPrincipal ? "Review & Send" : "Review & Submit"}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-6">
                    {step === 1 ? (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6">
                            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto">
                                <Upload size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Defaulters List</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Upload your CSV/Excel file containing student fee details.</p>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all cursor-pointer">
                                <p className="font-medium text-slate-900 dark:text-white">Drag & drop file here or click to browse</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Supported formats: .csv, .xlsx</p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30"
                                >
                                    Process File
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 dark:text-white">Review Defaulters (12 Students)</h2>
                                <button onClick={() => setStep(1)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Change File</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Student</th>
                                            <th className="px-6 py-3">Class</th>
                                            <th className="px-6 py-3">Amount Due</th>
                                            <th className="px-6 py-3">Due Date</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {[
                                            { name: "Karthik R", class: "9-B", amount: "₹12,500", date: "15 Nov 2023" },
                                            { name: "Sneha M", class: "10-A", amount: "₹8,000", date: "10 Nov 2023" },
                                            { name: "Vikram S", class: "8-C", amount: "₹15,000", date: "01 Nov 2023" },
                                        ].map((student, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{student.name}</td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{student.class}</td>
                                                <td className="px-6 py-4 font-medium text-red-600 dark:text-red-400">{student.amount}</td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{student.date}</td>
                                                <td className="px-6 py-4"><span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">Overdue</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Reminder Settings</h2>

                        {isPrincipal ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template</label>
                                    <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-slate-900 dark:text-white">
                                        <option className="dark:bg-slate-900">Gentle Reminder (First Notice)</option>
                                        <option className="dark:bg-slate-900">Urgent Reminder (Overdue)</option>
                                        <option className="dark:bg-slate-900">Final Notice</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Channel</label>
                                    <div className="flex gap-2">
                                        {['WhatsApp', 'SMS', 'Email'].map((channel) => (
                                            <button key={channel} className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-700 dark:text-slate-300">
                                                {channel}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Preview</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"Dear Parent, this is a reminder that school fees of ₹12,500 for Karthik R is due. Please pay by 20 Nov to avoid late fees."</p>
                                </div>

                                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-500/30">
                                    <Send size={18} />
                                    Send Reminders
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Teacher Access</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">You can upload the defaulters list. The Principal will review and send the reminders.</p>
                                </div>
                                <button className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-slate-900/50">
                                    <Upload size={18} />
                                    Submit for Review
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4">History</h2>
                        <div className="space-y-3">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Batch #2023-11-A</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Sent to 45 parents</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeReminders;
