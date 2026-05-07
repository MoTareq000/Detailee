import { supabase } from './supabase';

export interface Profile {
    id: string;
    full_name: string | null;
    role: 'user' | 'admin';
    avatar_url: string | null;
    created_at: string;
}

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Omit<Profile, 'role' | 'id' | 'created_at'>>) {
    const normalizedUpdates = {
        ...updates,
        full_name: updates.full_name?.trim() ?? null,
    };

    const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update(normalizedUpdates)
        .eq('id', userId)
        .select('id');

    if (updateError) throw updateError;

    if ((updatedRows?.length ?? 0) === 0) {
        const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(
                {
                    id: userId,
                    full_name: normalizedUpdates.full_name,
                    role: 'user',
                },
                { onConflict: 'id' }
            )
            .select()
            .single();

        if (createError) throw createError;
        return createdProfile as Profile;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as Profile;
}
