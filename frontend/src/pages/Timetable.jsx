import React, { useState, useEffect } from 'react';
import { Calendar, UserX, ArrowRight, Bell, Clock, Users, User, Trash2 } from 'lucide-react';
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
        hours: '',
        teacher_comment: ''
    });
    // Changed to object for per-leave comments
    const [adminComments, setAdminComments] = useState({});
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            fetchLeaves();
        }
    }, [user]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            // Backend now handles role-based filtering via JWT
            const data = await leaveService.getLeaves();
            setLeaves(data);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
            if (error.response?.status === 401) {
                setFormError('Session expired. Please log in again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSubmit = async () => {
        // Clear previous messages
        setFormError('');
        setSuccessMessage('');

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

        // Validate hours if provided
        if (leaveForm.hours && (parseInt(leaveForm.hours) < 1 || parseInt(leaveForm.hours) > 24)) {
            setFormError('Hours must be between 1 and 24');
            return;
        }

        try {
            // Backend now gets school_id and teacher_id from JWT
            const leaveData = {
                start_date: leaveForm.start_date,
                end_date: leaveForm.end_date,
                reason: leaveForm.reason,
                hours: leaveForm.hours ? parseInt(leaveForm.hours) : null,
                teacher_comment: leaveForm.teacher_comment || null
            };
            await leaveService.createLeave(leaveData);
            fetchLeaves();
            setLeaveForm({ reason: 'Sick Leave', start_date: '', end_date: '', teacher_comment: '', hours: '' });
            setSuccessMessage('Leave request submitted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Failed to submit leave", error);
            setFormError(error.response?.data?.detail || 'Failed to submit leave request.');
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            const comment = adminComments[leaveId] || null;
            await leaveService.updateLeaveStatus(leaveId, status, comment);
            fetchLeaves();
            // Clear comment for this leave after action
            setAdminComments(prev => {
                const updated = { ...prev };
                delete updated[leaveId];
                return updated;
            });
        } catch (error) {
            console.error("Failed to update leave", error);
            setFormError(error.response?.data?.detail || 'Failed to update leave status.');
        }
    };

    const handleAdminCommentChange = (leaveId, value) => {
        setAdminComments(prev => ({ ...prev, [leaveId]: value }));
    };

    const [activeTab, setActiveTab] = useState('pending');

    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const historyLeaves = leaves.filter(l => l.status !== 'Pending');

    // Helper to render comments cleanly
    const CommentBlock = ({ label, text, author }) => (
        <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">{label}:</span>
            <span className="text-slate-600 dark:text-slate-400 italic">"{text}"</span>
        </div>
    );

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
                                <UserX size={20} className="text-primary-600" />
                                Leave Requests
                            </h2>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pending'
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    Pending ({pendingLeaves.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history'
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    History
                                </button>
                            </div>

                            {/* Content based on Active Tab */}
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                                {activeTab === 'pending' ? (
                                    pendingLeaves.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <p className="text-sm">No pending requests</p>
                                        </div>
                                    ) : (
                                        pendingLeaves.map((leave) => (
                                            <div key={leave.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                            {leave.reason}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                            <Calendar size={12} />
                                                            <span>{leave.start_date} {leave.end_date !== leave.start_date && ` - ${leave.end_date}`}</span>
                                                            {leave.hours && <span>• {leave.hours} hrs</span>}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">
                                                        Pending
                                                    </span>
                                                </div>

                                                {leave.teacher_comment && (
                                                    <CommentBlock label="Teacher" text={leave.teacher_comment} />
                                                )}

                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                    <input
                                                        type="text"
                                                        placeholder="Add comment (optional)..."
                                                        className="w-full mb-3 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                                                        value={adminComments[leave.id] || ''}
                                                        onChange={(e) => handleAdminCommentChange(leave.id, e.target.value)}
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                                            className="flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                            className="flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    historyLeaves.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <p className="text-sm">No history available</p>
                                        </div>
                                    ) : (
                                        historyLeaves.map((leave) => (
                                            <div key={leave.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${leave.status === 'Approved' ? 'bg-green-500' :
                                                        leave.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-400'
                                                    }`}></div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${leave.status === 'Approved' ? 'text-green-600 bg-green-50 border-green-100' :
                                                            leave.status === 'Rejected' ? 'text-red-600 bg-red-50 border-red-100' :
                                                                'text-slate-500 bg-slate-50 border-slate-200'
                                                        }`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                    {leave.start_date} {leave.end_date !== leave.start_date && `- ${leave.end_date}`}
                                                </div>

                                                <div className="space-y-1">
                                                    {leave.teacher_comment && <CommentBlock label="Teacher" text={leave.teacher_comment} />}
                                                    {leave.admin_comment && <CommentBlock label="Principal" text={leave.admin_comment} />}
                                                </div>

                                                {/* Allow cancelling approved leaves if needed, or deleting old records if you implement delete */}
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        onClick={() => leaveService.deleteLeave(leave.id).then(fetchLeaves)}
                                                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                                                    >
                                                        <Trash2 size={12} /> Delete Record
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserX size={20} className="text-primary-600" />
                                Submit Leave Request
                            </h2>
                            {/* Teacher View: Submission Form */}
                            <div className="space-y-3 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                                    <select
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:border-primary-500 transition-colors"
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    >
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>On Duty</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:border-primary-500 transition-colors"
                                            value={leaveForm.start_date}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:border-primary-500 transition-colors"
                                            value={leaveForm.end_date}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hours (Optional for partial day)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="24"
                                        placeholder="e.g. 4"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:border-primary-500 transition-colors"
                                        value={leaveForm.hours}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, hours: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Comment (Optional)</label>
                                    <textarea
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white resize-none focus:border-primary-500 transition-colors"
                                        rows="2"
                                        placeholder="Add note for principal..."
                                        value={leaveForm.teacher_comment || ''}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, teacher_comment: e.target.value })}
                                    />
                                </div>
                                {formError && (
                                    <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{formError}</p>
                                )}
                                {successMessage && (
                                    <p className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded">{successMessage}</p>
                                )}
                                <button
                                    onClick={handleLeaveSubmit}
                                    className="w-full bg-slate-900 dark:bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-primary-700 shadow-lg shadow-slate-200 dark:shadow-none transition-all"
                                >
                                    Submit Request
                                </button>
                            </div>

                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Clock size={20} className="text-orange-500" />
                                My History
                            </h2>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {leaves.map((leave) => (
                                    <div key={leave.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-all hover:border-slate-300">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{leave.reason}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{leave.start_date}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${leave.status === 'Approved' ? 'text-green-600 bg-green-50 border-green-100' :
                                                    leave.status === 'Rejected' ? 'text-red-600 bg-red-50 border-red-100' :
                                                        leave.status === 'Cancelled' ? 'text-slate-500 bg-slate-100 border-slate-200' :
                                                            'text-orange-600 bg-orange-50 border-orange-100'
                                                    }`}>
                                                    {leave.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Comments Section for Teacher */}
                                        <div className="space-y-1 mt-2">
                                            {leave.admin_comment && (
                                                <div className="text-xs bg-red-50 dark:bg-red-900/10 p-1.5 rounded text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/20">
                                                    <span className="font-semibold">Principal:</span> "{leave.admin_comment}"
                                                </div>
                                            )}
                                        </div>

                                        {(leave.status === 'Pending' || leave.status === 'Approved') && (
                                            <div className="mt-2 text-right">
                                                <button
                                                    onClick={() => handleLeaveAction(leave.id, 'Cancelled')}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                                >
                                                    Cancel Request
                                                </button>
                                            </div>
                                        )}
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
