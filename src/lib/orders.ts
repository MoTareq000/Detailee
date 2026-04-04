import { supabase } from './supabase';
import type { ProductImage } from './products';

export interface Order {
    id: string;
    user_id: string;
    total_price: number;
    phone: string;
    city: string;
    street: string;
    building: string | null;
    notes: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    quantity: number;
    price_at_purchase: number;
    created_at: string;
    product?: OrderProduct | null;
}

export interface OrderProduct {
    name: string;
    images?: ProductImage[];
}

export interface OrderCheckoutDetails {
    phone: string;
    city: string;
    street: string;
    building?: string;
    notes?: string;
}

export async function createOrder(
    params: {
        userId: string;
        items: { product_id: string; quantity: number; price: number }[];
        totalPrice: number;
    } & OrderCheckoutDetails
) {
    const {
        userId,
        items,
        totalPrice,
        phone,
        city,
        street,
        building,
        notes,
    } = params;

    // Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            total_price: totalPrice,
            phone,
            city,
            street,
            building: building?.trim() || null,
            notes: notes?.trim() || null,
            status: 'pending',
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of items) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
            p_id: item.product_id,
            qty: item.quantity,
        });
        if (stockError) {
            // Fallback: manual update
            const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();
            if (product) {
                await supabase
                    .from('products')
                    .update({ stock: Math.max(0, product.stock - item.quantity) })
                    .eq('id', item.product_id);
            }
        }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', userId);

    return order as Order;
}

export async function getUserOrders(userId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(name, images:product_images(*)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
}

export async function getOrderById(orderId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(name, images:product_images(*)))')
        .eq('id', orderId)
        .single();

    if (error) throw error;
    return data as Order;
}

export async function getAllOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(name))')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;
    return data as Order;
}
