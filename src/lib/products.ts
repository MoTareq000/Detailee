import { supabase } from './supabase';

export interface Product {
    id: string;
    category_id: string | null;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    created_at: string;
    category?: Category;
    images?: ProductImage[];
}

export interface Category {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    created_at: string;
}

export async function getProducts(options?: {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
    limit?: number;
}) {
    let query = supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)');

    if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
    }

    if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (typeof options?.minPrice === 'number') {
        query = query.gte('price', options.minPrice);
    }

    if (typeof options?.maxPrice === 'number') {
        query = query.lte('price', options.maxPrice);
    }

    if (options?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
    } else if (options?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
}

export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Product;
}

export async function createProduct(product: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    category_id?: string;
}) {
    const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

export async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
}

export async function addProductImage(productId: string, imageUrl: string) {
    const { data, error } = await supabase
        .from('product_images')
        .insert({ product_id: productId, image_url: imageUrl })
        .select()
        .single();

    if (error) throw error;
    return data as ProductImage;
}

export async function deleteProductImage(imageId: string) {
    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) throw error;
}
