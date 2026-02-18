import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser, logout as apiLogout, isAuthenticated } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        if (!isAuthenticated()) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const userData = await getCurrentUser();
            setUser(userData);
            setError(null);
        } catch (err) {
            setUser(null);
            apiLogout();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        setError(null);
        try {
            await loginUser(email, password);
            await fetchUser();
            return true;
        } catch (err) {
            const message = typeof err.message === 'string' ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
            return false;
        }
    };

    const register = async (email, password) => {
        setError(null);
        try {
            await registerUser(email, password);
            return true;
        } catch (err) {
            const message = typeof err.message === 'string' ? err.message : 'Registration failed. Please try again.';
            setError(message);
            return false;
        }
    };

    const logout = () => {
        apiLogout();
        setUser(null);
        setError(null);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
