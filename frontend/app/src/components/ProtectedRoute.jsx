import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './ui';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-paper">
                <div className="flex flex-col items-center gap-4">
                    <Logo size="lg" wordmark={false} />
                    <p className="text-sm text-ink-faint">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
