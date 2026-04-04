import { supabase } from './supabase';
import type { Category } from './products';
export type { Category } from './products';

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data as Category[];
}

export async function createCategory(name: string, description?: string) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name, description })
        .select()
        .single();

    if (error) throw error;
    return data as Category;
}

export async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
}
