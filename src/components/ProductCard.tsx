import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useCart } from '../contexts/useCart';
import type { Product } from '../lib/products';
import { formatPrice } from '../lib/currency';
import './ProductCard.css';

interface ProductCardProps {
    product: Product;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const { user } = useAuth();
    const { addItem } = useCart();
    
    if (!product) return null;

    const imageUrl = product?.images?.[0]?.image_url || '/images/placeholder.svg';

    const baseStock = Math.max(0, product?.stock ?? 0);
    const variants = product?.variants || [];
    const totalVariantStock = variants.reduce((sum, v) => sum + Math.max(0, v?.stock ?? 0), 0);
    const overallStock = Math.max(baseStock, totalVariantStock);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !product) return;
        try {
            await addItem(product.id, null, 1, null, null, null);
        } catch (err) {
            console.error('Error adding to cart:', err);
        }
    };

    return (
        <Link
            to={`/product/${product.id}`}
            className="product-card card"
            id={`product-card-${product.id}`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="product-card-image-wrapper">
                <img
                    src={imageUrl}
                    alt={product.name || 'Product'}
                    className="product-card-image"
                    loading="lazy"
                />
                <div className="product-card-overlay">
                    {user && overallStock > 0 && (
                        <button
                            className="btn btn-primary btn-sm product-card-cart-btn"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart size={14} />
                            Add to Cart
                        </button>
                    )}
                </div>
            </div>

            <div className="product-card-info">
                {product?.category && (
                    <span className="label-sm">{product.category.name}</span>
                )}
                <h3 className="product-card-name">{product?.name}</h3>
                <div className="product-card-bottom">
                    <span className="product-card-price">{formatPrice(product?.price ?? 0)}</span>
                    {overallStock <= 0 && (
                        <span className="badge badge-error">Sold Out</span>
                    )}
                    {overallStock > 0 && overallStock <= 5 && (
                        <span className="badge badge-warning">Low Stock</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
