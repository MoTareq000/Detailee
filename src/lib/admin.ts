/**
 * ADMIN CONFIGURATION
 * 
 * To add an admin, update the user's role in the 'profiles' table 
 * using the Supabase Dashboard SQL Editor:
 * 
 * UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';
 */

export function isAuthorizedAdminEmail(_email: string | null | undefined) {
    // We no longer rely on hardcoded email lists for production security.
    // Instead, we trust the 'role' field in the database profile which is 
    // secured by Row Level Security (RLS).
    return false; 
}
