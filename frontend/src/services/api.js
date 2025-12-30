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

export default api;
