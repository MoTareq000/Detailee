import { supabase } from './supabase';
import type { Product } from './products';

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    created_at: string;
    product?: Product;
}

export async function getCartItems(userId: string) {
    const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*, images:product_images(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CartItem[];
}

export async function addToCart(userId: string, productId: string, quantity: number = 1) {
    // Check if item already exists in cart
    const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

    if (existing) {
        // Update quantity
        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id)
            .select('*, product:products(*, images:product_images(*))')
            .single();

        if (error) throw error;
        return data as CartItem;
    }

    // Create new cart item
    const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity })
        .select('*, product:products(*, images:product_images(*))')
        .single();

    if (error) throw error;
    return data as CartItem;
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
    const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .select('*, product:products(*, images:product_images(*))')
        .single();

    if (error) throw error;
    return data as CartItem;
}

export async function removeFromCart(cartItemId: string) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) throw error;
}

export async function clearCart(userId: string) {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) throw error;
}
