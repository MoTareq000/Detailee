import { createContext } from 'react';

export interface WishlistContextType {
    productIds: string[];
    loading: boolean;
    isWishlisted: (productId: string) => boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    refreshWishlist: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
