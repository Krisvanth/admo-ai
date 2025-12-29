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

export default api;
