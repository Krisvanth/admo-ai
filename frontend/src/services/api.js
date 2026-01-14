import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admo_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    },
    getCurrentUser: async () => {
        // Since we don't have a specific /me endpoint yet, we can decode the token 
        // or just rely on the stored user info. For now, we'll return null if no token.
        // In a real app, you'd verify the token with the backend here.
        return null;
    }
};

export const leaveService = {
    createLeave: async (leaveData) => {
        // Backend now uses JWT to get school_id and teacher_id
        const response = await api.post('/leaves/', {
            start_date: leaveData.start_date,
            end_date: leaveData.end_date,
            reason: leaveData.reason,
            hours: leaveData.hours || null,
            teacher_comment: leaveData.teacher_comment || null
        });
        return response.data;
    },
    getLeaves: async (teacherId = null, statusFilter = null, limit = 50, offset = 0) => {
        // Backend now uses JWT to get school_id
        let url = `/leaves/?limit=${limit}&offset=${offset}`;
        if (teacherId) {
            url += `&teacher_id=${teacherId}`;
        }
        if (statusFilter) {
            url += `&status_filter=${statusFilter}`;
        }
        const response = await api.get(url);
        return response.data;
    },
    updateLeaveStatus: async (leaveId, status, comment = null) => {
        let url = `/leaves/${leaveId}?status=${status}`;
        if (comment) {
            url += `&comment=${encodeURIComponent(comment)}`;
        }
        const response = await api.put(url);
        return response.data;
    },
    deleteLeave: async (leaveId) => {
        const response = await api.delete(`/leaves/${leaveId}`);
        return response.data;
    }
};

// Timetable Configuration Service
export const timetableConfigService = {
    // Get current timetable configuration
    getConfig: async () => {
        const response = await api.get('/timetable-config/');
        return response.data;
    },

    // Update timetable configuration (working days and/or time slots)
    updateConfig: async (config) => {
        const response = await api.put('/timetable-config/', config);
        return response.data;
    },

    // Add a new time slot
    addTimeSlot: async (slot) => {
        const response = await api.post('/timetable-config/add-slot/', slot);
        return response.data;
    },

    // Update a specific time slot
    updateTimeSlot: async (slotNumber, slotData) => {
        const response = await api.put(`/timetable-config/slot/${slotNumber}`, slotData);
        return response.data;
    },

    // Delete a time slot
    deleteTimeSlot: async (slotNumber) => {
        const response = await api.delete(`/timetable-config/slot/${slotNumber}`);
        return response.data;
    },

    // Reset to default configuration
    resetConfig: async () => {
        const response = await api.post('/timetable-config/reset/');
        return response.data;
    }
};

// Classes Service
export const classService = {
    getClasses: async () => {
        const response = await api.get('/classes/');
        return response.data;
    },
    createClass: async (classData) => {
        const response = await api.post('/classes/', classData);
        return response.data;
    },
    updateClass: async (classId, classData) => {
        const response = await api.put(`/classes/${classId}`, classData);
        return response.data;
    },
    deleteClass: async (classId) => {
        const response = await api.delete(`/classes/${classId}`);
        return response.data;
    }
};

// Subjects Service
export const subjectService = {
    getSubjects: async () => {
        const response = await api.get('/subjects/');
        return response.data;
    },
    createSubject: async (subjectData) => {
        const response = await api.post('/subjects/', subjectData);
        return response.data;
    },
    updateSubject: async (subjectId, subjectData) => {
        const response = await api.put(`/subjects/${subjectId}`, subjectData);
        return response.data;
    },
    deleteSubject: async (subjectId) => {
        const response = await api.delete(`/subjects/${subjectId}`);
        return response.data;
    }
};

// Teachers Service
export const teacherService = {
    getTeachers: async () => {
        const response = await api.get('/teachers/');
        return response.data;
    }
};

