import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for existing token
        const token = localStorage.getItem('admo_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({
                        email: decoded.sub,
                        role: decoded.role,
                        school_id: decoded.school_id,
                        // Name might not be in token depending on backend, 
                        // but we can add it or fetch it. For now, we'll use email as name fallback
                        name: decoded.sub
                    });
                }
            } catch (err) {
                console.error("Invalid token", err);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await authService.login(email, password);
            const { access_token } = data;

            localStorage.setItem('admo_token', access_token);

            const decoded = jwtDecode(access_token);
            setUser({
                email: decoded.sub,
                role: decoded.role,
                school_id: decoded.school_id,
                name: decoded.sub
            });
            return true;
        } catch (err) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admo_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, error }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
