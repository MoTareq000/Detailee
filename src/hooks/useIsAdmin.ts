import { useAuth } from '../contexts/useAuth';
import { isAuthorizedAdminEmail } from '../lib/admin';

export function useIsAdmin() {
    const { user, profile, loading, profileLoading } = useAuth();
    const checkingAdmin = loading || profileLoading;
    
    // Check if user is admin either by hardcoded email OR by database role
    const isAdmin = !checkingAdmin && (
        isAuthorizedAdminEmail(user?.email) || 
        profile?.role === 'admin'
    );

    return {
        isAdmin,
        checkingAdmin,
        user,
    };
}
