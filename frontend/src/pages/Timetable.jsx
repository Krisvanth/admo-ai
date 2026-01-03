import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, UserX, Clock, Trash2, Settings, Plus, Save, RotateCcw, Edit2, X, Coffee, UtensilsCrossed, Flag, AlertTriangle, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { leaveService, timetableConfigService, classService, subjectService, teacherService, timetableEntryService } from '@/services/api';

const Timetable = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'PRINCIPAL';
    const [searchParams] = useSearchParams();
    
    // Main tabs: 'timetable' or 'leaves'
    const [mainTab, setMainTab] = useState(() => {
        const tab = searchParams.get('tab');
        return tab === 'leave' ? 'leaves' : 'timetable';
    });
    
    // Update mainTab when URL search params change
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'leave') {
            setMainTab('leaves');
        }
    }, [searchParams]);
    
    // Sub-tabs within timetable: 'view' or 'config'
    const [timetableSubTab, setTimetableSubTab] = useState('view');
    const [timetableViewMode, setTimetableViewMode] = useState('class');
    const [selectedEntity, setSelectedEntity] = useState('');

    // Timetable Configuration State
    const [timetableConfig, setTimetableConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [configError, setConfigError] = useState('');
    const [configSuccess, setConfigSuccess] = useState('');

    // New Slot Form State
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [newSlot, setNewSlot] = useState({
        slot_number: '',
        name: '',
        start_time: '',
        end_time: '',
        period_type: 'regular'
    });

    // Edit Slot State
    const [editingSlot, setEditingSlot] = useState(null);
    
    // Delete/Reset Confirmation State (replaces browser confirm)
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [cancelLeaveConfirm, setCancelLeaveConfirm] = useState(null);

    // Working Days State
    const [workingDays, setWorkingDays] = useState([]);
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // School data (for timetable dropdowns)
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

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
    const [adminComments, setAdminComments] = useState({});
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeLeaveTab, setActiveLeaveTab] = useState('pending');

    // Fetch data on load
    useEffect(() => {
        if (user) {
            fetchTimetableConfig();
            fetchLeaves();
            fetchSchoolData(); // Fetch for all users to populate timetable dropdowns
        }
    }, [user]);

    // Set default selected entity when classes/teachers are loaded
    useEffect(() => {
        if (classes.length > 0 && !selectedEntity && timetableViewMode === 'class') {
            setSelectedEntity(`Class ${classes[0].grade}-${classes[0].section}`);
        }
    }, [classes, timetableViewMode]);

    useEffect(() => {
        if (teachers.length > 0 && !selectedEntity && timetableViewMode === 'teacher') {
            setSelectedEntity(isPrincipal ? teachers[0].name : 'Me');
        }
    }, [teachers, timetableViewMode, isPrincipal]);

    const fetchSchoolData = async () => {
        try {
            const [classesData, subjectsData, teachersData] = await Promise.all([
                classService.getClasses(),
                subjectService.getSubjects(),
                teacherService.getTeachers()
            ]);
            setClasses(classesData);
            setSubjects(subjectsData);
            setTeachers(teachersData);
        } catch (error) {
            console.error("Failed to fetch school data", error);
        }
    };

    const fetchTimetableConfig = async () => {
        try {
            setConfigLoading(true);
            const data = await timetableConfigService.getConfig();
            setTimetableConfig(data);
            setWorkingDays(data.working_days || []);
        } catch (error) {
            console.error("Failed to fetch timetable config", error);
            setConfigError('Failed to load timetable configuration');
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            setLoading(true);
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

    // Configuration Management Functions
    const handleAddSlot = async () => {
        setConfigError('');
        setConfigSuccess('');

        if (!newSlot.slot_number || !newSlot.name || !newSlot.start_time || !newSlot.end_time) {
            setConfigError('Please fill all required fields');
            return;
        }

        try {
            const slotData = {
                ...newSlot,
                slot_number: parseInt(newSlot.slot_number)
            };
            const updatedConfig = await timetableConfigService.addTimeSlot(slotData);
            setTimetableConfig(updatedConfig);
            setNewSlot({ slot_number: '', name: '', start_time: '', end_time: '', period_type: 'regular' });
            setShowAddSlot(false);
            setConfigSuccess('Time slot added successfully!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (error) {
            setConfigError(error.response?.data?.detail || 'Failed to add time slot');
        }
    };

    const handleUpdateSlot = async (slotNumber, updates) => {
        setConfigError('');
        try {
            const updatedConfig = await timetableConfigService.updateTimeSlot(slotNumber, updates);
            setTimetableConfig(updatedConfig);
            setEditingSlot(null);
            setConfigSuccess('Time slot updated successfully!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (error) {
            setConfigError(error.response?.data?.detail || 'Failed to update time slot');
        }
    };

    const handleDeleteSlot = async (slotNumber) => {
        setConfigError('');
        try {
            const updatedConfig = await timetableConfigService.deleteTimeSlot(slotNumber);
            setTimetableConfig(updatedConfig);
            setDeleteConfirm(null);
            setConfigSuccess('Time slot deleted successfully!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (error) {
            setConfigError(error.response?.data?.detail || 'Failed to delete time slot');
            setDeleteConfirm(null);
        }
    };

    const handleUpdateWorkingDays = async () => {
        setConfigError('');
        try {
            const updatedConfig = await timetableConfigService.updateConfig({ working_days: workingDays });
            setTimetableConfig(updatedConfig);
            setConfigSuccess('Working days updated successfully!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (error) {
            setConfigError(error.response?.data?.detail || 'Failed to update working days');
        }
    };

    const handleResetConfig = async () => {
        setConfigError('');
        try {
            const updatedConfig = await timetableConfigService.resetConfig();
            setTimetableConfig(updatedConfig);
            setWorkingDays(updatedConfig.working_days);
            setResetConfirm(false);
            setConfigSuccess('Configuration reset to defaults!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (error) {
            setConfigError(error.response?.data?.detail || 'Failed to reset configuration');
            setResetConfirm(false);
        }
    };

    const toggleWorkingDay = (day) => {
        if (workingDays.includes(day)) {
            setWorkingDays(workingDays.filter(d => d !== day));
        } else {
            setWorkingDays([...workingDays, day]);
        }
    };

    // Leave Management Functions
    const handleLeaveSubmit = async () => {
        setFormError('');
        setSuccessMessage('');

        if (!leaveForm.start_date || !leaveForm.end_date) {
            setFormError('Please select both start and end dates');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (leaveForm.start_date < today) {
            setFormError('Start date cannot be in the past');
            return;
        }

        if (leaveForm.end_date < leaveForm.start_date) {
            setFormError('End date cannot be before start date');
            return;
        }

        if (leaveForm.hours && (parseInt(leaveForm.hours) < 1 || parseInt(leaveForm.hours) > 24)) {
            setFormError('Hours must be between 1 and 24');
            return;
        }

        try {
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
            setFormError(error.response?.data?.detail || 'Failed to submit leave request.');
        }
    };

    const handleLeaveAction = async (leaveId, status) => {
        try {
            const comment = adminComments[leaveId] || null;
            await leaveService.updateLeaveStatus(leaveId, status, comment);
            fetchLeaves();
            setAdminComments(prev => {
                const updated = { ...prev };
                delete updated[leaveId];
                return updated;
            });
            setCancelLeaveConfirm(null);
        } catch (error) {
            setFormError(error.response?.data?.detail || 'Failed to update leave status.');
        }
    };

    const handleAdminCommentChange = (leaveId, value) => {
        setAdminComments(prev => ({ ...prev, [leaveId]: value }));
    };

    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const historyLeaves = leaves.filter(l => l.status !== 'Pending');

    // Helper to get period type icon and color
    const getPeriodTypeStyle = (periodType) => {
        switch (periodType) {
            case 'break':
                return { icon: Coffee, color: 'text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/30' };
            case 'lunch':
                return { icon: UtensilsCrossed, color: 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30' };
            case 'assembly':
                return { icon: Flag, color: 'text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-900/30' };
            default:
                return { icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30' };
        }
    };

    // Helper component
    const CommentBlock = ({ label, text }) => (
        <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">{label}:</span>
            <span className="text-slate-600 dark:text-slate-400 italic">"{text}"</span>
        </div>
    );

    // Get regular periods only for timetable display
    const regularPeriods = timetableConfig?.time_slots?.filter(slot => slot.period_type === 'regular') || [];
    const allSlots = timetableConfig?.time_slots || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Timetable & Leaves
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isPrincipal ? "Manage schedules and handle leaves." : "View your schedule and submit leave requests."}
                    </p>
                </div>

                {/* Main Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setMainTab('timetable')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mainTab === 'timetable' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <Calendar size={16} /> Timetable
                    </button>
                    <button
                        onClick={() => setMainTab('leaves')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mainTab === 'leaves' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <UserX size={16} /> Leaves
                        {isPrincipal && pendingLeaves.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingLeaves.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ==================== TIMETABLE TAB ==================== */}
            {mainTab === 'timetable' && (
                <div className="space-y-6">
                    {/* Sub-tabs for Timetable - View and Configure */}
                    {isPrincipal && (
                        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setTimetableSubTab('view')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${timetableSubTab === 'view' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                View Timetable
                            </button>
                            <button
                                onClick={() => setTimetableSubTab('config')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${timetableSubTab === 'config' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Settings size={16} /> Configure
                            </button>
                        </div>
                    )}

                    {/* Timetable View Sub-Tab */}
                    {(timetableSubTab === 'view' || !isPrincipal) && (
                        <TimetableViewSection 
                            timetableViewMode={timetableViewMode}
                            setTimetableViewMode={setTimetableViewMode}
                            selectedEntity={selectedEntity}
                            setSelectedEntity={setSelectedEntity}
                            isPrincipal={isPrincipal}
                            configLoading={configLoading}
                            timetableConfig={timetableConfig}
                            allSlots={allSlots}
                            getPeriodTypeStyle={getPeriodTypeStyle}
                            classes={classes}
                            teachers={teachers}
                            subjects={subjects}
                            user={user}
                        />
                    )}

                    {/* Configuration Sub-Tab - Principal Only */}
                    {timetableSubTab === 'config' && isPrincipal && (
                        <ConfigurationSection
                            configError={configError}
                            configSuccess={configSuccess}
                            allDays={allDays}
                            workingDays={workingDays}
                            toggleWorkingDay={toggleWorkingDay}
                            handleUpdateWorkingDays={handleUpdateWorkingDays}
                            showAddSlot={showAddSlot}
                            setShowAddSlot={setShowAddSlot}
                            resetConfirm={resetConfirm}
                            setResetConfirm={setResetConfirm}
                            handleResetConfig={handleResetConfig}
                            newSlot={newSlot}
                            setNewSlot={setNewSlot}
                            handleAddSlot={handleAddSlot}
                            configLoading={configLoading}
                            allSlots={allSlots}
                            getPeriodTypeStyle={getPeriodTypeStyle}
                            editingSlot={editingSlot}
                            setEditingSlot={setEditingSlot}
                            deleteConfirm={deleteConfirm}
                            setDeleteConfirm={setDeleteConfirm}
                            handleDeleteSlot={handleDeleteSlot}
                            handleUpdateSlot={handleUpdateSlot}
                        />
                    )}
                </div>
            )}

            {/* ==================== LEAVES TAB ==================== */}
            {mainTab === 'leaves' && (
                <LeavesSection
                    isPrincipal={isPrincipal}
                    pendingLeaves={pendingLeaves}
                    historyLeaves={historyLeaves}
                    leaves={leaves}
                    activeLeaveTab={activeLeaveTab}
                    setActiveLeaveTab={setActiveLeaveTab}
                    adminComments={adminComments}
                    handleAdminCommentChange={handleAdminCommentChange}
                    handleLeaveAction={handleLeaveAction}
                    leaveForm={leaveForm}
                    setLeaveForm={setLeaveForm}
                    formError={formError}
                    successMessage={successMessage}
                    handleLeaveSubmit={handleLeaveSubmit}
                    cancelLeaveConfirm={cancelLeaveConfirm}
                    setCancelLeaveConfirm={setCancelLeaveConfirm}
                    CommentBlock={CommentBlock}
                />
            )}

        </div>
    );
};

// Leaves Section Component
const LeavesSection = ({
    isPrincipal, pendingLeaves, historyLeaves, leaves, activeLeaveTab, setActiveLeaveTab,
    adminComments, handleAdminCommentChange, handleLeaveAction,
    leaveForm, setLeaveForm, formError, successMessage, handleLeaveSubmit,
    cancelLeaveConfirm, setCancelLeaveConfirm, CommentBlock
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leave Management Panel */}
            <div className="lg:col-span-1">
                {isPrincipal ? (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <UserX size={20} className="text-primary-600" />
                            Leave Requests
                        </h2>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                            <button
                                onClick={() => setActiveLeaveTab('pending')}
                                className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${activeLeaveTab === 'pending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}
                            >
                                Pending ({pendingLeaves.length})
                            </button>
                            <button
                                onClick={() => setActiveLeaveTab('history')}
                                className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${activeLeaveTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}
                            >
                                History
                            </button>
                        </div>

                        {/* Leave List */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {activeLeaveTab === 'pending' ? (
                                pendingLeaves.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">No pending requests</div>
                                ) : (
                                    pendingLeaves.map((leave) => (
                                        <div key={leave.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-orange-100 dark:border-orange-900/30 relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 rounded-l-xl"></div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                    <p className="text-xs text-slate-500 mt-1">{leave.reason}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                        <Calendar size={12} />
                                                        <span>{leave.start_date} {leave.end_date !== leave.start_date && `- ${leave.end_date}`}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
                                            </div>
                                            {leave.teacher_comment && <CommentBlock label="Teacher" text={leave.teacher_comment} />}
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                <input
                                                    type="text"
                                                    placeholder="Add comment..."
                                                    className="w-full mb-3 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                    value={adminComments[leave.id] || ''}
                                                    onChange={(e) => handleAdminCommentChange(leave.id, e.target.value)}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                                        className="border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                        className="bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-xs font-semibold"
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
                                    <div className="text-center py-8 text-slate-500 text-sm">No history</div>
                                ) : (
                                    historyLeaves.map((leave) => (
                                        <div key={leave.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative">
                                            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${leave.status === 'Approved' ? 'bg-green-500' : leave.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white">{leave.teacher_name}</h3>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${leave.status === 'Approved' ? 'text-green-600 bg-green-50' : leave.status === 'Rejected' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'}`}>
                                                    {leave.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-2">{leave.start_date}</div>
                                            {leave.teacher_comment && <CommentBlock label="Teacher" text={leave.teacher_comment} />}
                                            {leave.admin_comment && <CommentBlock label="Principal" text={leave.admin_comment} />}
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    /* Teacher Leave Submission Form */
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <UserX size={20} className="text-primary-600" />
                            Submit Leave Request
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                                <select
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
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
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        value={leaveForm.start_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        value={leaveForm.end_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Hours (Optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    placeholder="e.g. 4"
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    value={leaveForm.hours}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, hours: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Comment</label>
                                <textarea
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none"
                                    rows="2"
                                    placeholder="Add note..."
                                    value={leaveForm.teacher_comment || ''}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, teacher_comment: e.target.value })}
                                />
                            </div>
                            {formError && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{formError}</p>}
                            {successMessage && <p className="text-xs text-green-600 bg-green-50 p-2 rounded">{successMessage}</p>}
                            <button
                                onClick={handleLeaveSubmit}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-semibold"
                            >
                                Submit Request
                            </button>
                        </div>

                        {/* My Leave History */}
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" />
                            My History
                        </h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {leaves.map((leave) => {
                                const isCancelling = cancelLeaveConfirm === leave.id;
                                
                                return (
                                    <div key={leave.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{leave.reason}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{leave.start_date}</p>
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${leave.status === 'Approved' ? 'text-green-600 bg-green-50 border-green-100' :
                                                leave.status === 'Rejected' ? 'text-red-600 bg-red-50 border-red-100' :
                                                    leave.status === 'Cancelled' ? 'text-slate-500 bg-slate-100 border-slate-200' :
                                                        'text-orange-600 bg-orange-50 border-orange-100'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        {leave.admin_comment && (
                                            <div className="mt-2 text-xs bg-red-50 p-1.5 rounded text-red-700 border border-red-100">
                                                <span className="font-semibold">Principal:</span> "{leave.admin_comment}"
                                            </div>
                                        )}
                                        {(leave.status === 'Pending' || leave.status === 'Approved') && (
                                            <div className="mt-2">
                                                {isCancelling ? (
                                                    <div className="flex items-center justify-end gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                                        <AlertTriangle size={14} className="text-red-500" />
                                                        <span className="text-xs text-red-600">Cancel this request?</span>
                                                        <button
                                                            onClick={() => handleLeaveAction(leave.id, 'Cancelled')}
                                                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                                        >
                                                            Yes
                                                        </button>
                                                        <button
                                                            onClick={() => setCancelLeaveConfirm(null)}
                                                            className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-right">
                                                        <button
                                                            onClick={() => setCancelLeaveConfirm(leave.id)}
                                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                        >
                                                            Cancel Request
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Calendar/Overview Panel */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-primary-500" />
                    Leave Overview
                </h2>
                <div className="text-center py-12 text-slate-500">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Leave calendar view coming soon...</p>
                    <p className="text-xs mt-2">This will show an overview of all scheduled leaves</p>
                </div>
            </div>
        </div>
    );
};

// Timetable View Section Component
const TimetableViewSection = ({ 
    timetableViewMode, setTimetableViewMode, selectedEntity, setSelectedEntity, 
    isPrincipal, configLoading, timetableConfig, allSlots, getPeriodTypeStyle,
    classes, teachers, subjects, user
}) => {
    const [timetableEntries, setTimetableEntries] = useState([]);
    const [teacherEntries, setTeacherEntries] = useState([]);
    const [entriesLoading, setEntriesLoading] = useState(false);
    const [editingCell, setEditingCell] = useState(null); // { day, slot_number }
    const [editForm, setEditForm] = useState({ subject_id: '', teacher_id: '', class_id: '' });
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    // Check if user is class teacher for the selected class
    const isClassTeacher = () => {
        if (isPrincipal) return false; // Principal has separate edit logic
        const classId = getSelectedClassId();
        if (!classId) return false;
        const cls = classes.find(c => c.id === classId);
        return cls?.class_teacher_id === user?.id;
    };

    // Get selected class ID from the entity string
    const getSelectedClassId = () => {
        if (!selectedEntity || timetableViewMode !== 'class') return null;
        const match = selectedEntity.match(/Class (\S+)-(\S+)/);
        if (match) {
            const grade = match[1];
            const section = match[2];
            const cls = classes.find(c => c.grade === grade && c.section === section);
            return cls?.id || null;
        }
        return null;
    };

    // Get selected teacher ID for teacher view
    const getSelectedTeacherId = () => {
        if (timetableViewMode !== 'teacher') return null;
        if (!isPrincipal) return user?.id; // Teachers see their own schedule
        const teacher = teachers.find(t => t.name === selectedEntity);
        return teacher?.id || null;
    };

    // Fetch timetable entries when class or teacher changes
    useEffect(() => {
        if (timetableViewMode === 'class') {
            const classId = getSelectedClassId();
            if (classId) {
                fetchClassEntries(classId);
            }
        } else if (timetableViewMode === 'teacher') {
            const teacherId = getSelectedTeacherId();
            fetchTeacherEntries(teacherId);
        }
    }, [selectedEntity, timetableViewMode, classes, teachers]);

    const fetchClassEntries = async (classId) => {
        try {
            setEntriesLoading(true);
            const entries = await timetableEntryService.getEntries(classId);
            setTimetableEntries(entries);
        } catch (error) {
            console.error('Failed to fetch timetable entries:', error);
        } finally {
            setEntriesLoading(false);
        }
    };

    const fetchTeacherEntries = async (teacherId) => {
        try {
            setEntriesLoading(true);
            const entries = await timetableEntryService.getTeacherEntries(teacherId);
            setTeacherEntries(entries);
        } catch (error) {
            console.error('Failed to fetch teacher entries:', error);
        } finally {
            setEntriesLoading(false);
        }
    };

    // Get entry for a specific day and slot (class view)
    const getEntry = (day, slotNumber) => {
        return timetableEntries.find(e => e.day === day && e.slot_number === slotNumber);
    };

    // Get entry for a specific day and slot (teacher view)
    const getTeacherEntry = (day, slotNumber) => {
        return teacherEntries.find(e => e.day === day && e.slot_number === slotNumber);
    };

    // Check if user can edit this cell
    const canEditCell = (slot) => {
        if (slot.period_type !== 'regular') return false;
        if (timetableViewMode === 'class') {
            return isPrincipal || isClassTeacher();
        }
        if (timetableViewMode === 'teacher') {
            // In teacher view, only non-principals (teachers) can add their own classes
            return !isPrincipal;
        }
        return false;
    };

    // Handle cell click for editing
    const handleCellClick = (day, slotNumber, slot) => {
        if (!canEditCell(slot)) return;
        
        if (timetableViewMode === 'class') {
            const entry = getEntry(day, slotNumber);
            setEditForm({
                subject_id: entry?.subject_id?.toString() || '',
                teacher_id: entry?.teacher_id?.toString() || '',
                class_id: ''
            });
        } else {
            // Teacher view - adding a class to their schedule
            const entry = getTeacherEntry(day, slotNumber);
            setEditForm({
                subject_id: entry?.subject_id?.toString() || '',
                teacher_id: user?.id?.toString() || '',
                class_id: entry?.class_id?.toString() || ''
            });
        }
        setEditingCell({ day, slot_number: slotNumber });
        setSaveError('');
    };

    // Save entry
    const handleSaveEntry = async () => {
        setSaveError('');
        setSaveSuccess('');

        try {
            if (timetableViewMode === 'class') {
                const classId = getSelectedClassId();
                if (!classId) return;

                await timetableEntryService.createOrUpdateEntry({
                    class_id: classId,
                    day: editingCell.day,
                    slot_number: editingCell.slot_number,
                    subject_id: editForm.subject_id ? parseInt(editForm.subject_id) : null,
                    teacher_id: editForm.teacher_id ? parseInt(editForm.teacher_id) : null
                });
                
                await fetchClassEntries(classId);
            } else {
                // Teacher view - adding their own class
                if (!editForm.class_id) {
                    setSaveError('Please select a class');
                    return;
                }

                await timetableEntryService.createOrUpdateEntry({
                    class_id: parseInt(editForm.class_id),
                    day: editingCell.day,
                    slot_number: editingCell.slot_number,
                    subject_id: editForm.subject_id ? parseInt(editForm.subject_id) : null,
                    teacher_id: user?.id
                });
                
                await fetchTeacherEntries(user?.id);
            }
            
            setEditingCell(null);
            setSaveSuccess('Timetable updated!');
            setTimeout(() => setSaveSuccess(''), 2000);
        } catch (error) {
            setSaveError(error.response?.data?.detail || 'Failed to save entry');
        }
    };

    // Clear entry (remove subject and teacher)
    const handleClearEntry = async () => {
        setSaveError('');

        try {
            if (timetableViewMode === 'class') {
                const classId = getSelectedClassId();
                if (!classId) return;

                await timetableEntryService.createOrUpdateEntry({
                    class_id: classId,
                    day: editingCell.day,
                    slot_number: editingCell.slot_number,
                    subject_id: null,
                    teacher_id: null
                });
                
                await fetchClassEntries(classId);
            } else {
                // For teacher view, we need the class_id from the entry
                const entry = getTeacherEntry(editingCell.day, editingCell.slot_number);
                if (entry?.class_id) {
                    await timetableEntryService.createOrUpdateEntry({
                        class_id: entry.class_id,
                        day: editingCell.day,
                        slot_number: editingCell.slot_number,
                        subject_id: null,
                        teacher_id: null
                    });
                    
                    await fetchTeacherEntries(user?.id);
                }
            }
            
            setEditingCell(null);
            setSaveSuccess('Period cleared!');
            setTimeout(() => setSaveSuccess(''), 2000);
        } catch (error) {
            setSaveError(error.response?.data?.detail || 'Failed to clear entry');
        }
    };

    // Get hint text based on permissions
    const getEditHint = () => {
        if (timetableViewMode === 'class') {
            if (isPrincipal) return '(Click on a period to edit)';
            if (isClassTeacher()) return '(You are the class teacher - click to edit)';
            return '';
        }
        if (timetableViewMode === 'teacher' && !isPrincipal) {
            return '(Click on a period to add your class)';
        }
        return '';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-primary-500" />
                        {timetableViewMode === 'class' ? `${selectedEntity} Timetable` : (isPrincipal ? `${selectedEntity}'s Schedule` : "My Timetable")}
                        {getEditHint() && (
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-2">
                                {getEditHint()}
                            </span>
                        )}
                    </h2>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => { 
                                setTimetableViewMode('class'); 
                                if (classes.length > 0) {
                                    setSelectedEntity(`Class ${classes[0].grade}-${classes[0].section}`);
                                }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timetableViewMode === 'class' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Class View
                        </button>
                        <button
                            onClick={() => { 
                                setTimetableViewMode('teacher'); 
                                setSelectedEntity(isPrincipal && teachers.length > 0 ? teachers[0].name : 'Me'); 
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timetableViewMode === 'teacher' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            {isPrincipal ? "Teacher View" : "My View"}
                        </button>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
                        {saveSuccess}
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-4">
                    {timetableViewMode === 'class' && (
                        <select
                            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                        >
                            {classes.length === 0 ? (
                                <option value="">No classes available</option>
                            ) : (
                                classes.map((cls) => (
                                    <option key={cls.id} value={`Class ${cls.grade}-${cls.section}`}>
                                        Class {cls.grade}-{cls.section} {cls.class_teacher_id === user?.id ? '(Your Class)' : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    )}

                    {isPrincipal && timetableViewMode === 'teacher' && (
                        <select
                            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                        >
                            {teachers.length === 0 ? (
                                <option value="">No teachers available</option>
                            ) : (
                                teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.name}>
                                        {teacher.name}
                                    </option>
                                ))
                            )}
                        </select>
                    )}
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="p-6 overflow-x-auto">
                {configLoading || entriesLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading timetable...</div>
                ) : (
                    <div className="min-w-[800px]">
                        {/* Header Row */}
                        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `80px repeat(${allSlots.length}, 1fr)` }}>
                            <div></div>
                            {allSlots.map((slot) => {
                                return (
                                    <div key={slot.slot_number} className="text-center p-2">
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{slot.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{slot.start_time} - {slot.end_time}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day Rows */}
                        {(timetableConfig?.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map((day) => (
                            <div key={day} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `80px repeat(${allSlots.length}, 1fr)` }}>
                                <div className="flex items-center font-bold text-slate-900 dark:text-white text-sm">
                                    {day.substring(0, 3)}
                                </div>
                                {allSlots.map((slot) => {
                                    const style = getPeriodTypeStyle(slot.period_type);
                                    const isBreak = slot.period_type !== 'regular';
                                    const entry = timetableViewMode === 'class' 
                                        ? getEntry(day, slot.slot_number)
                                        : getTeacherEntry(day, slot.slot_number);
                                    const isEditing = editingCell?.day === day && editingCell?.slot_number === slot.slot_number;
                                    const canEdit = canEditCell(slot);

                                    return (
                                        <div
                                            key={slot.slot_number}
                                            onClick={() => !isEditing && handleCellClick(day, slot.slot_number, slot)}
                                            className={`p-3 rounded-xl text-center border transition-all relative ${isBreak
                                                ? style.color
                                                : canEdit
                                                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer hover:shadow-md'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                                } ${isEditing ? 'ring-2 ring-primary-500 z-10' : ''}`}
                                        >
                                            {isBreak ? (
                                                <div className="text-sm font-medium opacity-70">{slot.name}</div>
                                            ) : isEditing ? (
                                                /* Inline Edit Form */
                                                <div className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 z-20 min-w-[250px]" onClick={(e) => e.stopPropagation()}>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                                                            {day} - {slot.name}
                                                        </div>
                                                        
                                                        {saveError && (
                                                            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs">
                                                                {saveError}
                                                            </div>
                                                        )}

                                                        <div className="space-y-3">
                                                            {/* Class selector - only for teacher's My View */}
                                                            {timetableViewMode === 'teacher' && !isPrincipal && (
                                                                <div>
                                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Class</label>
                                                                    <select
                                                                        value={editForm.class_id}
                                                                        onChange={(e) => setEditForm({...editForm, class_id: e.target.value})}
                                                                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                                                    >
                                                                        <option value="">-- Select Class --</option>
                                                                        {classes.map(c => (
                                                                            <option key={c.id} value={c.id}>Class {c.grade}-{c.section}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                                                                <select
                                                                    value={editForm.subject_id}
                                                                    onChange={(e) => setEditForm({...editForm, subject_id: e.target.value})}
                                                                    className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                                                >
                                                                    <option value="">-- Select Subject --</option>
                                                                    {subjects.map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Teacher selector - only for class view (principal or class teacher) */}
                                                            {timetableViewMode === 'class' && (
                                                                <div>
                                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Teacher</label>
                                                                    <select
                                                                        value={editForm.teacher_id}
                                                                        onChange={(e) => setEditForm({...editForm, teacher_id: e.target.value})}
                                                                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                                                    >
                                                                        <option value="">-- Select Teacher --</option>
                                                                        {teachers.map(t => (
                                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 pt-2">
                                                                <button
                                                                    onClick={handleSaveEntry}
                                                                    className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <Save size={12} /> Save
                                                                </button>
                                                                {entry && (
                                                                    <button
                                                                        onClick={handleClearEntry}
                                                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setEditingCell(null)}
                                                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : entry?.subject_name ? (
                                                /* Display assigned entry */
                                                <>
                                                    <div className="text-sm font-bold text-primary-600 dark:text-primary-400">{entry.subject_name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {timetableViewMode === 'teacher' 
                                                            ? (entry.class_name ? `Class ${entry.class_name}` : 'No Class')
                                                            : (entry.teacher_name || 'No Teacher')}
                                                    </div>
                                                    {canEdit && (
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                                            <Edit2 size={10} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                /* Empty slot */
                                                <>
                                                    <div className="text-sm font-bold text-slate-400 dark:text-slate-500">-</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500">
                                                        {canEdit 
                                                            ? (timetableViewMode === 'teacher' ? 'Click to add' : 'Click to assign') 
                                                            : (timetableViewMode === 'teacher' ? 'Free' : 'Not Assigned')}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Configuration Section Component
const ConfigurationSection = ({
    configError, configSuccess, allDays, workingDays, toggleWorkingDay, handleUpdateWorkingDays,
    showAddSlot, setShowAddSlot, resetConfirm, setResetConfirm, handleResetConfig,
    newSlot, setNewSlot, handleAddSlot, configLoading, allSlots, getPeriodTypeStyle,
    editingSlot, setEditingSlot, deleteConfirm, setDeleteConfirm, handleDeleteSlot, handleUpdateSlot
}) => {
    return (
        <div className="space-y-6">
            {/* Messages */}
            {configError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {configError}
                </div>
            )}
            {configSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-600 dark:text-green-400 text-sm">
                    {configSuccess}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Working Days Configuration */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-primary-500" />
                        Working Days
                    </h2>
                    <div className="space-y-2 mb-4">
                        {allDays.map(day => (
                            <label key={day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={workingDays.includes(day)}
                                    onChange={() => toggleWorkingDay(day)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{day}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handleUpdateWorkingDays}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Save Working Days
                    </button>
                </div>

                {/* Time Slots Configuration */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock size={20} className="text-primary-500" />
                            Time Slots & Periods
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddSlot(!showAddSlot)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Slot
                            </button>
                            {resetConfirm ? (
                                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30">
                                    <AlertTriangle size={16} className="text-red-500" />
                                    <span className="text-xs text-red-600 dark:text-red-400">Reset all?</span>
                                    <button
                                        onClick={handleResetConfig}
                                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setResetConfirm(false)}
                                        className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setResetConfirm(true)}
                                    className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw size={16} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Add New Slot Form */}
                    {showAddSlot && (
                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add New Time Slot</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Slot #</label>
                                    <input
                                        type="number"
                                        placeholder="1"
                                        value={newSlot.slot_number}
                                        onChange={(e) => setNewSlot({ ...newSlot, slot_number: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Period 1"
                                        value={newSlot.name}
                                        onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.start_time}
                                        onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.end_time}
                                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                                    <select
                                        value={newSlot.period_type}
                                        onChange={(e) => setNewSlot({ ...newSlot, period_type: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="break">Break</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="assembly">Assembly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setShowAddSlot(false)}
                                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSlot}
                                    className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                >
                                    Add Slot
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Time Slots List */}
                    {configLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading configuration...</div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {allSlots.map((slot) => {
                                const style = getPeriodTypeStyle(slot.period_type);
                                const IconComponent = style.icon;
                                const isEditing = editingSlot === slot.slot_number;
                                const isDeleting = deleteConfirm === slot.slot_number;

                                return (
                                    <div
                                        key={slot.slot_number}
                                        className={`p-3 rounded-xl border ${style.color} transition-all`}
                                    >
                                        {isEditing ? (
                                            <EditSlotForm
                                                slot={slot}
                                                onSave={(updates) => handleUpdateSlot(slot.slot_number, updates)}
                                                onCancel={() => setEditingSlot(null)}
                                            />
                                        ) : isDeleting ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle size={20} className="text-red-500" />
                                                    <span className="text-sm text-red-600 dark:text-red-400">Delete "{slot.name}"?</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.slot_number)}
                                                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                                    >
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                                        <IconComponent size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-400">#{slot.slot_number}</span>
                                                            <span className="font-semibold text-slate-900 dark:text-white">{slot.name}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 capitalize">
                                                                {slot.period_type}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingSlot(slot.slot_number)}
                                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(slot.slot_number)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Edit Slot Form Component
const EditSlotForm = ({ slot, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: slot.name,
        start_time: slot.start_time,
        end_time: slot.end_time,
        period_type: slot.period_type
    });

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
                <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
                <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                    <option value="regular">Regular</option>
                    <option value="break">Break</option>
                    <option value="lunch">Lunch</option>
                    <option value="assembly">Assembly</option>
                </select>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => onSave(formData)}
                    className="flex-1 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                    <Save size={16} className="mx-auto" />
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg"
                >
                    <X size={16} className="mx-auto" />
                </button>
            </div>
        </div>
    );
};

export default Timetable;
