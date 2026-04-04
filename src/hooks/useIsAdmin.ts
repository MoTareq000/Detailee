import { useAuth } from '../contexts/useAuth';
import { isAuthorizedAdminEmail } from '../lib/admin';

export function useIsAdmin() {
    const { user, loading, profileLoading } = useAuth();
    const checkingAdmin = loading || profileLoading;
    const isAdmin = !checkingAdmin && isAuthorizedAdminEmail(user?.email);

    return {
        isAdmin,
        checkingAdmin,
        user,
    };
}
