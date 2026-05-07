import { supabase } from './supabase';

export interface WishlistItem {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
}

export async function getWishlistProductIds(userId: string) {
    const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((item) => item.product_id as string);
}

export async function addToWishlist(userId: string, productId: string) {
    const { data, error } = await supabase
        .from('wishlists')
        .upsert(
            {
                user_id: userId,
                product_id: productId,
            },
            { onConflict: 'user_id,product_id' }
        )
        .select()
        .single();

    if (error) throw error;
    return data as WishlistItem;
}

export async function removeFromWishlist(userId: string, productId: string) {
    const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) throw error;
}
