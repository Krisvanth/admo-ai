import React, { useState, useEffect } from 'react';
import { Calendar, UserX, ArrowRight, Bell, Clock, Users, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/services/api';

const Timetable = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';
    const [viewMode, setViewMode] = useState('class'); // 'class' or 'teacher'
    const [selectedEntity, setSelectedEntity] = useState('Class 10-A'); // Default selection

    // Leave Management State
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        reason: 'Sick Leave',
        start_date: '',
        end_date: '',
        hours: ''
    });
    const [adminComment, setAdminComment] = useState('');

    useEffect(() => {
        if (user?.school_id) {
            fetchLeaves();
        }
    }, [user]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const teacherId = isPrincipal ? null : user.id;
            const data = await leaveService.getLeaves(user.school_id, teacherId);
            setLeaves(data);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };
    const [formError, setFormError] = useState('');

    const handleLeaveSubmit = async () => {
        // Clear previous error
        setFormError('');

        // Validate dates are selected
        if (!leaveForm.start_date || !leaveForm.end_date) {
            setFormError('Please select both start and end dates');
            return;
        }

        // Validate start date is not in the past
        const today = new Date().toISOString().split('T')[0];
        if (leaveForm.start_date < today) {
            setFormError('Start date cannot be in the past');
            return;
        }

        // Validate end date is not before start date
        if (leaveForm.end_date < leaveForm.start_date) {
            setFormError('End date cannot be before start date');
            return;
        }

        try {
            const leaveData = {
                school_id: user.school_id,
                teacher_id: user.id,
                ...leaveForm,
                hours: leaveForm.hours ? parseInt(leaveForm.hours) : null
            };
            await leaveService.createLeave(leaveData);
            fetchLeaves();
            setLeaveForm({ ...leaveForm, start_date: '', end_date: '', teacher_comment: '', hours: '' });
            // Removed alert as per request
        } catch (error) {
            console.error("Failed to submit leave", error);
            setFormError(error.response?.data?.detail || 'Failed to submit leave request.');
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            await leaveService.updateLeaveStatus(leaveId, status, adminComment);
            fetchLeaves();
            setAdminComment('');
        } catch (error) {
            console.error("Failed to update leave", error);
        }
    };

    const pendingLeaves = leaves.filter(l => l.status === 'Pending');

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
                                {pendingLeaves.length === 0 ? (
                                    <p className="text-sm text-slate-500">No pending requests.</p>
                                ) : (
                                    pendingLeaves.map((leave) => (
                                        <div key={leave.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {leave.reason} • {leave.start_date} to {leave.end_date}
                                                        {leave.hours && ` • ${leave.hours} hrs`}
                                                    </p>
                                                    {leave.teacher_comment && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{leave.teacher_comment}"</p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/30">Pending</span>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
                                                <input
                                                    type="text"
                                                    placeholder="Optional comment..."
                                                    className="w-full mb-2 p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                    value={adminComment}
                                                    onChange={(e) => setAdminComment(e.target.value)}
                                                />
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                                        className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                        className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-red-500/20"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
                                    <select
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    >
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>On Duty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                        value={leaveForm.start_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                        value={leaveForm.end_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hours (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        placeholder="e.g. 4"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                                        value={leaveForm.hours}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, hours: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Comment (Optional)</label>
                                    <textarea
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white resize-none"
                                        rows="2"
                                        value={leaveForm.teacher_comment || ''}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, teacher_comment: e.target.value })}
                                    />
                                </div>
                                {formError && (
                                    <p className="text-xs text-red-500 font-medium">{formError}</p>
                                )}
                                <button
                                    onClick={handleLeaveSubmit}
                                    className="w-full bg-slate-900 dark:bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-primary-700"
                                >
                                    Submit Request
                                </button>
                            </div>

                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Clock size={20} className="text-orange-500" />
                                My History
                            </h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {leaves.map((leave) => (
                                    <div key={leave.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{leave.reason}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{leave.start_date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${leave.status === 'Approved' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                                                leave.status === 'Rejected' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                                                    leave.status === 'Cancelled' ? 'text-slate-500 bg-slate-100 dark:bg-slate-800' :
                                                        'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                                                }`}>
                                                {leave.status}
                                            </span>
                                            {(leave.status === 'Pending' || leave.status === 'Approved') && (
                                                <button
                                                    onClick={() => handleLeaveAction(leave.id, 'Cancelled')}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
