import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, type Profile } from '../lib/profiles';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext, type SignUpResult } from './auth-context';
import { withTimeout } from '../lib/async';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchProfile = async (
        currentUser: Pick<User, 'id' | 'email' | 'user_metadata' | 'app_metadata'>
    ) => {
        setProfileLoading(true);
        try {
            const p = await withTimeout(
                getProfile(currentUser.id),
                5000,
                'Profile request timed out'
            );
            setProfile(p);
        } catch (err) {
            console.error('Error fetching profile:', err);

            const fullName =
                typeof currentUser.user_metadata?.full_name === 'string'
                    ? currentUser.user_metadata.full_name
                    : currentUser.email ?? 'User';
            const role =
                currentUser.app_metadata?.role === 'admin' || currentUser.user_metadata?.role === 'admin'
                    ? 'admin'
                    : 'user';

            setProfile({
                id: currentUser.id,
                full_name: fullName,
                role,
                avatar_url: null,
                created_at: new Date().toISOString(),
            });
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const syncAuthState = async (nextSession: Session | null) => {
            if (!mounted) return;

            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);

            if (nextSession?.user) {
                void fetchProfile(nextSession.user);
            } else {
                setProfile(null);
                setProfileLoading(false);
            }
        };

        void supabase.auth.getSession().then(async ({ data: { session } }) => {
            await syncAuthState(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                await syncAuthState(session);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            8000,
            'Sign in timed out'
        );
        if (error) throw error;
        setUser(data.user);
        setSession(data.session);
        if (data.user) {
            void fetchProfile(data.user);
        }
    };

    const handleSignUp = async (
        email: string,
        password: string,
        fullName: string
    ): Promise<SignUpResult> => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName,
                role: 'user',
            });

            if (profileError) {
                throw profileError;
            }
        }

        if (data.user && data.session) {
            setUser(data.user);
            setSession(data.session);
            void fetchProfile(data.user);
        } else {
            setUser(null);
            setSession(null);
            setProfile(null);
            setProfileLoading(false);
        }

        return { requiresEmailConfirmation: !data.session };
    };

    const handleSignOut = async () => {
        try {
            await withTimeout(
                supabase.auth.signOut({ scope: 'local' }),
                4000,
                'Sign out timed out'
            );
        } finally {
            setUser(null);
            setProfile(null);
            setSession(null);
            setProfileLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                profileLoading,
                signIn: handleSignIn,
                signUp: handleSignUp,
                signOut: handleSignOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
