import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ShoppingCart,
    ArrowLeft,
    Minus,
    Plus,
    Package,
    Ruler,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { getProductById, type Product } from '../lib/products';
import { useAuth } from '../contexts/useAuth';
import { useCart } from '../contexts/useCart';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const { user } = useAuth();
    const { addItem } = useCart();

    useEffect(() => {
        async function load() {
            if (!id) return;
            setLoading(true);
            try {
                const data = await withTimeout(
                    getProductById(id),
                    6000,
                    'Product details took too long to load'
                );
                setProduct(data);
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [id]);

    useEffect(() => {
        setSelectedImage(0);
    }, [product?.id]);

    const handleAddToCart = async () => {
        if (!user || !product) return;
        setAdding(true);
        try {
            await withTimeout(
                addItem(product.id, quantity),
                6000,
                'Adding to cart took too long'
            );
            showToast(`${product.name} added to cart`, 'success');
        } catch {
            showToast('Failed to add to cart', 'error');
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="container">
                    <div className="product-detail-grid">
                        <div className="skeleton" style={{ aspectRatio: '1' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="skeleton" style={{ height: '2rem', width: '60%' }} />
                            <div className="skeleton" style={{ height: '1rem', width: '40%' }} />
                            <div className="skeleton" style={{ height: '4rem', width: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="container empty-state">
                    <p className="headline-sm">Product not found</p>
                    <Link to="/shop" className="btn btn-secondary">Back to Shop</Link>
                </div>
            </div>
        );
    }

    const images = product.images || [];
    const currentImage = images[selectedImage]?.image_url || '/images/placeholder.svg';
    const hasMultipleImages = images.length > 1;

    const showPreviousImage = () => {
        if (!hasMultipleImages) return;
        setSelectedImage((currentIndex) =>
            currentIndex === 0 ? images.length - 1 : currentIndex - 1
        );
    };

    const showNextImage = () => {
        if (!hasMultipleImages) return;
        setSelectedImage((currentIndex) =>
            currentIndex === images.length - 1 ? 0 : currentIndex + 1
        );
    };

    return (
        <div className="product-detail-page" id="product-detail-page">
            <div className="container">
                <Link to="/shop" className="back-link animate-fade-in">
                    <ArrowLeft size={16} />
                    <span>Back to Shop</span>
                </Link>

                <div className="product-detail-grid">
                    <div className="product-gallery animate-fade-in">
                        <div className="product-main-image-wrapper">
                            {hasMultipleImages && (
                                <>
                                    <button
                                        type="button"
                                        className="product-slider-btn product-slider-btn-prev"
                                        onClick={showPreviousImage}
                                        aria-label="Show previous product photo"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        className="product-slider-btn product-slider-btn-next"
                                        onClick={showNextImage}
                                        aria-label="Show next product photo"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="product-image-counter">
                                        {selectedImage + 1} / {images.length}
                                    </div>
                                </>
                            )}
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="product-main-image"
                                id="product-main-image"
                            />
                        </div>
                        {hasMultipleImages && (
                            <>
                                <div className="product-slider-dots" aria-label="Product image navigation">
                                    {images.map((img, index) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            className={`product-slider-dot ${index === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(index)}
                                            aria-label={`Show product photo ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <div className="product-thumbnails">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        className={`product-thumb ${index === selectedImage ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={img.image_url} alt={`${product.name} view ${index + 1}`} />
                                    </button>
                                ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="product-info animate-fade-in-up">
                        {product.category && (
                            <span className="label-sm">{product.category.name}</span>
                        )}
                        <h1 className="display-md product-title">{product.name}</h1>

                        <div className="product-price-row">
                            <span className="product-price">${product.price.toFixed(2)}</span>
                            {product.stock > 0 ? (
                                <span className="badge badge-success">In Stock</span>
                            ) : (
                                <span className="badge badge-error">Sold Out</span>
                            )}
                        </div>

                        {product.description && (
                            <p className="body-md product-description">{product.description}</p>
                        )}

                        <div className="spec-sheet">
                            <div className="spec-item">
                                <span className="spec-label">
                                    <Package size={14} />
                                    Material
                                </span>
                                <span className="spec-value">Premium PLA / Resin</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">
                                    <Ruler size={14} />
                                    Layer Height
                                </span>
                                <span className="spec-value label-sm">0.05mm</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">
                                    <Clock size={14} />
                                    Stock
                                </span>
                                <span className="spec-value">{product.stock} units</span>
                            </div>
                        </div>

                        {user && product.stock > 0 && (
                            <div className="add-to-cart-section">
                                <div className="quantity-selector">
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="quantity-value">{quantity}</span>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={quantity >= product.stock}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <button
                                    className="btn btn-primary btn-lg add-to-cart-btn"
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    id="add-to-cart-button"
                                >
                                    {adding ? (
                                        <div className="spinner" style={{ width: 18, height: 18 }} />
                                    ) : (
                                        <>
                                            <ShoppingCart size={18} />
                                            Add to Cart - ${(product.price * quantity).toFixed(2)}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {!user && (
                            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                Sign In to Purchase
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
