import { createContext } from 'react';
import type { CartItem } from '../lib/cart';

export interface CartContextType {
    items: CartItem[];
    loading: boolean;
    itemCount: number;
    total: number;
    addItem: (productId: string, quantity?: number) => Promise<void>;
    removeItem: (cartItemId: string) => Promise<void>;
    updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
    clearAll: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
