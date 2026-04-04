import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/interfaces-select';
import ProductCard from '../components/ProductCard';
import { getProducts, type Product } from '../lib/products';
import { getCategories, type Category } from '../lib/categories';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import './ShopPage.css';

type SortOption = 'newest' | 'price_asc' | 'price_desc';
const ALL_CATEGORIES_VALUE = 'all_categories';

function getInitialSort(searchParams: URLSearchParams): SortOption {
    const sortParam = searchParams.get('sort');
    if (sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'newest') {
        return sortParam;
    }

    return 'newest';
}

function parsePriceValue(value: string) {
    if (!value.trim()) {
        return undefined;
    }

    const parsed = Number.parseFloat(value);

    if (!Number.isFinite(parsed)) {
        return undefined;
    }

    return Math.max(0, parsed);
}

function formatPriceLabel(minPrice?: number, maxPrice?: number) {
    if (typeof minPrice === 'number' && typeof maxPrice === 'number') {
        return `$${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)}`;
    }

    if (typeof minPrice === 'number') {
        return `From $${minPrice.toFixed(2)}`;
    }

    if (typeof maxPrice === 'number') {
        return `Up to $${maxPrice.toFixed(2)}`;
    }

    return '';
}

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState<SortOption>(getInitialSort(searchParams));
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [draftMinPrice, setDraftMinPrice] = useState(searchParams.get('minPrice') || '');
    const [draftMaxPrice, setDraftMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(
        searchParams.get('category') || ''
    );
    const pricePopoverRef = useRef<HTMLDivElement | null>(null);
    const deferredSearch = useDeferredValue(search.trim());
    const deferredMinPrice = useDeferredValue(minPrice.trim());
    const deferredMaxPrice = useDeferredValue(maxPrice.trim());
    const parsedMinPrice = parsePriceValue(deferredMinPrice);
    const parsedMaxPrice = parsePriceValue(deferredMaxPrice);
    const priceFilterLabel = (typeof parsedMinPrice === 'number' || typeof parsedMaxPrice === 'number')
        ? formatPriceLabel(parsedMinPrice, parsedMaxPrice)
        : 'Price Range';
    const hasActiveFilters = Boolean(
        deferredSearch || selectedCategory || sortBy !== 'newest' || minPrice.trim() || maxPrice.trim()
    );

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            setLoading(true);
            try {
                const prods = await withTimeout(
                    getProducts({
                        categoryId: selectedCategory || undefined,
                        search: deferredSearch || undefined,
                        minPrice: parsedMinPrice,
                        maxPrice: parsedMaxPrice,
                        sortBy,
                    }),
                    6000,
                    'Products took too long to load'
                );
                if (!cancelled) {
                    setProducts(prods);
                }
            } catch (err) {
                console.error('Error loading products:', err);
                if (!cancelled) {
                    setProducts([]);
                    showToast('Unable to load products right now.', 'error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadProducts();

        return () => {
            cancelled = true;
        };
    }, [selectedCategory, sortBy, deferredSearch, parsedMinPrice, parsedMaxPrice]);

    useEffect(() => {
        let cancelled = false;

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

        void loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const nextParams = new URLSearchParams();

        if (selectedCategory) {
            nextParams.set('category', selectedCategory);
        }

        if (search.trim()) {
            nextParams.set('search', search.trim());
        }

        if (sortBy !== 'newest') {
            nextParams.set('sort', sortBy);
        }

        if (minPrice.trim()) {
            nextParams.set('minPrice', minPrice.trim());
        }

        if (maxPrice.trim()) {
            nextParams.set('maxPrice', maxPrice.trim());
        }

        setSearchParams(nextParams, { replace: true });
    }, [maxPrice, minPrice, search, selectedCategory, setSearchParams, sortBy]);

    useEffect(() => {
        if (!pricePopoverOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!pricePopoverRef.current?.contains(event.target as Node)) {
                setPricePopoverOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setPricePopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [pricePopoverOpen]);

    const handleCategoryChange = (catId: string) => {
        setSelectedCategory(catId);
    };

    const togglePricePopover = () => {
        if (!pricePopoverOpen) {
            setDraftMinPrice(minPrice);
            setDraftMaxPrice(maxPrice);
        }

        setPricePopoverOpen((current) => !current);
    };

    const applyPriceFilter = () => {
        const nextMinPrice = parsePriceValue(draftMinPrice);
        const nextMaxPrice = parsePriceValue(draftMaxPrice);

        if (
            typeof nextMinPrice === 'number' &&
            typeof nextMaxPrice === 'number' &&
            nextMinPrice > nextMaxPrice
        ) {
            showToast('Minimum price cannot be greater than maximum price.', 'error');
            return;
        }

        setMinPrice(draftMinPrice.trim());
        setMaxPrice(draftMaxPrice.trim());
        setPricePopoverOpen(false);
    };

    const clearPriceFilter = () => {
        setDraftMinPrice('');
        setDraftMaxPrice('');
        setMinPrice('');
        setMaxPrice('');
        setPricePopoverOpen(false);
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSortBy('newest');
        setMinPrice('');
        setMaxPrice('');
        setDraftMinPrice('');
        setDraftMaxPrice('');
    };

    return (
        <div className="shop-page" id="shop-page">
            <div className="container">
                <div className="shop-header animate-fade-in-up">
                    <div>
                        <span className="label-md" style={{ color: 'var(--primary)' }}>
                            Collection
                        </span>
                        <h1 className="display-md">Shop</h1>
                    </div>
                    <p className="body-md shop-count">
                        {products.length} {products.length === 1 ? 'product' : 'products'}
                    </p>
                </div>

                <div className="shop-filters animate-fade-in-up" ref={pricePopoverRef}>
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search products..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            id="search-input"
                        />
                        {search && (
                            <button
                                type="button"
                                className="search-clear"
                                aria-label="Clear search"
                                onClick={() => setSearch('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="filter-controls">
                        <div className="filter-group">
                            <SlidersHorizontal size={16} />
                            <Select
                                value={selectedCategory || ALL_CATEGORIES_VALUE}
                                onValueChange={(value) =>
                                    handleCategoryChange(
                                        value === ALL_CATEGORIES_VALUE ? '' : value
                                    )
                                }
                            >
                                <SelectTrigger className="shop-select-trigger shop-select-trigger-wide" id="category-filter">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent className="shop-select-content">
                                    <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="price-filter-menu">
                            <button
                                type="button"
                                className="price-filter-trigger"
                                id="price-filter"
                                onClick={togglePricePopover}
                                aria-expanded={pricePopoverOpen}
                            >
                                <span className="price-filter-trigger-label">{priceFilterLabel}</span>
                                <ChevronDown
                                    size={18}
                                    className={`price-filter-trigger-icon ${pricePopoverOpen ? 'open' : ''}`}
                                />
                            </button>
                        </div>

                        <Select
                            value={sortBy}
                            onValueChange={(value) => setSortBy(value as SortOption)}
                        >
                            <SelectTrigger className="shop-select-trigger shop-select-trigger-wide" id="sort-filter">
                                <SelectValue placeholder="Sort products" />
                            </SelectTrigger>
                            <SelectContent className="shop-select-content">
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={clearFilters}
                                id="clear-filters"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {pricePopoverOpen && (
                        <div className="price-popover-inline animate-fade-in-up">
                            <div className="price-popover" role="dialog" aria-label="Price filter">
                                <div className="price-popover-header">
                                    <span className="label-md" style={{ color: 'var(--primary)' }}>
                                        Price Range
                                    </span>
                                    <p className="body-sm">Choose the minimum and maximum price you want to see.</p>
                                </div>

                                <div className="price-popover-fields">
                                    <label className="price-popover-field">
                                        <span className="price-popover-label">Min Price</span>
                                        <div className="price-popover-input-row">
                                            <span className="price-popover-prefix">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="price-popover-input"
                                                placeholder="0"
                                                value={draftMinPrice}
                                                onChange={(event) => setDraftMinPrice(event.target.value)}
                                            />
                                        </div>
                                    </label>

                                    <label className="price-popover-field">
                                        <span className="price-popover-label">Max Price</span>
                                        <div className="price-popover-input-row">
                                            <span className="price-popover-prefix">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                inputMode="decimal"
                                                className="price-popover-input"
                                                placeholder="1000"
                                                value={draftMaxPrice}
                                                onChange={(event) => setDraftMaxPrice(event.target.value)}
                                            />
                                        </div>
                                    </label>
                                </div>

                                <div className="price-popover-actions">
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={clearPriceFilter}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={applyPriceFilter}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {hasActiveFilters && (
                    <div className="active-filters animate-fade-in-up">
                        {deferredSearch && (
                            <span className="active-filter-pill">
                                Search: {deferredSearch}
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="active-filter-pill">
                                Category: {categories.find((cat) => cat.id === selectedCategory)?.name || 'Selected'}
                            </span>
                        )}
                        {(typeof parsedMinPrice === 'number' || typeof parsedMaxPrice === 'number') && (
                            <span className="active-filter-pill">
                                Price: {formatPriceLabel(parsedMinPrice, parsedMaxPrice)}
                            </span>
                        )}
                        {sortBy === 'price_asc' && (
                            <span className="active-filter-pill">Sorted: Price Low to High</span>
                        )}
                        {sortBy === 'price_desc' && (
                            <span className="active-filter-pill">Sorted: Price High to Low</span>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="product-grid">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className="skeleton"
                                style={{ aspectRatio: '1', borderRadius: 0 }}
                            />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="product-grid stagger">
                        {products.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p className="headline-sm">No products found</p>
                        <p className="body-sm">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
