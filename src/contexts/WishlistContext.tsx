import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import * as wishlistService from '../lib/wishlist';
import { WishlistContext } from './wishlist-context';
import { withTimeout } from '../lib/async';

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [productIds, setProductIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshWishlist = useCallback(async () => {
        if (!user) {
            setProductIds([]);
            return;
        }

        setLoading(true);
        try {
            const ids = await withTimeout(
                wishlistService.getWishlistProductIds(user.id),
                6000,
                'Wishlist took too long to load'
            );
            setProductIds(ids);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setProductIds([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void refreshWishlist();
    }, [refreshWishlist]);

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            throw new Error('Must be logged in');
        }

        const wasWishlisted = productIds.includes(productId);
        setProductIds((current) =>
            wasWishlisted ? current.filter((id) => id !== productId) : [productId, ...current]
        );

        try {
            if (wasWishlisted) {
                await wishlistService.removeFromWishlist(user.id, productId);
            } else {
                await wishlistService.addToWishlist(user.id, productId);
            }
        } catch (error) {
            setProductIds((current) =>
                wasWishlisted ? [productId, ...current] : current.filter((id) => id !== productId)
            );
            throw error;
        }
    };

    const isWishlisted = useCallback(
        (productId: string) => productIds.includes(productId),
        [productIds]
    );

    return (
        <WishlistContext.Provider
            value={{
                productIds,
                loading,
                isWishlisted,
                toggleWishlist,
                refreshWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}
