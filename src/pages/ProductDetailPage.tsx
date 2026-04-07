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
import { formatPrice } from '../lib/currency';
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
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [customSizeText, setCustomSizeText] = useState('');
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
        setSelectedSize(null);
        setSelectedColor(null);
        setCustomSizeText('');
    }, [product?.id]);

    const variants = product?.variants || [];
    const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
    
    // Sort colors to ensure consistent order
    colors.sort();

    // Extract all unique sizes from ALL variants
    const sizes = Array.from(new Set(variants.map((v) => v.size)));
    
    // Always include 'Custom' as an option if not present
    if (!sizes.some(s => s.toLowerCase() === 'custom')) {
        sizes.push('Custom');
    }

    const selectedVariant = variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
    );

    const isCustomSize = selectedSize?.toLowerCase() === 'custom';
    const variantExists = !!selectedVariant || isCustomSize;

    const price = isCustomSize ? (product?.price ?? 0) : (selectedVariant?.price ?? product?.price ?? 0);
    
    // Check if base product has stock, or any variant has stock
    const baseStock = Math.max(0, product?.stock ?? 0);
    const variantStock = selectedVariant ? Math.max(0, selectedVariant.stock) : 0;
    
    // Calculate total available stock across all variants
    const totalVariantStock = variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
    
    // Overall available stock for the product
    const overallStock = Math.max(baseStock, totalVariantStock);

    // Dynamic stock based on current selection state
    const displayStock = isCustomSize 
        ? 999 
        : (selectedVariant ? variantStock : overallStock);

    const handleAddToCart = async () => {
        if (!user || !product) return;
        
        // Validation
        if (sizes.length > 0 && !selectedSize) {
            showToast('Please select a size', 'error');
            return;
        }
        if (colors.length > 0 && !selectedColor) {
            showToast('Please select a color', 'error');
            return;
        }
        if (isCustomSize && !customSizeText.trim()) {
            showToast('Please enter your custom size details', 'error');
            return;
        }

        setAdding(true);
        try {
            await withTimeout(
                addItem(
                    product.id,
                    selectedVariant?.id || null, 
                    quantity,
                    isCustomSize ? customSizeText : null,
                    selectedSize, // Pass size name
                    selectedColor // Pass color name
                ),
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

    // Filter images based on selected color
    const allImages = product.images || [];
    const images = allImages.filter(img => {
        if (!selectedColor) return true;
        return img.color === selectedColor || !img.color;
    });

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
                            <span className="product-price">{formatPrice(price)}</span>
                            {displayStock > 0 ? (
                                <span className="badge badge-success">In Stock</span>
                            ) : (
                                <span className="badge badge-error">Sold Out</span>
                            )}
                        </div>

                        {product.description && (
                            <p className="body-md product-description">{product.description}</p>
                        )}

                        {/* Variant Selection (Both Color and Size visible) */}
                        <div className="variant-selectors">
                            {colors.length > 0 && (
                                <div className="variant-selector-group">
                                    <span className="variant-label">Color</span>
                                    <div className="variant-options">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                className={`variant-button ${selectedColor === color ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    setSelectedImage(0); // Reset gallery to first image of this color
                                                }}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sizes.length > 0 && (
                                <div className="variant-selector-group">
                                    <span className="variant-label">Size</span>
                                    <div className="variant-options">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                className={`variant-button ${selectedSize === size ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(size)}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error/Notice if combination doesn't exist */}
                        {selectedColor && selectedSize && !variantExists && (
                            <div className="variant-error-msg animate-fade-in">
                                This combination is not available
                            </div>
                        )}

                        {isCustomSize && (
                            <div className="custom-size-config animate-fade-in">
                                <p className="body-sm" style={{ marginBottom: 'var(--space-2)', color: 'var(--primary)' }}>
                                    <strong>Custom size:</strong> Enter your dimensions below. Our admin will review and adjust the price accordingly.
                                </p>
                                <textarea
                                    className="input-field"
                                    placeholder="e.g., 60x80 cm / Custom layout details..."
                                    value={customSizeText}
                                    onChange={(e) => setCustomSizeText(e.target.value)}
                                    rows={3}
                                />
                            </div>
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
                                <span className="spec-value">{displayStock} units</span>
                            </div>
                        </div>

                        {user && overallStock > 0 && (() => {
                            const needsColor = colors.length > 0;
                            const needsSize = sizes.length > 0;
                            const missingSelection = (needsColor && !selectedColor) || (needsSize && !selectedSize);
                            const isInvalidCombination = !missingSelection && !variantExists;

                            return (
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
                                            onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                                            disabled={quantity >= displayStock}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-lg"
                                        style={{ flex: 1 }}
                                        onClick={handleAddToCart}
                                        disabled={adding || displayStock <= 0 || isInvalidCombination}
                                    >
                                        {adding ? (
                                            <div className="spinner" style={{ width: 18, height: 18 }} />
                                        ) : displayStock <= 0 ? (
                                            'Out of Stock'
                                        ) : isInvalidCombination ? (
                                            'Not Available'
                                        ) : (
                                            <>
                                                <ShoppingCart size={18} />
                                                Add to Cart - {formatPrice(price * quantity)}
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })()}

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
