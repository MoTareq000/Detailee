import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Zap, Shield } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, type Product } from '../lib/products';
import { getCategories, type Category } from '../lib/categories';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import './HomePage.css';

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                const products = await withTimeout(
                    getProducts({ limit: 6, sortBy: 'newest' }),
                    6000,
                    'Products took too long to load'
                );
                if (!cancelled) {
                    setFeaturedProducts(products);
                }
            } catch (err) {
                console.error('Error loading homepage data:', err);
                if (!cancelled) {
                    showToast('Products are taking too long to load.', 'error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        async function loadCategories() {
            try {
                const cats = await withTimeout(
                    getCategories(),
                    6000,
                    'Categories took too long to load'
                );
                if (!cancelled) {
                    setCategories(cats);
                }
            } catch (err) {
                console.error('Error loading categories:', err);
            }
        }

        void loadProducts();
        void loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="home-page" id="home-page">
            {/* Hero Section */}
            <section className="hero" id="hero-section">
                <div className="hero-glow" />
                <div className="hero-inner container">
                    <div className="hero-content animate-fade-in-up">
                        <span className="label-md hero-tag">Detailee Signature World</span>
                        <h1 className="display-lg">
                            Precision in
                            <br />
                            <span className="hero-accent">Every Layer</span>
                        </h1>
                        <p className="body-lg hero-subtitle">
                            A darker, sharper storefront built around your identity, where every
                            piece feels curated, editorial, and ready for the spotlight.
                        </p>
                        <div className="hero-actions">
                            <Link to="/shop" className="btn btn-primary btn-lg" id="hero-shop-btn">
                                Explore Collection
                                <ArrowRight size={18} />
                            </Link>
                            <Link to="/shop" className="btn btn-secondary btn-lg">
                                View All
                            </Link>
                        </div>
                    </div>
                    <div className="hero-visual animate-fade-in">
                        <div className="hero-composition">
                            <div className="hero-image-wrapper">
                                <img
                                    src="/images/BACKGROUND1.jpeg"
                                    alt="Detailee brand artwork"
                                    className="hero-image"
                                />
                                <div className="hero-image-glow" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features section" id="features-section">
                <div className="container">
                    <div className="features-grid stagger">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Layers size={24} />
                            </div>
                            <h3 className="headline-sm">Layer-by-Layer</h3>
                            <p className="body-sm">
                                Every figure is printed at 0.05mm resolution for unparalleled detail
                                and surface finish.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Zap size={24} />
                            </div>
                            <h3 className="headline-sm">Engineered Design</h3>
                            <p className="body-sm">
                                Digital sculpting meets industrial precision. Each model is optimized
                                for structural integrity.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Shield size={24} />
                            </div>
                            <h3 className="headline-sm">Premium Materials</h3>
                            <p className="body-sm">
                                We use high-grade PLA and resin materials that ensure durability and
                                a flawless matte finish.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured section" id="featured-section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <span className="label-md" style={{ color: 'var(--primary)' }}>
                                Collection
                            </span>
                            <h2 className="display-md">Latest Creations</h2>
                        </div>
                        <Link to="/shop" className="btn btn-secondary">
                            View All
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="product-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 0 }} />
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="product-grid stagger">
                            {featuredProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p className="body-lg">No products available yet.</p>
                            <p className="body-sm">Check back soon for our latest creations.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="categories-section section" id="categories-section">
                    <div className="container">
                        <div className="section-header">
                            <div>
                                <span className="label-md" style={{ color: 'var(--primary)' }}>Browse</span>
                                <h2 className="display-md">Categories</h2>
                            </div>
                        </div>
                        <div className="categories-grid stagger">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/shop?category=${cat.id}`}
                                    className="category-card"
                                >
                                    <h3 className="headline-sm">{cat.name}</h3>
                                    {cat.description && (
                                        <p className="body-sm">{cat.description}</p>
                                    )}
                                    <ArrowRight size={18} className="category-arrow" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="cta-section section" id="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <div className="cta-glow" />
                        <span className="label-md" style={{ color: 'var(--primary)' }}>
                            The Digital Atelier
                        </span>
                        <h2 className="display-md">Ready to Start Your Collection?</h2>
                        <p className="body-lg">
                            Join the community of collectors who appreciate precision engineering
                            and digital artistry.
                        </p>
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Create Account
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
