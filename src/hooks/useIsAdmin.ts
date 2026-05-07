import { useAuth } from '../contexts/useAuth';

export function useIsAdmin() {
    const { user, profile, loading, profileLoading } = useAuth();
    const checkingAdmin = loading || (profileLoading && !profile);
    
    const isDatabaseAdmin = profile?.role === 'admin';

    const isAdmin = !checkingAdmin && isDatabaseAdmin;

    return {
        isAdmin,
        checkingAdmin,
        user,
    };
}
