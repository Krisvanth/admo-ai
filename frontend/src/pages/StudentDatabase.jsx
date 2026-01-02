import React, { useState, useEffect } from 'react';
import { Search, Upload, Plus, Download, FileDown, MoreHorizontal, FileSpreadsheet, Edit2, Trash2, X, Eye, Users, AlertCircle, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { studentService, classService } from '@/services/api';

// Blood group options
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'Other', label: 'Other' }
];

const StudentDatabase = () => {
    const { user } = useAuth();
    const isPrincipal = user?.role === 'PRINCIPAL';

    // Data state
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Check if current user can edit the selected class
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const canEditSelectedClass = selectedClass?.can_edit ?? false;

    // Loading & Error states
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showViewModal, setShowViewModal] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        admission_number: '',
        name: '',
        date_of_birth: '',
        gender: 'M',
        class_id: '',
        roll_no: '',
        address: '',
        father_name: '',
        mother_name: '',
        father_occupation: '',
        mother_occupation: '',
        annual_income: '',
        contact_number: '',
        parent_email: '',
        blood_group: '',
        date_of_admission: new Date().toISOString().split('T')[0]
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses();
    }, []);

    // Fetch students when class, page, or search changes
    useEffect(() => {
        if (selectedClassId) {
            fetchStudents(selectedClassId, currentPage, searchQuery);
        } else {
            setStudents([]);
            setTotalStudents(0);
            setTotalPages(1);
        }
    }, [selectedClassId, currentPage]);

    // Debounced search - reset to page 1 and fetch
    useEffect(() => {
        if (selectedClassId) {
            const timer = setTimeout(() => {
                setCurrentPage(1);
                fetchStudents(selectedClassId, 1, searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    // Auto-clear success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchClasses = async () => {
        try {
            setLoadingClasses(true);
            const data = await classService.getClasses();
            setClasses(data);
            // Auto-select first class if available
            if (data.length > 0 && !selectedClassId) {
                setSelectedClassId(data[0].id);
            }
        } catch (err) {
            setError('Failed to load classes');
            console.error(err);
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchStudents = async (classId, page = 1, search = '') => {
        try {
            setLoadingStudents(true);
            setError('');
            const data = await studentService.getStudents(classId, true, page, pageSize, search || null);
            setStudents(data.items);
            setTotalStudents(data.total);
            setTotalPages(data.total_pages);
            setCurrentPage(data.page);
        } catch (err) {
            setError('Failed to load students');
            console.error(err);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Export students to CSV
    const handleExport = async () => {
        try {
            setExporting(true);
            await studentService.exportStudents(selectedClassId);
            setSuccessMessage('Students exported successfully!');
        } catch (err) {
            setError('Failed to export students');
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    // Handle class change - reset pagination
    const handleClassChange = (classId) => {
        setSelectedClassId(classId);
        setCurrentPage(1);
        setSearchQuery('');
    };

    // Form handlers
    const resetForm = () => {
        setFormData({
            admission_number: '',
            name: '',
            date_of_birth: '',
            gender: 'M',
            class_id: selectedClassId || '',
            roll_no: '',
            address: '',
            father_name: '',
            mother_name: '',
            father_occupation: '',
            mother_occupation: '',
            annual_income: '',
            contact_number: '',
            parent_email: '',
            blood_group: '',
            date_of_admission: new Date().toISOString().split('T')[0]
        });
        setFormError('');
    };

    const openAddModal = () => {
        resetForm();
        setFormData(prev => ({ ...prev, class_id: selectedClassId || '' }));
        setShowAddModal(true);
    };

    const openEditModal = (student) => {
        setFormData({
            admission_number: student.admission_number,
            name: student.name,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            class_id: student.class_id,
            roll_no: student.roll_no,
            address: student.address || '',
            father_name: student.father_name,
            mother_name: student.mother_name || '',
            father_occupation: student.father_occupation || '',
            mother_occupation: student.mother_occupation || '',
            annual_income: student.annual_income || '',
            contact_number: student.contact_number,
            parent_email: student.parent_email || '',
            blood_group: student.blood_group || '',
            date_of_admission: student.date_of_admission
        });
        setFormError('');
        setShowEditModal(student);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            // Prepare data
            const submitData = {
                ...formData,
                class_id: parseInt(formData.class_id),
                annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
                blood_group: formData.blood_group || null,
                address: formData.address || null,
                mother_name: formData.mother_name || null,
                father_occupation: formData.father_occupation || null,
                mother_occupation: formData.mother_occupation || null,
                parent_email: formData.parent_email || null,
                date_of_admission: formData.date_of_admission || null
            };

            await studentService.createStudent(submitData);
            setSuccessMessage('Student added successfully!');
            setShowAddModal(false);
            fetchStudents(selectedClassId);
            fetchClasses(); // Refresh student counts
        } catch (err) {
            setFormError(err.response?.data?.detail || 'Failed to add student');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            const submitData = {
                name: formData.name,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                class_id: parseInt(formData.class_id),
                roll_no: formData.roll_no,
                address: formData.address || null,
                father_name: formData.father_name,
                mother_name: formData.mother_name || null,
                father_occupation: formData.father_occupation || null,
                mother_occupation: formData.mother_occupation || null,
                annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
                contact_number: formData.contact_number,
                parent_email: formData.parent_email || null,
                blood_group: formData.blood_group || null
            };

            await studentService.updateStudent(showEditModal.id, submitData);
            setSuccessMessage('Student updated successfully!');
            setShowEditModal(null);
            fetchStudents(selectedClassId);
        } catch (err) {
            setFormError(err.response?.data?.detail || 'Failed to update student');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (studentId) => {
        try {
            await studentService.deleteStudent(studentId);
            setSuccessMessage('Student deleted successfully!');
            setShowDeleteConfirm(null);
            fetchStudents(selectedClassId);
            fetchClasses();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete student');
        }
    };

    // CSV handlers
    const handleDownloadTemplate = async () => {
        try {
            await studentService.downloadTemplate();
        } catch (err) {
            setError('Failed to download template');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            setUploadFile(file);
            setUploadResult(null);
        } else {
            setError('Please select a CSV file');
        }
    };

    const handleBulkUpload = async () => {
        if (!uploadFile) return;

        setUploading(true);
        setUploadResult(null);

        try {
            const result = await studentService.bulkUpload(uploadFile);
            setUploadResult(result);
            if (result.created_count > 0) {
                fetchStudents(selectedClassId);
                fetchClasses();
            }
        } catch (err) {
            setUploadResult({
                error: true,
                message: err.response?.data?.detail || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const closeUploadModal = () => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadResult(null);
    };

    // Get initials for avatar
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Database</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage student records and admissions</p>
                </div>
                <div className="flex gap-3">
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={!selectedClassId || exporting || students.length === 0}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                        Export CSV
                    </button>
                    {canEditSelectedClass && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Upload CSV
                        </button>
                    )}
                    {canEditSelectedClass && (
                        <button
                            onClick={openAddModal}
                            disabled={!selectedClassId}
                            className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={18} />
                            Add Student
                        </button>
                    )}
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    {/* Class Selector */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Users size={18} className="text-slate-500 dark:text-slate-400" />
                        <select
                            value={selectedClassId || ''}
                            onChange={(e) => handleClassChange(e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary-500/20 min-w-[160px]"
                            disabled={loadingClasses}
                        >
                            <option value="">Select a Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    Class {cls.grade}-{cls.section}
                                </option>
                            ))}
                        </select>
                        {selectedClassId && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                {totalStudents} student{totalStudents !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!selectedClassId}
                            />
                        </div>
                    </div>
                </div>

                {/* Table or Empty State */}
                {!selectedClassId ? (
                    <div className="px-6 py-16 text-center">
                        <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Select a class to view students</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Choose from the dropdown above</p>
                    </div>
                ) : loadingStudents ? (
                    <div className="px-6 py-16 text-center">
                        <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <FileSpreadsheet size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            {searchQuery ? 'No students match your search' : 'No students in this class'}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                            {searchQuery ? 'Try a different search term' : 'Add students using the button above'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Adm. No</th>
                                        <th className="px-6 py-4">Roll No</th>
                                        <th className="px-6 py-4">Father Name</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                                                        {getInitials(student.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'} • {formatDate(student.date_of_birth)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                                                    {student.roll_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{student.father_name}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{student.contact_number}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setShowViewModal(student)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {canEditSelectedClass && (
                                                        <button
                                                            onClick={() => openEditModal(student)}
                                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canEditSelectedClass && isPrincipal && (
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(student)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with Pagination */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <p>
                                Showing {students.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
                            </p>
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    
                                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Last
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <StudentFormModal
                    title="Add New Student"
                    formData={formData}
                    classes={classes}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmitAdd}
                    onClose={() => setShowAddModal(false)}
                    formError={formError}
                    submitting={submitting}
                    isEdit={false}
                />
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <StudentFormModal
                    title="Edit Student"
                    formData={formData}
                    classes={classes}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmitEdit}
                    onClose={() => setShowEditModal(null)}
                    formError={formError}
                    submitting={submitting}
                    isEdit={true}
                />
            )}

            {/* View Student Modal */}
            {showViewModal && (
                <ViewStudentModal
                    student={showViewModal}
                    onClose={() => setShowViewModal(null)}
                    formatDate={formatDate}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Student</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload CSV Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop - subtle blur */}
                    <div 
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={closeUploadModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <Upload size={20} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Students</h3>
                                </div>
                                <button 
                                    onClick={closeUploadModal} 
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Step 1: Download Template */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    1
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Download template</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Get the CSV format with required columns</p>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                    >
                                        <Download size={14} />
                                        Download CSV Template
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 dark:border-slate-800" />

                            {/* Step 2: Upload File */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    2
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Choose your file</p>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center py-3">
                                            {uploadFile ? (
                                                <>
                                                    <FileSpreadsheet size={24} className="text-primary-500 mb-1" />
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{uploadFile.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Click to change file</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={24} className="text-slate-400 mb-1" />
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Click to select CSV file</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Upload Result */}
                            {uploadResult && (
                                <div className={`rounded-xl p-4 ${uploadResult.error 
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        {uploadResult.error ? (
                                            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${uploadResult.error ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                                {uploadResult.message}
                                            </p>
                                            {uploadResult.errors?.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                                                        {uploadResult.error_count} row(s) had errors:
                                                    </p>
                                                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 max-h-24 overflow-y-auto">
                                                        {uploadResult.errors.slice(0, 5).map((err, i) => (
                                                            <li key={i} className="truncate">• {err}</li>
                                                        ))}
                                                        {uploadResult.errors.length > 5 && (
                                                            <li className="text-slate-500">...and {uploadResult.errors.length - 5} more</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={closeUploadModal}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={!uploadFile || uploading}
                                className="px-5 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading && <Loader2 size={16} className="animate-spin" />}
                                {uploading ? 'Uploading...' : 'Upload Students'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

// Student Form Modal Component
const StudentFormModal = ({ title, formData, classes, onInputChange, onSubmit, onClose, formError, submitting, isEdit }) => {
    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                {formError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        {formError}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Admission Number *</label>
                                <input
                                    type="text"
                                    name="admission_number"
                                    value={formData.admission_number}
                                    onChange={onInputChange}
                                    disabled={isEdit}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                >
                                    {GENDER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Class *</label>
                                <select
                                    name="class_id"
                                    value={formData.class_id}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>Class {cls.grade}-{cls.section}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Roll No *</label>
                                <input
                                    type="text"
                                    name="roll_no"
                                    value={formData.roll_no}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Blood Group</label>
                                <select
                                    name="blood_group"
                                    value={formData.blood_group}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                >
                                    <option value="">Select</option>
                                    {BLOOD_GROUPS.map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Date of Admission *</label>
                                <input
                                    type="date"
                                    name="date_of_admission"
                                    value={formData.date_of_admission}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={onInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                        />
                    </div>

                    {/* Parent Info */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Parent/Guardian Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Father Name *</label>
                                <input
                                    type="text"
                                    name="father_name"
                                    value={formData.father_name}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Mother Name</label>
                                <input
                                    type="text"
                                    name="mother_name"
                                    value={formData.mother_name}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Father Occupation</label>
                                <input
                                    type="text"
                                    name="father_occupation"
                                    value={formData.father_occupation}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Mother Occupation</label>
                                <input
                                    type="text"
                                    name="mother_occupation"
                                    value={formData.mother_occupation}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Contact Number *</label>
                                <input
                                    type="tel"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={onInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Parent Email</label>
                                <input
                                    type="email"
                                    name="parent_email"
                                    value={formData.parent_email}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Annual Income</label>
                                <input
                                    type="number"
                                    name="annual_income"
                                    value={formData.annual_income}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {submitting ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// View Student Modal Component
const ViewStudentModal = ({ student, onClose, formatDate }) => {
    const InfoRow = ({ label, value }) => (
        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="text-slate-900 dark:text-white font-medium">{value || '-'}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Student Avatar & Name */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xl font-bold">
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">{student.name}</h4>
                        <p className="text-slate-500 dark:text-slate-400">
                            {student.class_name} • Roll No: {student.roll_no}
                        </p>
                    </div>
                </div>

                <div className="space-y-1 text-sm">
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Basic Information</h5>
                    <InfoRow label="Admission Number" value={student.admission_number} />
                    <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
                    <InfoRow label="Gender" value={student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'} />
                    <InfoRow label="Blood Group" value={student.blood_group} />
                    <InfoRow label="Date of Admission" value={formatDate(student.date_of_admission)} />
                    <InfoRow label="Address" value={student.address} />

                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mt-4 mb-2">Parent Information</h5>
                    <InfoRow label="Father Name" value={student.father_name} />
                    <InfoRow label="Mother Name" value={student.mother_name} />
                    <InfoRow label="Father Occupation" value={student.father_occupation} />
                    <InfoRow label="Mother Occupation" value={student.mother_occupation} />
                    <InfoRow label="Contact Number" value={student.contact_number} />
                    <InfoRow label="Email" value={student.parent_email} />
                    <InfoRow label="Annual Income" value={student.annual_income ? `₹${student.annual_income.toLocaleString()}` : null} />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDatabase;
