import { supabase } from './supabase';
import type { Product, ProductVariant } from './products';

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    size: string | null;
    color: string | null;
    custom_size_text: string | null;
    created_at: string;
    product?: Product;
    variant?: ProductVariant;
}

export async function getCartItems(userId: string) {
    const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*, images:product_images(*), variants:product_variants(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CartItem[];
}

export async function addToCart(
    userId: string,
    productId: string,
    variantId: string | null = null,
    quantity: number = 1,
    customSizeText: string | null = null,
    size: string | null = null,
    color: string | null = null
) {
    // Check if item already exists in cart with same variant
    let query = supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (variantId) {
        query = query.eq('variant_id', variantId);
    } else {
        query = query.is('variant_id', null);
    }

    if (size) {
        query = query.eq('size', size);
    } else {
        query = query.is('size', null);
    }

    if (color) {
        query = query.eq('color', color);
    } else {
        query = query.is('color', null);
    }

    if (customSizeText) {
        query = query.eq('custom_size_text', customSizeText);
    } else {
        query = query.is('custom_size_text', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
        // Update quantity
        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id)
            .select('*, product:products(*, images:product_images(*), variants:product_variants(*))')
            .single();

        if (error) throw error;
        return data as CartItem;
    }

    // Create new cart item
    const { data, error } = await supabase
        .from('cart_items')
        .insert({
            user_id: userId,
            product_id: productId,
            variant_id: variantId,
            quantity,
            size,
            color,
            custom_size_text: customSizeText
        })
        .select('*, product:products(*, images:product_images(*), variants:product_variants(*))')
        .single();

    if (error) throw error;
    return data as CartItem;
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
    const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .select('*, product:products(*, images:product_images(*), variants:product_variants(*))')
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
