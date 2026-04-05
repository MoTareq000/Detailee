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
    const imageUrl = product.images?.[0]?.image_url || '/images/placeholder.svg';

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;
        try {
            // Fix: Added null arguments to match the required 6-argument signature
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
                    alt={product.name}
                    className="product-card-image"
                    loading="lazy"
                />
                <div className="product-card-overlay">
                    {user && product.stock > 0 && (
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
                {product.category && (
                    <span className="label-sm">{product.category.name}</span>
                )}
                <h3 className="product-card-name">{product.name}</h3>
                <div className="product-card-bottom">
                    <span className="product-card-price">{formatPrice(product.price)}</span>
                    {product.stock <= 0 && (
                        <span className="badge badge-error">Sold Out</span>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                        <span className="badge badge-warning">Low Stock</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
