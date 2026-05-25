import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { isAdmin, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-brand-red" size={48} />
            </div>
        );
    }
    
    if (!isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
