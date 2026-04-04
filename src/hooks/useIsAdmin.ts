import { useAuth } from '../contexts/useAuth';
import { isAuthorizedAdminEmail } from '../lib/admin';

export function useIsAdmin() {
    const { user, profile, loading, profileLoading } = useAuth();
    const checkingAdmin = loading || profileLoading;
    
    const email = (user?.email ?? '').trim().toLowerCase();
    const isHardcodedAdmin = isAuthorizedAdminEmail(email);
    const isDatabaseAdmin = profile?.role === 'admin';

    // DEBUG: Remove this once verified on production
    if (user) {
        console.log(`[Admin Check] Email: ${email}, Hardcoded: ${isHardcodedAdmin}, DB: ${isDatabaseAdmin}`);
    }

    const isAdmin = !checkingAdmin && (isHardcodedAdmin || isDatabaseAdmin);

    return {
        isAdmin,
        checkingAdmin,
        user,
    };
}
