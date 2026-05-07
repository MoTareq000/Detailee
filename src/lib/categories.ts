import { supabase } from './supabase';
import type { Category } from './products';
import { clearCachedValue, readCachedValue, writeCachedValue } from './cache';
export type { Category } from './products';

export async function getCategories() {
    const cacheKey = 'categories';
    const cachedCategories = readCachedValue<Category[]>(cacheKey, 300_000);
    if (cachedCategories) {
        return cachedCategories;
    }

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    const categories = data as Category[];
    writeCachedValue(cacheKey, categories);
    return categories;
}

export async function createCategory(name: string, description?: string) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name, description })
        .select()
        .single();

    if (error) throw error;
    clearCachedValue('categories');
    return data as Category;
}

export async function updateCategory(
    id: string,
    updates: { name: string; description?: string | null }
) {
    const { data, error } = await supabase
        .from('categories')
        .update({
            name: updates.name,
            description: updates.description ?? null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    clearCachedValue('categories');
    return data as Category;
}

export async function deleteCategory(id: string) {
    const { error: unlinkError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);

    if (unlinkError) throw unlinkError;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    clearCachedValue('categories');
}
