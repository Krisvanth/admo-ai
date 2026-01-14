import React, { useState, useEffect } from 'react';
import {
    Plus, Calendar, Edit2, Trash2, Eye, CheckCircle, AlertCircle,
    Clock, Users, BookOpen, FileText, Loader2, ChevronRight, X,
    CalendarDays, ClipboardCheck, Archive, Sparkles, RefreshCw,
    Save, UserCheck, UserX, BarChart3, ChevronDown, ChevronUp, Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { examService, classService, subjectService, marksService } from '@/services/api';

const ExamAssessment = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'PRINCIPAL';

    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterClass, setFilterClass] = useState(null);

    // Form states - New workflow: select subjects upfront
    const [examForm, setExamForm] = useState({
        name: '',
        class_id: '',
        start_date: '',
        end_date: '',
        pass_percentage: 35,
        subject_ids: [],
        default_start_time: '09:00',
        default_duration_minutes: 120,
        default_max_marks: 100
    });

    const [timetableEntries, setTimetableEntries] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    // Marks Entry States
    const [viewMode, setViewMode] = useState('schedule'); // 'schedule' | 'marks'
    const [marksSummary, setMarksSummary] = useState([]);
    const [selectedSubjectEntry, setSelectedSubjectEntry] = useState(null);
    const [marksData, setMarksData] = useState(null);
    const [marksLoading, setMarksLoading] = useState(false);
    const [savingMarks, setSavingMarks] = useState(false);
    const [showPublishMarksConfirm, setShowPublishMarksConfirm] = useState(false);
    const [examAnalytics, setExamAnalytics] = useState(null);

    useEffect(() => {
        fetchData();
    }, [filterStatus, filterClass]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [examsData, classesData, subjectsData] = await Promise.all([
                examService.getExams(filterClass, filterStatus !== 'all' ? filterStatus : null),
                classService.getClasses(),
                subjectService.getSubjects()
            ]);
            setExams(examsData);
            setClasses(classesData);
            setSubjects(subjectsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subjectId) => {
        const current = examForm.subject_ids;
        if (current.includes(subjectId)) {
            setExamForm({ ...examForm, subject_ids: current.filter(id => id !== subjectId) });
        } else {
            setExamForm({ ...examForm, subject_ids: [...current, subjectId] });
        }
    };

    const handleCreateExam = async () => {
        try {
            setSubmitting(true);
            setErrors({});

            // Validate
            const newErrors = {};
            if (!examForm.name) newErrors.name = 'Exam name is required';
            if (!examForm.class_id) newErrors.class_id = 'Please select a class';
            if (!examForm.start_date) newErrors.start_date = 'Start date is required';
            if (!examForm.end_date) newErrors.end_date = 'End date is required';
            if (examForm.subject_ids.length === 0) newErrors.subjects = 'Please select at least one subject';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            // Create exam - backend will auto-generate schedule
            const createdExam = await examService.createExam({
                name: examForm.name,
                class_id: parseInt(examForm.class_id),
                start_date: examForm.start_date,
                end_date: examForm.end_date,
                pass_percentage: examForm.pass_percentage,
                subject_ids: examForm.subject_ids,
                default_start_time: examForm.default_start_time,
                default_duration_minutes: examForm.default_duration_minutes,
                default_max_marks: examForm.default_max_marks
            });

            // Load the generated timetable
            const timetable = await examService.getExamTimetable(createdExam.id);

            setSelectedExam(createdExam);
            setTimetableEntries(timetable);
            setShowCreateModal(false);
            setShowViewModal(true);
            await fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to create exam';
            setErrors({ submit: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateEntry = async (entryId, updatedData) => {
        try {
            await examService.updateTimetableEntry(selectedExam.id, entryId, updatedData);
            const timetable = await examService.getExamTimetable(selectedExam.id);
            setTimetableEntries(timetable);
            setEditingEntry(null);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update entry');
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm('Are you sure you want to remove this subject?')) return;

        try {
            await examService.deleteTimetableEntry(selectedExam.id, entryId);
            setTimetableEntries(timetableEntries.filter(e => e.id !== entryId));

            // Refresh exam data
            const updatedExam = await examService.getExam(selectedExam.id);
            setSelectedExam(updatedExam);
        } catch (err) {
            alert('Failed to remove subject');
        }
    };

    const handlePublishExam = async () => {
        try {
            await examService.publishExam(selectedExam.id);
            const updatedExam = await examService.getExam(selectedExam.id);
            setSelectedExam(updatedExam);
            setShowPublishConfirm(false);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to publish exam');
            setShowPublishConfirm(false);
        }
    };

    const handleUnpublishExam = async () => {
        if (!window.confirm('Unpublish this exam? Teachers will be able to edit it again.')) return;

        try {
            await examService.unpublishExam(selectedExam.id);
            const updatedExam = await examService.getExam(selectedExam.id);
            setSelectedExam(updatedExam);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to unpublish exam');
        }
    };

    const handleDeleteExam = async (examId) => {
        if (!window.confirm('Delete this exam permanently? This action cannot be undone.')) return;

        try {
            await examService.deleteExam(examId);
            if (selectedExam?.id === examId) {
                setShowViewModal(false);
                setSelectedExam(null);
            }
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete exam');
        }
    };

    const viewExam = async (exam) => {
        try {
            const [examData, timetable] = await Promise.all([
                examService.getExam(exam.id),
                examService.getExamTimetable(exam.id)
            ]);
            setSelectedExam(examData);
            setTimetableEntries(timetable);
            setViewMode('schedule'); // Reset to schedule view
            setSelectedSubjectEntry(null);
            setMarksData(null);
            setExamAnalytics(null);

            // Load marks summary for published exams
            if (examData.status === 'Published') {
                loadMarksSummary(examData.id);
                loadExamAnalytics(examData.id);
            }

            setShowViewModal(true);
        } catch (err) {
            alert('Failed to load exam details');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Draft') {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">Draft</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
            <CheckCircle size={12} /> Published
        </span>;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // === MARKS ENTRY FUNCTIONS ===

    const loadMarksSummary = async (examId) => {
        try {
            setMarksLoading(true);
            const summary = await examService.getMarksSummary(examId);
            setMarksSummary(summary);
        } catch (err) {
            console.error('Failed to load marks summary:', err);
            setMarksSummary([]);
        } finally {
            setMarksLoading(false);
        }
    };

    const loadMarksForSubject = async (examId, entryId) => {
        try {
            setMarksLoading(true);
            const data = await examService.getMarksForEntry(examId, entryId);
            setMarksData(data);
            setSelectedSubjectEntry(entryId);
        } catch (err) {
            console.error('Failed to load marks:', err);
            alert(err.response?.data?.detail || 'Failed to load marks');
        } finally {
            setMarksLoading(false);
        }
    };

    const handleMarksChange = (studentId, field, value) => {
        if (!marksData) return;

        setMarksData({
            ...marksData,
            marks: marksData.marks.map(mark => {
                if (mark.student_id === studentId) {
                    if (field === 'is_absent' && value) {
                        return { ...mark, is_absent: true, marks_obtained: null };
                    }
                    return { ...mark, [field]: value };
                }
                return mark;
            })
        });
    };

    const handleSaveMarks = async () => {
        if (!marksData || !selectedExam) return;

        try {
            setSavingMarks(true);

            // Prepare bulk data
            const bulkData = {
                exam_id: selectedExam.id,
                exam_timetable_entry_id: selectedSubjectEntry,
                marks: marksData.marks.map(m => ({
                    student_id: m.student_id,
                    marks_obtained: m.marks_obtained,
                    is_absent: m.is_absent,
                    remarks: m.remarks || null
                }))
            };

            const result = await marksService.bulkSaveMarks(bulkData);

            // Refresh data
            await loadMarksForSubject(selectedExam.id, selectedSubjectEntry);
            await loadMarksSummary(selectedExam.id);

            if (result.errors && result.errors.length > 0) {
                alert(`Saved with warnings:\n${result.errors.join('\n')}`);
            }
        } catch (err) {
            console.error('Failed to save marks:', err);
            alert(err.response?.data?.detail || 'Failed to save marks');
        } finally {
            setSavingMarks(false);
        }
    };

    const handlePublishMarks = async () => {
        if (!selectedExam || !selectedSubjectEntry) return;

        try {
            setSavingMarks(true);
            await marksService.publishMarks(selectedExam.id, selectedSubjectEntry);

            // Refresh data
            await loadMarksForSubject(selectedExam.id, selectedSubjectEntry);
            await loadMarksSummary(selectedExam.id);
            setShowPublishMarksConfirm(false);
        } catch (err) {
            console.error('Failed to publish marks:', err);
            alert(err.response?.data?.detail || 'Failed to publish marks');
        } finally {
            setSavingMarks(false);
        }
    };

    const handleUnpublishMarks = async () => {
        if (!selectedExam || !selectedSubjectEntry) return;
        if (!window.confirm('Unpublish marks? They will become editable again.')) return;

        try {
            setSavingMarks(true);
            await marksService.unpublishMarks(selectedExam.id, selectedSubjectEntry);

            // Refresh data
            await loadMarksForSubject(selectedExam.id, selectedSubjectEntry);
            await loadMarksSummary(selectedExam.id);
        } catch (err) {
            console.error('Failed to unpublish marks:', err);
            alert(err.response?.data?.detail || 'Failed to unpublish marks');
        } finally {
            setSavingMarks(false);
        }
    };

    const loadExamAnalytics = async (examId) => {
        try {
            const analytics = await examService.getExamAnalytics(examId);
            setExamAnalytics(analytics);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    };

    const getMarksStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
            'In Progress': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            'Completed': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            'Published': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles['Pending']}`}>
                {status}
            </span>
        );
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exams & Marks</h1>
                    <p className="text-slate-500 dark:text-slate-400">Create exams and manage student marks</p>
                </div>
                <button
                    onClick={() => {
                        setExamForm({
                            name: '',
                            class_id: '',
                            start_date: '',
                            end_date: '',
                            pass_percentage: 35,
                            subject_ids: [],
                            default_start_time: '09:00',
                            default_duration_minutes: 120,
                            default_max_marks: 100
                        });
                        setErrors({});
                        setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20"
                >
                    <Sparkles size={20} />
                    Create Exam
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none text-slate-900 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="Draft">Draft Only</option>
                    <option value="Published">Published Only</option>
                </select>

                <select
                    value={filterClass || ''}
                    onChange={(e) => setFilterClass(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none text-slate-900 dark:text-white"
                >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.grade}-{cls.section}
                        </option>
                    ))}
                </select>
            </div>

            {/* Exams List */}
            {exams.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Exams Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {filterStatus !== 'all' || filterClass ? 'Try adjusting your filters' : 'Create your first exam to get started'}
                    </p>
                    {!filterClass && filterStatus === 'all' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Create Exam
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                        <div
                            key={exam.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-6 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{exam.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{exam.class_name}</p>
                                </div>
                                {getStatusBadge(exam.status)}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <CalendarDays size={16} className="text-slate-400" />
                                    <span>{exam.start_date} to {exam.end_date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <BookOpen size={16} className="text-slate-400" />
                                    <span>{exam.subject_count} subject{exam.subject_count !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Users size={16} className="text-slate-400" />
                                    <span>By {exam.created_by_name}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => viewExam(exam)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Eye size={16} />
                                    {exam.status === 'Draft' ? 'Review & Edit' : 'View'}
                                </button>
                                {exam.status === 'Draft' && (
                                    <button
                                        onClick={() => handleDeleteExam(exam.id)}
                                        className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Exam Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            <div className="overflow-y-auto max-h-[90vh] p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Exam</h3>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Error Message */}
                                {errors.submit && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                        {errors.submit}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Basic Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Exam Name *</label>
                                                <input
                                                    type="text"
                                                    value={examForm.name}
                                                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                                                    placeholder="e.g., Mid-Term Exam, Unit Test 1"
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Class *</label>
                                                <select
                                                    value={examForm.class_id}
                                                    onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.filter(c => c.can_edit).map(cls => (
                                                        <option key={cls.id} value={cls.id}>Class {cls.grade}-{cls.section}</option>
                                                    ))}
                                                </select>
                                                {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Max Marks (per subject)</label>
                                                <input
                                                    type="number"
                                                    value={examForm.default_max_marks}
                                                    onChange={(e) => setExamForm({ ...examForm, default_max_marks: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Pass Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={examForm.pass_percentage}
                                                    onChange={(e) => setExamForm({ ...examForm, pass_percentage: parseInt(e.target.value) || 35 })}
                                                    placeholder="35"
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Minimum % to pass (default: 35%)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Exam Schedule</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Start Date *</label>
                                                <input
                                                    type="date"
                                                    value={examForm.start_date}
                                                    onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                                {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">End Date *</label>
                                                <input
                                                    type="date"
                                                    value={examForm.end_date}
                                                    onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                                {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Default Start Time</label>
                                                <input
                                                    type="time"
                                                    value={examForm.default_start_time}
                                                    onChange={(e) => setExamForm({ ...examForm, default_start_time: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Duration</label>
                                                <select
                                                    value={examForm.default_duration_minutes}
                                                    onChange={(e) => setExamForm({ ...examForm, default_duration_minutes: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                >
                                                    <option value={60}>1 hour</option>
                                                    <option value={90}>1.5 hours</option>
                                                    <option value={120}>2 hours</option>
                                                    <option value={150}>2.5 hours</option>
                                                    <option value={180}>3 hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject Selection */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                            Select Subjects *
                                            <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs">
                                                {examForm.subject_ids.length} selected
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            {subjects.map(subject => (
                                                <button
                                                    key={subject.id}
                                                    type="button"
                                                    onClick={() => toggleSubject(subject.id)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${examForm.subject_ids.includes(subject.id)
                                                        ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                >
                                                    {examForm.subject_ids.includes(subject.id) && (
                                                        <CheckCircle size={14} className="inline mr-1" />
                                                    )}
                                                    {subject.name}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.subjects && <p className="text-xs text-red-500 mt-1">{errors.subjects}</p>}
                                    </div>

                                    {/* Info Note */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            <Sparkles size={14} className="inline mr-1 text-primary-500" />
                                            The exam schedule will be automatically generated based on your date range. You can review and edit it after creation.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateExam}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={16} />
                                                    Create Exam
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Exam Modal */}
            {showViewModal && selectedExam && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => {
                            setShowViewModal(false);
                            setSelectedExam(null);
                            setTimetableEntries([]);
                            setEditingEntry(null);
                        }}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-8">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedExam.name}</h2>
                                            {getStatusBadge(selectedExam.status)}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={16} />
                                                {selectedExam.class_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CalendarDays size={16} />
                                                {selectedExam.start_date} to {selectedExam.end_date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClipboardCheck size={16} />
                                                {selectedExam.subject_count} subjects
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            setSelectedExam(null);
                                            setTimetableEntries([]);
                                            setEditingEntry(null);
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-4">
                                    {selectedExam.status === 'Draft' && (
                                        <>
                                            <button
                                                onClick={() => setShowPublishConfirm(true)}
                                                disabled={selectedExam.subject_count === 0}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <CheckCircle size={16} />
                                                Publish Exam
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExam(selectedExam.id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {selectedExam.status === 'Published' && isPrincipal && (
                                        <button
                                            onClick={handleUnpublishExam}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Archive size={16} />
                                            Unpublish
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {/* Tab Navigation for Published Exams */}
                                {selectedExam.status === 'Published' && (
                                    <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                                        <button
                                            onClick={() => {
                                                setViewMode('schedule');
                                                setSelectedSubjectEntry(null);
                                                setMarksData(null);
                                            }}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${viewMode === 'schedule'
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <CalendarDays size={18} />
                                            Schedule
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('marks');
                                                setSelectedSubjectEntry(null);
                                                setMarksData(null);
                                            }}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${viewMode === 'marks'
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <ClipboardCheck size={18} />
                                            Marks Entry
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewMode('analytics');
                                                loadExamAnalytics(selectedExam.id);
                                            }}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${viewMode === 'analytics'
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <BarChart3 size={18} />
                                            Analytics
                                        </button>
                                    </div>
                                )}

                                {/* Schedule View (Draft exams or Schedule tab) */}
                                {(selectedExam.status === 'Draft' || viewMode === 'schedule') && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-slate-900 dark:text-white">
                                                {selectedExam.status === 'Draft' ? 'Review & Edit Schedule' : 'Exam Schedule'}
                                            </h3>
                                            {selectedExam.status === 'Draft' && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Click on any field to edit
                                                </p>
                                            )}
                                        </div>

                                        {timetableEntries.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-500 dark:text-slate-400">No subjects in this exam.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {timetableEntries.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)).map(entry => (
                                                    <div
                                                        key={entry.id}
                                                        className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                                                    >
                                                        {editingEntry === entry.id ? (
                                                            /* Editing Mode */
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-bold text-slate-900 dark:text-white">{entry.subject_name}</h4>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => setEditingEntry(null)}
                                                                            className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
                                                                        <input
                                                                            type="date"
                                                                            id={`date-${entry.id}`}
                                                                            defaultValue={entry.exam_date}
                                                                            min={selectedExam.start_date}
                                                                            max={selectedExam.end_date}
                                                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                                                                        <input
                                                                            type="time"
                                                                            id={`start-${entry.id}`}
                                                                            defaultValue={entry.start_time}
                                                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                                                                        <input
                                                                            type="time"
                                                                            id={`end-${entry.id}`}
                                                                            defaultValue={entry.end_time}
                                                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Marks</label>
                                                                        <input
                                                                            type="number"
                                                                            id={`marks-${entry.id}`}
                                                                            defaultValue={entry.max_marks}
                                                                            min="1"
                                                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const dateEl = document.getElementById(`date-${entry.id}`);
                                                                        const startEl = document.getElementById(`start-${entry.id}`);
                                                                        const endEl = document.getElementById(`end-${entry.id}`);
                                                                        const marksEl = document.getElementById(`marks-${entry.id}`);
                                                                        handleUpdateEntry(entry.id, {
                                                                            exam_date: dateEl.value,
                                                                            start_time: startEl.value,
                                                                            end_time: endEl.value,
                                                                            max_marks: parseFloat(marksEl.value)
                                                                        });
                                                                    }}
                                                                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Save Changes
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* View Mode */
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-6 flex-1">
                                                                    <div className="min-w-[140px]">
                                                                        <p className="font-bold text-slate-900 dark:text-white">{entry.subject_name}</p>
                                                                        {entry.subject_code && (
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{entry.subject_code}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                        <CalendarDays size={16} className="text-slate-400" />
                                                                        <span className="text-sm font-medium">{formatDate(entry.exam_date)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                        <Clock size={16} className="text-slate-400" />
                                                                        <span className="text-sm">{entry.start_time} - {entry.end_time}</span>
                                                                    </div>
                                                                    <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-bold">
                                                                        {entry.max_marks} marks
                                                                    </div>
                                                                </div>
                                                                {selectedExam.status === 'Draft' && (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => setEditingEntry(entry.id)}
                                                                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit2 size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedExam.status === 'Draft' && timetableEntries.length > 0 && (
                                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                                <div className="flex gap-3">
                                                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Review Before Publishing</p>
                                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                            Once published, the schedule cannot be edited. Make sure all dates and marks are correct.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Marks Entry View */}
                                {selectedExam.status === 'Published' && viewMode === 'marks' && (
                                    <div className="space-y-4">
                                        {!selectedSubjectEntry ? (
                                            /* Subject List View */
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Select Subject to Enter Marks</h3>
                                                    <button
                                                        onClick={() => loadMarksSummary(selectedExam.id)}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Refresh"
                                                    >
                                                        <RefreshCw size={18} className={`text-slate-500 ${marksLoading ? 'animate-spin' : ''}`} />
                                                    </button>
                                                </div>

                                                {marksLoading && marksSummary.length === 0 ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                                    </div>
                                                ) : marksSummary.length === 0 ? (
                                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                        <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                                        <p className="text-slate-500 dark:text-slate-400">No subjects available for marks entry.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {marksSummary.map(subject => (
                                                            <div
                                                                key={subject.exam_timetable_entry_id}
                                                                onClick={() => loadMarksForSubject(selectedExam.id, subject.exam_timetable_entry_id)}
                                                                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                                            <BookOpen size={20} className="text-primary-600 dark:text-primary-400" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-slate-900 dark:text-white">{subject.subject_name}</h4>
                                                                            <p className="text-sm text-slate-500 dark:text-slate-400">Max: {subject.max_marks} marks</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{subject.marks_entered}/{subject.total_students} entered</p>
                                                                            {getMarksStatusBadge(subject.status)}
                                                                        </div>
                                                                        <ChevronRight size={20} className="text-slate-400" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* Marks Entry Table View */
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubjectEntry(null);
                                                                setMarksData(null);
                                                            }}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                        >
                                                            <ChevronDown size={18} className="text-slate-500 rotate-90" />
                                                        </button>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 dark:text-white">{marksData?.subject_name}</h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {marksData?.class_name} • Max: {marksData?.max_marks} marks • {marksData?.marks_entered}/{marksData?.total_students} entered
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveMarks}
                                                            disabled={savingMarks}
                                                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {savingMarks ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                            Save Draft
                                                        </button>
                                                        {marksData?.status !== 'Published' && (
                                                            <button
                                                                onClick={() => setShowPublishMarksConfirm(true)}
                                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                <CheckCircle size={16} />
                                                                Publish
                                                            </button>
                                                        )}
                                                        {marksData?.status === 'Published' && isPrincipal && (
                                                            <button
                                                                onClick={handleUnpublishMarks}
                                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                <Archive size={16} />
                                                                Unpublish
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {marksLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                                    </div>
                                                ) : marksData && (
                                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="bg-slate-100 dark:bg-slate-700">
                                                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Sr.</th>
                                                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Adm. No</th>
                                                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Student Name</th>
                                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Marks</th>
                                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Absent</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                                {marksData.marks.map((mark, index) => (
                                                                    <tr key={mark.student_id} className="hover:bg-slate-100/50 dark:hover:bg-slate-700/50">
                                                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{index + 1}</td>
                                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{mark.student_admission_number}</td>
                                                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{mark.student_name}</td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center justify-center">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max={marksData.max_marks}
                                                                                    value={mark.marks_obtained ?? ''}
                                                                                    onChange={(e) => handleMarksChange(mark.student_id, 'marks_obtained', e.target.value ? parseFloat(e.target.value) : null)}
                                                                                    disabled={mark.is_absent}
                                                                                    className={`w-20 px-3 py-1.5 text-center border rounded-lg text-sm outline-none transition-colors ${mark.is_absent
                                                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                                                        : mark.marks_obtained !== null && mark.marks_obtained > marksData.max_marks
                                                                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500'
                                                                                        } text-slate-900 dark:text-white`}
                                                                                    placeholder="-"
                                                                                />
                                                                                <span className="ml-2 text-xs text-slate-400">/{marksData.max_marks}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center justify-center">
                                                                                <button
                                                                                    onClick={() => handleMarksChange(mark.student_id, 'is_absent', !mark.is_absent)}
                                                                                    className={`p-2 rounded-lg transition-colors ${mark.is_absent
                                                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'
                                                                                        }`}
                                                                                    title={mark.is_absent ? 'Mark as Present' : 'Mark as Absent'}
                                                                                >
                                                                                    {mark.is_absent ? <UserX size={18} /> : <UserCheck size={18} />}
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Analytics View */}
                                {selectedExam.status === 'Published' && viewMode === 'analytics' && (
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Exam Analytics</h3>

                                        {!examAnalytics ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                            </div>
                                        ) : examAnalytics.subject_wise.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-500 dark:text-slate-400">No marks data available for analytics.</p>
                                                <p className="text-sm text-slate-400 mt-1">Enter marks for at least one subject to see analytics.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Overall Stats */}
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
                                                        <p className="text-sm opacity-80">Overall Average</p>
                                                        <p className="text-3xl font-bold">{examAnalytics.overall_average_percentage}%</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                                                        <p className="text-sm opacity-80">Students Appeared</p>
                                                        <p className="text-3xl font-bold">{examAnalytics.total_students_appeared}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                                                        <p className="text-sm opacity-80">Subjects</p>
                                                        <p className="text-3xl font-bold">{examAnalytics.total_subjects}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                                                        <p className="text-sm opacity-80">Pass Threshold</p>
                                                        <p className="text-3xl font-bold">{selectedExam.pass_percentage}%</p>
                                                    </div>
                                                </div>

                                                {/* Subject-wise Analytics */}
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-slate-100 dark:bg-slate-700">
                                                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</th>
                                                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Average</th>
                                                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Highest</th>
                                                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Lowest</th>
                                                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Pass %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                            {examAnalytics.subject_wise.map(subject => (
                                                                <tr key={subject.subject_id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-medium text-slate-900 dark:text-white">{subject.subject_name}</p>
                                                                        <p className="text-xs text-slate-500">Max: {subject.max_marks}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-bold">
                                                                            {subject.average}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold">{subject.highest}</td>
                                                                    <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-semibold">{subject.lowest}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px-2 py-1 rounded-lg text-sm font-bold ${subject.pass_percentage >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                                            subject.pass_percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                            }`}>
                                                                            {subject.pass_percentage}%
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Marks Confirmation Modal */}
            {showPublishMarksConfirm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setShowPublishMarksConfirm(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Publish Marks</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Are you sure you want to publish marks for <strong>{marksData?.subject_name}</strong>?
                                Published marks will be visible to students and parents.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPublishMarksConfirm(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublishMarks}
                                    disabled={savingMarks}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {savingMarks && <Loader2 size={16} className="animate-spin" />}
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 z-[60]">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setShowPublishConfirm(false)}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Publish Exam</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Are you sure you want to publish <strong>{selectedExam?.name}</strong>? Once published, the schedule cannot be edited.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPublishConfirm(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublishExam}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamAssessment;


