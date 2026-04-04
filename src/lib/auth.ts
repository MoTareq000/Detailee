import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                full_name: fullName,
                role: 'user',
            });
        if (profileError) throw profileError;
    }

    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}

export async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
}

export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export function onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
) {
    return supabase.auth.onAuthStateChange(callback);
}
