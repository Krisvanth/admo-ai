import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Plus, Edit2, Trash2, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { classService, subjectService, teacherService } from '@/services/api';

const SchoolManagement = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'PRINCIPAL';

    // Tab state
    const [activeTab, setActiveTab] = useState('classes');

    // Data state
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [showAddClass, setShowAddClass] = useState(false);
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newClass, setNewClass] = useState({ grade: '', section: '', class_teacher_id: null });
    const [newSubject, setNewSubject] = useState({ name: '', code: '' });

    // Edit state
    const [editingClass, setEditingClass] = useState(null);
    const [editingSubject, setEditingSubject] = useState(null);

    // Delete confirmation state
    const [deleteClassConfirm, setDeleteClassConfirm] = useState(null);
    const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState(null);

    // Fetch data on load
    useEffect(() => {
        if (user && isPrincipal) {
            fetchData();
        } else if (user && !isPrincipal) {
            setLoading(false);
        }
    }, [user, isPrincipal]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classesData, subjectsData, teachersData] = await Promise.all([
                classService.getClasses(),
                subjectService.getSubjects(),
                teacherService.getTeachers()
            ]);
            setClasses(classesData);
            setSubjects(subjectsData);
            setTeachers(teachersData);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Class handlers
    const handleAddClass = async () => {
        if (!newClass.grade || !newClass.section) {
            setError('Please enter grade and section');
            return;
        }
        setError('');
        try {
            await classService.createClass(newClass);
            await fetchData();
            setNewClass({ grade: '', section: '', class_teacher_id: null });
            setShowAddClass(false);
            setSuccess('Class added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add class');
        }
    };

    const handleUpdateClass = async (classId, updates) => {
        setError('');
        try {
            await classService.updateClass(classId, updates);
            await fetchData();
            setEditingClass(null);
            setSuccess('Class updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update class');
        }
    };

    const handleDeleteClass = async (classId) => {
        setError('');
        try {
            await classService.deleteClass(classId);
            await fetchData();
            setDeleteClassConfirm(null);
            setSuccess('Class deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete class');
            setDeleteClassConfirm(null);
        }
    };

    // Subject handlers
    const handleAddSubject = async () => {
        if (!newSubject.name) {
            setError('Please enter subject name');
            return;
        }
        setError('');
        try {
            await subjectService.createSubject(newSubject);
            await fetchData();
            setNewSubject({ name: '', code: '' });
            setShowAddSubject(false);
            setSuccess('Subject added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add subject');
        }
    };

    const handleUpdateSubject = async (subjectId, updates) => {
        setError('');
        try {
            await subjectService.updateSubject(subjectId, updates);
            await fetchData();
            setEditingSubject(null);
            setSuccess('Subject updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update subject');
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        setError('');
        try {
            await subjectService.deleteSubject(subjectId);
            await fetchData();
            setDeleteSubjectConfirm(null);
            setSuccess('Subject deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete subject');
            setDeleteSubjectConfirm(null);
        }
    };

    // Access control - only principals can access this page
    // Wait for user to load before showing access restricted
    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isPrincipal) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <GraduationCap size={48} className="mx-auto mb-4 text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-500 dark:text-slate-400">Only principals can access School Management.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage classes, subjects, and assign class teachers.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('classes')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'classes' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <GraduationCap size={16} /> Classes
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'subjects' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <BookOpen size={16} /> Subjects
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-600 dark:text-green-400 text-sm">
                    {success}
                </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <GraduationCap size={20} className="text-primary-500" />
                            Classes & Class Teachers
                        </h2>
                        <button
                            onClick={() => setShowAddClass(!showAddClass)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Class
                        </button>
                    </div>

                    {/* Add Class Form */}
                    {showAddClass && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add New Class</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Grade</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 10"
                                        value={newClass.grade}
                                        onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., A"
                                        value={newClass.section}
                                        onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Class Teacher</label>
                                    <select
                                        value={newClass.class_teacher_id || ''}
                                        onChange={(e) => setNewClass({ ...newClass, class_teacher_id: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={handleAddClass}
                                        className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => { setShowAddClass(false); setNewClass({ grade: '', section: '', class_teacher_id: null }); }}
                                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Classes List */}
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading classes...</div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No classes created yet</p>
                            <p className="text-xs mt-2">Click "Add Class" to create your first class</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.map((cls) => {
                                const isEditing = editingClass === cls.id;
                                const isDeleting = deleteClassConfirm === cls.id;

                                return (
                                    <div key={cls.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {isDeleting ? (
                                            <div className="flex flex-col items-center gap-3 py-4">
                                                <AlertTriangle size={24} className="text-red-500" />
                                                <span className="text-sm text-red-600 dark:text-red-400">Delete Class {cls.grade}-{cls.section}?</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteClass(cls.id)}
                                                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                                    >
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteClassConfirm(null)}
                                                        className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isEditing ? (
                                            <EditClassForm
                                                cls={cls}
                                                teachers={teachers}
                                                onSave={(updates) => handleUpdateClass(cls.id, updates)}
                                                onCancel={() => setEditingClass(null)}
                                            />
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                                            Class {cls.grade}-{cls.section}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEditingClass(cls.id)}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteClassConfirm(cls.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Users size={14} />
                                                    <span>
                                                        {cls.class_teacher_name ? (
                                                            <span className="text-primary-600 dark:text-primary-400">{cls.class_teacher_name}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No class teacher assigned</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen size={20} className="text-primary-500" />
                            Subjects
                        </h2>
                        <button
                            onClick={() => setShowAddSubject(!showAddSubject)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Subject
                        </button>
                    </div>

                    {/* Add Subject Form */}
                    {showAddSubject && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add New Subject</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Mathematics"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject Code (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., MATH101"
                                        value={newSubject.code}
                                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={handleAddSubject}
                                        className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => { setShowAddSubject(false); setNewSubject({ name: '', code: '' }); }}
                                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subjects List */}
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading subjects...</div>
                    ) : subjects.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No subjects created yet</p>
                            <p className="text-xs mt-2">Click "Add Subject" to create your first subject</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {subjects.map((subject) => {
                                const isEditing = editingSubject === subject.id;
                                const isDeleting = deleteSubjectConfirm === subject.id;

                                return (
                                    <div key={subject.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {isDeleting ? (
                                            <div className="flex flex-col items-center gap-3 py-2">
                                                <AlertTriangle size={20} className="text-red-500" />
                                                <span className="text-xs text-red-600 dark:text-red-400">Delete "{subject.name}"?</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteSubject(subject.id)}
                                                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteSubjectConfirm(null)}
                                                        className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isEditing ? (
                                            <EditSubjectForm
                                                subject={subject}
                                                onSave={(updates) => handleUpdateSubject(subject.id, updates)}
                                                onCancel={() => setEditingSubject(null)}
                                            />
                                        ) : (
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white">{subject.name}</h3>
                                                    {subject.code && (
                                                        <span className="text-xs text-slate-500">{subject.code}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingSubject(subject.id)}
                                                        className="p-1 text-slate-400 hover:text-primary-600 rounded transition-colors"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteSubjectConfirm(subject.id)}
                                                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                    >
                                                        <Trash2 size={12} />
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
            )}
        </div>
    );
};

// Edit Class Form Component
const EditClassForm = ({ cls, teachers, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        grade: cls.grade,
        section: cls.section,
        class_teacher_id: cls.class_teacher_id
    });

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Grade</label>
                    <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Section</label>
                    <input
                        type="text"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Class Teacher</label>
                <select
                    value={formData.class_teacher_id || ''}
                    onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => onSave(formData)}
                    className="flex-1 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm"
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// Edit Subject Form Component
const EditSubjectForm = ({ subject, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: subject.name,
        code: subject.code || ''
    });

    return (
        <div className="space-y-2">
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
            </div>
            <div className="flex gap-1 pt-1">
                <button
                    onClick={() => onSave(formData)}
                    className="flex-1 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs"
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default SchoolManagement;