// Timetable Entries Service (Period assignments for classes)
export const timetableEntryService = {
    // Get all timetable entries for a specific class
    getEntries: async (classId) => {
        const response = await api.get(`/timetable-entries/?class_id=${classId}`);
        return response.data;
    },

    // Get all timetable entries for a teacher (for My View)
    getTeacherEntries: async (teacherId = null) => {
        let url = '/timetable-entries/teacher/';
        if (teacherId) {
            url += `?teacher_id=${teacherId}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    // Create or update a single timetable entry
    createOrUpdateEntry: async (entryData) => {
        const response = await api.post('/timetable-entries/', entryData);
        return response.data;
    },

    // Bulk update timetable entries
    bulkUpdate: async (entries) => {
        const response = await api.put('/timetable-entries/bulk', { entries });
        return response.data;
    },

    // Delete a timetable entry
    deleteEntry: async (entryId) => {
        const response = await api.delete(`/timetable-entries/${entryId}`);
        return response.data;
    }
};

// Student Service
export const studentService = {
    // Get students with pagination, optionally filtered by class and search
    getStudents: async (classId = null, isActive = true, page = 1, pageSize = 20, search = null) => {
        let url = `/students/?is_active=${isActive}&page=${page}&page_size=${pageSize}`;
        if (classId) {
            url += `&class_id=${classId}`;
        }
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    // Get a single student by ID
    getStudent: async (studentId) => {
        const response = await api.get(`/students/${studentId}`);
        return response.data;
    },

    // Create a new student
    createStudent: async (studentData) => {
        const response = await api.post('/students/', studentData);
        return response.data;
    },

    // Update a student
    updateStudent: async (studentId, studentData) => {
        const response = await api.put(`/students/${studentId}`, studentData);
        return response.data;
    },

    // Delete a student
    deleteStudent: async (studentId) => {
        const response = await api.delete(`/students/${studentId}`);
        return response.data;
    },

    // Download CSV template
    downloadTemplate: async () => {
        const response = await api.get('/students/csv-template/', {
            responseType: 'blob'
        });
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'student_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Export students to CSV
    exportStudents: async (classId = null, isActive = true) => {
        let url = `/students/export/?is_active=${isActive}`;
        if (classId) {
            url += `&class_id=${classId}`;
        }
        const response = await api.get(url, {
            responseType: 'blob'
        });
        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'students_export.csv';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename=(.+)/);
            if (match) {
                filename = match[1];
            }
        }
        // Create download link
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    },

    // Bulk upload students from CSV
    bulkUpload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/students/bulk-upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

// Dashboard Service
export const dashboardService = {
    // Get dashboard statistics
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    // Get timetable config for schedule display
    getTimetableConfig: async () => {
        const response = await api.get('/dashboard/timetable-config');
        return response.data;
    },

    // Get birthdays
    getBirthdays: async () => {
        const response = await api.get('/dashboard/birthdays');
        return response.data;
    },

    // Get recent activity
    getRecentActivity: async (limit = 10) => {
        const response = await api.get(`/dashboard/recent-activity?limit=${limit}`);
        return response.data;
    },

    // Log activity
    logActivity: async (action, description, entityType = null, entityId = null) => {
        const response = await api.post('/activity-log/', {
            action,
            description,
            entity_type: entityType,
            entity_id: entityId
        });
        return response.data;
    }
};

// Exam Service
export const examService = {
    // Get all exams (with optional filters)
    getExams: async (classId = null, status = null) => {
        let url = '/exams/';
        const params = [];
        if (classId) params.push(`class_id=${classId}`);
        if (status) params.push(`status=${status}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        const response = await api.get(url);
        return response.data;
    },

    // Get single exam by ID
    getExam: async (examId) => {
        const response = await api.get(`/exams/${examId}`);
        return response.data;
    },

    // Create new exam
    createExam: async (examData) => {
        const response = await api.post('/exams/', examData);
        return response.data;
    },

    // Update exam
    updateExam: async (examId, examData) => {
        const response = await api.put(`/exams/${examId}`, examData);
        return response.data;
    },

    // Delete exam
    deleteExam: async (examId) => {
        const response = await api.delete(`/exams/${examId}`);
        return response.data;
    },

    // Publish exam
    publishExam: async (examId) => {
        const response = await api.put(`/exams/${examId}/publish`);
        return response.data;
    },

    // Unpublish exam (Principal only)
    unpublishExam: async (examId) => {
        const response = await api.put(`/exams/${examId}/unpublish`);
        return response.data;
    },

    // Get exam timetable (all subjects)
    getExamTimetable: async (examId) => {
        const response = await api.get(`/exams/${examId}/timetable`);
        return response.data;
    },

    // Add subject to exam timetable
    addTimetableEntry: async (examId, entryData) => {
        const response = await api.post(`/exams/${examId}/timetable`, entryData);
        return response.data;
    },

    // Update timetable entry
    updateTimetableEntry: async (examId, entryId, entryData) => {
        const response = await api.put(`/exams/${examId}/timetable/${entryId}`, entryData);
        return response.data;
    },

    // Delete timetable entry
    deleteTimetableEntry: async (examId, entryId) => {
        const response = await api.delete(`/exams/${examId}/timetable/${entryId}`);
        return response.data;
    },

    // === MARKS ENTRY ===

    // Get marks summary for all subjects in an exam
    getMarksSummary: async (examId) => {
        const response = await api.get(`/exams/${examId}/marks-summary`);
        return response.data;
    },

    // Get marks for a specific subject (exam timetable entry)
    getMarksForEntry: async (examId, entryId) => {
        const response = await api.get(`/exams/${examId}/marks/${entryId}`);
        return response.data;
    },

    // Get exam analytics
    getExamAnalytics: async (examId) => {
        const response = await api.get(`/exams/${examId}/analytics`);
        return response.data;
    }
};

// Marks Service
export const marksService = {
    // Bulk save marks for multiple students
    bulkSaveMarks: async (data) => {
        const response = await api.post('/marks/bulk', data);
        return response.data;
    },

    // Update single mark
    updateMark: async (markId, data) => {
        const response = await api.patch(`/marks/${markId}`, data);
        return response.data;
    },

    // Delete mark
    deleteMark: async (markId) => {
        const response = await api.delete(`/marks/${markId}`);
        return response.data;
    },

    // Publish marks for a subject
    publishMarks: async (examId, entryId) => {
        const response = await api.post('/marks/publish', {
            exam_id: examId,
            exam_timetable_entry_id: entryId
        });
        return response.data;
    },

    // Unpublish marks (Principal only)
    unpublishMarks: async (examId, entryId) => {
        const response = await api.post('/marks/unpublish', {
            exam_id: examId,
            exam_timetable_entry_id: entryId
        });
        return response.data;
    }
};

export default api;

