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
    variant_id: string | null;
    quantity: number;
    price_at_purchase: number;
    size: string | null;
    color: string | null;
    custom_size_text: string | null;
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
        items: {
            product_id: string;
            variant_id: string | null;
            quantity: number;
            price: number;
            size: string | null;
            color: string | null;
            custom_size_text: string | null;
        }[];
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
    const orderItemsList = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size,
        color: item.color,
        custom_size_text: item.custom_size_text,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsList);
    if (itemsError) throw itemsError;

    // Update product/variant stock
    for (const item of items) {
        if (item.variant_id) {
            // Update variant stock
            const { data: variant } = await supabase
                .from('product_variants')
                .select('stock')
                .eq('id', item.variant_id)
                .single();
            
            if (variant) {
                await supabase
                    .from('product_variants')
                    .update({ stock: Math.max(0, variant.stock - item.quantity) })
                    .eq('id', item.variant_id);
            }
        } else {
            // Update base product stock (using RPC or manual)
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                p_id: item.product_id,
                qty: item.quantity,
            });
            
            if (stockError) {
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

export async function deleteOrder(orderId: string) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
}
