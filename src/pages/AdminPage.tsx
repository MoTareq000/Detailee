import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Plus, Trash2, Edit3, Save, X, Package, ShoppingCart as CartIcon,
    Tag
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/interfaces-select';
import ProductImageUploader, {
    type SelectedProductImageFile,
} from '../components/ProductImageUploader';
import { getProducts, createProduct, updateProduct, deleteProduct, type Product } from '../lib/products';
import { getCategories, createCategory, type Category } from '../lib/categories';
import { getAllOrders, updateOrderStatus, type Order } from '../lib/orders';
import { uploadProductImageFiles } from '../lib/productImageUpload';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import { getErrorMessage } from '../lib/errors';
import { useIsAdmin } from '../hooks/useIsAdmin';
import './AdminPage.css';

type AdminTab = 'products' | 'orders' | 'categories';
const NO_CATEGORY_VALUE = 'no_category';

function formatOrderDate(createdAt: string) {
    return new Date(createdAt).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getOrderAddress(order: Order) {
    const buildingLabel = order.building?.trim() ? `Building ${order.building.trim()}` : null;

    return [order.street, buildingLabel, order.city]
        .filter(Boolean)
        .join(', ');
}

function getOrderItemCount(order: Order) {
    return order.items?.reduce((count, item) => count + item.quantity, 0) ?? 0;
}

export default function AdminPage() {
    const { isAdmin, checkingAdmin, user } = useIsAdmin();
    const [activeTab, setActiveTab] = useState<AdminTab>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Add product form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '', stock: '', category_id: '',
    });
    const [newProductImages, setNewProductImages] = useState<SelectedProductImageFile[]>([]);
    const [addingProduct, setAddingProduct] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const newProductImagesRef = useRef<SelectedProductImageFile[]>([]);

    // Edit product
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', stock: '', description: '' });

    // Add category
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [addingCategory, setAddingCategory] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [productsResult, categoriesResult, ordersResult] = await Promise.allSettled([
            withTimeout(getProducts(), 6000, 'Products took too long to load'),
            withTimeout(getCategories(), 6000, 'Categories took too long to load'),
            withTimeout(getAllOrders(), 6000, 'Orders took too long to load'),
        ]);

        if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value);
        } else {
            console.error('Error loading admin products:', productsResult.reason);
            setProducts([]);
        }

        if (categoriesResult.status === 'fulfilled') {
            setCategories(categoriesResult.value);
        } else {
            console.error('Error loading admin categories:', categoriesResult.reason);
            setCategories([]);
        }

        if (ordersResult.status === 'fulfilled') {
            setOrders(ordersResult.value);
        } else {
            console.error('Error loading admin orders:', ordersResult.reason);
            setOrders([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (!checkingAdmin && isAdmin) {
            void loadData();
        }
    }, [checkingAdmin, isAdmin]);

    useEffect(() => {
        newProductImagesRef.current = newProductImages;
    }, [newProductImages]);

    useEffect(() => {
        return () => {
            newProductImagesRef.current.forEach((image) => {
                URL.revokeObjectURL(image.previewUrl);
            });
        };
    }, []);

    const clearSelectedNewProductImages = () => {
        setNewProductImages((currentImages) => {
            currentImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
            return [];
        });
    };

    const handleNewProductFilesSelected = (files: FileList | null) => {
        if (!files?.length) {
            return;
        }

        const selectedFiles = Array.from(files);
        const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length !== selectedFiles.length) {
            showToast('Only image files can be selected.', 'error');
        }

        const mappedFiles = imageFiles.map((file, index) => ({
            id: `${Date.now()}-${file.lastModified}-${index}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setNewProductImages((currentImages) => [...currentImages, ...mappedFiles]);
    };

    const removeNewProductImage = (fileId: string) => {
        setNewProductImages((currentImages) => {
            const imageToRemove = currentImages.find((image) => image.id === fileId);

            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }

            return currentImages.filter((image) => image.id !== fileId);
        });
    };

    // Product CRUD
    const handleAddProduct = async (e: FormEvent) => {
        e.preventDefault();
        setAddingProduct(true);
        try {
            const prod = await createProduct({
                name: newProduct.name,
                description: newProduct.description || undefined,
                price: Number.parseFloat(newProduct.price),
                stock: Number.parseInt(newProduct.stock, 10),
                category_id: newProduct.category_id || undefined,
            });

            if (newProductImages.length > 0) {
                setUploadingImages(true);
                const { uploadedImages, failedUploads } = await uploadProductImageFiles(
                    prod.id,
                    newProductImages.map((image) => image.file)
                );

                if (failedUploads.length > 0) {
                    console.error('Product image upload failures:', failedUploads);
                    const uploadedCount = uploadedImages.length;
                    const firstFailureMessage = failedUploads[0]?.message ?? 'Image upload failed.';
                    showToast(
                        uploadedCount > 0
                            ? `Product created. ${uploadedCount} image(s) uploaded, ${failedUploads.length} failed. ${firstFailureMessage}`
                            : `Product created, but ${failedUploads.length} image(s) failed to upload. ${firstFailureMessage}`,
                        'error'
                    );
                } else {
                    showToast(`Product added with ${uploadedImages.length} image(s)`, 'success');
                }
            } else {
                showToast('Product added', 'success');
            }

            setNewProduct({ name: '', description: '', price: '', stock: '', category_id: '' });
            clearSelectedNewProductImages();
            setShowAddForm(false);
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to add product'), 'error');
        } finally {
            setUploadingImages(false);
            setAddingProduct(false);
        }
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm({
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            description: product.description || '',
        });
    };

    const handleSaveEdit = async (id: string) => {
        try {
            await updateProduct(id, {
                name: editForm.name,
                price: Number.parseFloat(editForm.price),
                stock: Number.parseInt(editForm.stock, 10),
                description: editForm.description,
            });
            showToast('Product updated', 'success');
            setEditingId(null);
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to update'), 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        try {
            await deleteProduct(id);
            showToast('Product deleted', 'success');
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to delete'), 'error');
        }
    };

    // Category CRUD
    const handleAddCategory = async (e: FormEvent) => {
        e.preventDefault();
        setAddingCategory(true);
        try {
            await createCategory(newCategory.name, newCategory.description || undefined);
            showToast('Category added', 'success');
            setNewCategory({ name: '', description: '' });
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to add category'), 'error');
        } finally {
            setAddingCategory(false);
        }
    };

    // Order status update
    const handleStatusChange = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrderStatus(orderId, status);
            showToast('Order status updated', 'success');
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to update status'), 'error');
        }
    };

    if (checkingAdmin) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page" id="admin-page">
            <div className="container">
                <div className="admin-header animate-fade-in-up">
                    <div>
                        <span className="label-md" style={{ color: 'var(--primary)' }}>Management</span>
                        <h1 className="display-md">Admin Panel</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`dashboard-tab ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        <Package size={16} /> Products ({products.length})
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <CartIcon size={16} /> Orders ({orders.length})
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <Tag size={16} /> Categories ({categories.length})
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: '60px' }} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Products Tab */}
                        {activeTab === 'products' && (
                            <div className="admin-content animate-fade-in">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    style={{ marginBottom: 'var(--space-6)' }}
                                >
                                    {showAddForm ? <X size={16} /> : <Plus size={16} />}
                                    {showAddForm ? 'Cancel' : 'Add Product'}
                                </button>

                                {showAddForm && (
                                    <form onSubmit={handleAddProduct} className="admin-add-form animate-fade-in-up">
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Name *</label>
                                                <input
                                                    className="input-field"
                                                    value={newProduct.name}
                                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Category</label>
                                                <Select
                                                    value={newProduct.category_id || NO_CATEGORY_VALUE}
                                                    onValueChange={(value) =>
                                                        setNewProduct({
                                                            ...newProduct,
                                                            category_id: value === NO_CATEGORY_VALUE ? '' : value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Choose a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                    <SelectItem value={NO_CATEGORY_VALUE}>None</SelectItem>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Price *</label>
                                                <input
                                                    className="input-field" type="number" step="0.01" min="0"
                                                    value={newProduct.price}
                                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Stock *</label>
                                                <input
                                                    className="input-field" type="number" min="0"
                                                    value={newProduct.stock}
                                                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <input
                                                className="input-field"
                                                value={newProduct.description}
                                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Product Photos</label>
                                            <ProductImageUploader
                                                files={newProductImages}
                                                uploading={addingProduct || uploadingImages}
                                                onFilesSelected={handleNewProductFilesSelected}
                                                onRemoveFile={removeNewProductImage}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={addingProduct || uploadingImages}
                                        >
                                            {uploadingImages
                                                ? 'Uploading Images...'
                                                : addingProduct
                                                    ? 'Creating Product...'
                                                    : 'Add Product'}
                                        </button>
                                    </form>
                                )}

                                <div className="admin-table">
                                    <div className="admin-table-header">
                                        <span>Product</span>
                                        <span>Price</span>
                                        <span>Stock</span>
                                        <span>Actions</span>
                                    </div>
                                    {products.map((product) => (
                                        <div key={product.id} className="admin-table-row" id={`admin-product-${product.id}`}>
                                            {editingId === product.id ? (
                                                <>
                                                    <input
                                                        className="input-field" style={{ fontSize: '0.85rem' }}
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                    <input
                                                        className="input-field" type="number" step="0.01"
                                                        style={{ fontSize: '0.85rem' }}
                                                        value={editForm.price}
                                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                    />
                                                    <input
                                                        className="input-field" type="number"
                                                        style={{ fontSize: '0.85rem' }}
                                                        value={editForm.stock}
                                                        onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                                                    />
                                                    <div className="admin-actions">
                                                        <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(product.id)}>
                                                            <Save size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="admin-product-info">
                                                        <img
                                                            src={product.images?.[0]?.image_url || '/images/placeholder.svg'}
                                                            alt={product.name}
                                                            className="admin-product-thumb"
                                                        />
                                                        <div className="admin-product-copy">
                                                            <span className="body-sm" style={{ color: 'var(--on-surface)' }}>
                                                                {product.name}
                                                            </span>
                                                            <span className="label-sm">
                                                                {product.images?.length ?? 0} photo{(product.images?.length ?? 0) === 1 ? '' : 's'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="label-sm">${product.price.toFixed(2)}</span>
                                                    <span className={`body-sm ${product.stock <= 0 ? 'error-text' : ''}`}>
                                                        {product.stock}
                                                    </span>
                                                    <div className="admin-actions">
                                                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(product)}>
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="admin-content animate-fade-in">
                                {orders.length === 0 ? (
                                    <div className="empty-state"><p className="headline-sm">No orders yet</p></div>
                                ) : (
                                    <div className="admin-table">
                                        <div className="admin-table-header admin-table-header-orders">
                                            <span>Order Details</span>
                                            <span>Items</span>
                                            <span>Status</span>
                                            <span>Summary</span>
                                        </div>
                                        {orders.map((order) => {
                                            const itemCount = getOrderItemCount(order);

                                            return (
                                                <div key={order.id} className="admin-table-row admin-table-row-orders">
                                                    <div className="admin-order-info">
                                                        <div className="admin-order-heading">
                                                            <span className="label-sm">#{order.id.slice(0, 8)}</span>
                                                            <span className="admin-order-date">
                                                                {formatOrderDate(order.created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="admin-order-details">
                                                            <span className="admin-order-detail">
                                                                <strong>Phone:</strong> {order.phone}
                                                            </span>
                                                            <span className="admin-order-detail">
                                                                <strong>Address:</strong> {getOrderAddress(order)}
                                                            </span>
                                                            {order.notes && (
                                                                <span className="admin-order-detail">
                                                                    <strong>Notes:</strong> {order.notes}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="admin-order-items">
                                                        <span className="admin-order-items-count">
                                                            {itemCount} item{itemCount === 1 ? '' : 's'}
                                                        </span>
                                                        {order.items?.length ? (
                                                            <div className="admin-order-item-list">
                                                                {order.items.map((item) => (
                                                                    <span key={item.id} className="admin-order-item">
                                                                        {item.product?.name ?? 'Product removed'} x{item.quantity}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="body-sm">No order items found</span>
                                                        )}
                                                    </div>
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(value) =>
                                                            handleStatusChange(order.id, value as Order['status'])
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full min-w-[140px]" size="sm">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="paid">Paid</SelectItem>
                                                            <SelectItem value="shipped">Shipped</SelectItem>
                                                            <SelectItem value="delivered">Delivered</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="admin-order-summary">
                                                        <span className="admin-order-total">
                                                            ${order.total_price.toFixed(2)}
                                                        </span>
                                                        <span className="body-sm">
                                                            Delivery to {order.city}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Categories Tab */}
                        {activeTab === 'categories' && (
                            <div className="admin-content animate-fade-in">
                                <form onSubmit={handleAddCategory} className="admin-add-form" style={{ marginBottom: 'var(--space-8)' }}>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Category Name *</label>
                                            <input
                                                className="input-field"
                                                value={newCategory.name}
                                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <input
                                                className="input-field"
                                                value={newCategory.description}
                                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={addingCategory}>
                                        <Plus size={16} />
                                        {addingCategory ? 'Adding...' : 'Add Category'}
                                    </button>
                                </form>

                                <div className="categories-list">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="category-item">
                                            <div>
                                                <span className="body-sm" style={{ color: 'var(--on-surface)', fontWeight: 500 }}>
                                                    {cat.name}
                                                </span>
                                                {cat.description && (
                                                    <span className="body-sm">{cat.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
