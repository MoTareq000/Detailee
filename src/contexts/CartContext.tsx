import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import * as cartService from '../lib/cart';
import type { CartItem } from '../lib/cart';
import { CartContext } from './cart-context';
import { withTimeout } from '../lib/async';

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!user) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const data = await withTimeout(
                cartService.getCartItems(user.id),
                6000,
                'Cart took too long to load'
            );
            setItems(data);
        } catch (err) {
            console.error('Error fetching cart:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addItem = async (productId: string, quantity = 1) => {
        if (!user) throw new Error('Must be logged in');
        await cartService.addToCart(user.id, productId, quantity);
        await refreshCart();
    };

    const removeItem = async (cartItemId: string) => {
        await cartService.removeFromCart(cartItemId);
        await refreshCart();
    };

    const updateQuantity = async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            await removeItem(cartItemId);
            return;
        }
        await cartService.updateCartQuantity(cartItemId, quantity);
        await refreshCart();
    };

    const clearAll = async () => {
        if (!user) return;
        await cartService.clearCart(user.id);
        setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => {
        const price = item.product?.price ?? 0;
        return sum + price * item.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                loading,
                itemCount,
                total,
                addItem,
                removeItem,
                updateQuantity,
                clearAll,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
