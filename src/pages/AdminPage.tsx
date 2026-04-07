import React, { useEffect, useState, type FormEvent } from 'react';
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
import {
    getProducts, createProduct, updateProduct, deleteProduct, type Product,
    createProductVariant, deleteProductVariant
} from '../lib/products';
import { getCategories, createCategory, type Category } from '../lib/categories';
import { getAllOrders, updateOrderStatus, type Order, deleteOrder } from '../lib/orders';
import { uploadProductImageFiles } from '../lib/productImageUpload';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import { getErrorMessage } from '../lib/errors';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { formatPrice } from '../lib/currency';
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
    const [newProductVariants, setNewProductVariants] = useState<{ size: string; color: string; price: string; stock: string }[]>([]);
    const [newProductImages, setNewProductImages] = useState<SelectedProductImageFile[]>([]);
    const [addingProduct, setAddingProduct] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Edit product
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', stock: '', description: '' });

    // Variant Manager (for existing products)
    const [managingVariantsId, setManagingVariantsId] = useState<string | null>(null);
    const [newVariantEdit, setNewVariantEdit] = useState({ size: '', color: '', price: '', stock: '10' });
    const [addingVariant, setAddingVariant] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsResult, categoriesResult, ordersResult] = await Promise.allSettled([
                withTimeout(getProducts(), 8000, 'Products took too long to load'),
                getCategories(),
                getAllOrders()
            ]);

            if (productsResult.status === 'fulfilled') setProducts(productsResult.value);
            if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value);
            if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) void loadData();
    }, [isAdmin]);

    const handleNewProductFilesSelected = (files: FileList | null) => {
        if (!files) return;
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
            if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
            return currentImages.filter((image) => image.id !== fileId);
        });
    };

    const handleImageColorChange = (fileId: string, color: string) => {
        setNewProductImages(prev => prev.map(img => 
            img.id === fileId ? { ...img, color } : img
        ));
    };

    const clearSelectedNewProductImages = () => {
        newProductImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setNewProductImages([]);
    };

    // Product CRUD
    const handleAddProduct = async (e: FormEvent) => {
        e.preventDefault();
        setAddingProduct(true);
        let createdProductId: string | null = null;
        
        try {
            const mainPrice = Number.parseFloat(newProduct.price);
            const mainStock = Number.parseInt(newProduct.stock, 10);
            
            if (Number.isNaN(mainPrice) || Number.isNaN(mainStock)) {
                throw new Error('Please enter a valid price and stock.');
            }

            const variantsToCreate = newProductVariants.length > 0 
                ? newProductVariants 
                : [{ size: 'Default', color: 'Default', price: newProduct.price, stock: newProduct.stock }];

            for (const v of variantsToCreate) {
                if (Number.isNaN(Number.parseFloat(v.price)) || Number.isNaN(Number.parseInt(v.stock, 10))) {
                    throw new Error(`Variant "${v.size} / ${v.color}" has an invalid price or stock.`);
                }
            }

            const prod = await createProduct({
                name: newProduct.name,
                description: newProduct.description || undefined,
                price: mainPrice,
                stock: mainStock,
                category_id: newProduct.category_id || undefined,
            });
            createdProductId = prod.id;

            for (const v of variantsToCreate) {
                await createProductVariant({
                    product_id: prod.id,
                    size: v.size || 'Default',
                    color: v.color || 'Default',
                    price: Number.parseFloat(v.price),
                    stock: Number.parseInt(v.stock, 10)
                });
            }

            if (newProductImages.length > 0) {
                setUploadingImages(true);
                const result = await uploadProductImageFiles(
                    prod.id, 
                    newProductImages.map(img => ({ file: img.file, color: img.color }))
                );

                if (result.failedUploads.length > 0) {
                    const firstError = result.failedUploads[0].message;
                    const errorCount = result.failedUploads.length;
                    throw new Error(`Failed to upload ${errorCount} image(s): ${firstError}`);
                }
            }

            showToast('Product added successfully', 'success');
            setNewProduct({ name: '', description: '', price: '', stock: '', category_id: '' });
            setNewProductVariants([]);
            clearSelectedNewProductImages();
            setShowAddForm(false);
            await loadData();
        } catch (error) {
            console.error('Product Creation Error:', error);
            if (createdProductId) {
                try { await deleteProduct(createdProductId); } catch (e) { console.error('Cleanup failed:', e); }
            }
            // Show the actual error message from Supabase/Postgrest
            const msg = error instanceof Error ? error.message : 'Failed to add product';
            showToast(msg, 'error');
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

    // Variant Manager Logic
    const handleAddVariantToExisting = async (productId: string) => {
        if (!newVariantEdit.size || !newVariantEdit.color || !newVariantEdit.price) {
            showToast('Please fill size, color and price', 'error');
            return;
        }
        setAddingVariant(true);
        try {
            await createProductVariant({
                product_id: productId,
                size: newVariantEdit.size,
                color: newVariantEdit.color,
                price: Number.parseFloat(newVariantEdit.price),
                stock: Number.parseInt(newVariantEdit.stock, 10)
            });
            showToast('Variant added', 'success');
            setNewVariantEdit({ size: '', color: '', price: '', stock: '10' });
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to add variant'), 'error');
        } finally {
            setAddingVariant(false);
        }
    };

    const handleDeleteVariant = async (variantId: string) => {
        if (!confirm('Delete this variant?')) return;
        try {
            await deleteProductVariant(variantId);
            showToast('Variant deleted', 'success');
            await loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to delete variant'), 'error');
        }
    };

    const addVariantToNewProduct = () => {
        setNewProductVariants([...newProductVariants, { size: '', color: '', price: newProduct.price, stock: '10' }]);
    };

    const removeVariantFromNewProduct = (index: number) => {
        setNewProductVariants(newProductVariants.filter((_, i) => i !== index));
    };

    const updateVariantInNewProduct = (index: number, field: string, value: string) => {
        const updated = [...newProductVariants];
        updated[index] = { ...updated[index], [field]: value };
        setNewProductVariants(updated);
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

    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    // Order status
    const handleStatusChange = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrderStatus(orderId, status);
            showToast('Order status updated', 'success');
            await loadData();
        } catch {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await deleteOrder(orderId);
            showToast('Order deleted', 'success');
            await loadData();
        } catch {
            showToast('Failed to delete order', 'error');
        }
    };

    if (checkingAdmin) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;
    }
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;

    return (
        <div className="admin-page" id="admin-page">
            <div className="container">
                <div className="admin-header animate-fade-in-up">
                    <div>
                        <span className="label-md" style={{ color: 'var(--primary)' }}>Management</span>
                        <h1 className="display-md">Admin Panel</h1>
                    </div>
                </div>

                <div className="admin-tabs">
                    <button className={`dashboard-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <Package size={16} /> Products ({products.length})
                    </button>
                    <button className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <CartIcon size={16} /> Orders ({orders.length})
                    </button>
                    <button className={`dashboard-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                        <Tag size={16} /> Categories ({categories.length})
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
                    </div>
                ) : (
                    <>
                        {activeTab === 'products' && (
                            <div className="admin-content animate-fade-in">
                                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: 'var(--space-6)' }}>
                                    {showAddForm ? <X size={16} /> : <Plus size={16} />}
                                    {showAddForm ? 'Cancel' : 'Add Product'}
                                </button>

                                {showAddForm && (
                                    <form onSubmit={handleAddProduct} className="admin-add-form animate-fade-in-up">
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Name *</label>
                                                <input className="input-field" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
                                            </div>
                                            <div className="input-group">
                                                <label>Category</label>
                                                <Select value={newProduct.category_id || NO_CATEGORY_VALUE} onValueChange={(v) => setNewProduct({...newProduct, category_id: v === NO_CATEGORY_VALUE ? '' : v})}>
                                                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={NO_CATEGORY_VALUE}>None</SelectItem>
                                                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Base Price *</label>
                                                <input className="input-field" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                                            </div>
                                            <div className="input-group">
                                                <label>Base Stock *</label>
                                                <input className="input-field" type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} required />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <input className="input-field" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                                        </div>

                                        <div className="variants-section">
                                            <div className="variants-header">
                                                <h3 className="label-lg">Product Variants</h3>
                                                <button type="button" className="btn btn-sm btn-ghost" onClick={addVariantToNewProduct}><Plus size={14} /> Add Variant</button>
                                            </div>
                                            {newProductVariants.length === 0 ? (
                                                <p className="body-sm" style={{ opacity: 0.7 }}>No variants added. Base price/stock will be used.</p>
                                            ) : (
                                                <div className="variant-list">
                                                    {newProductVariants.map((v, i) => (
                                                        <div key={i} className="variant-item">
                                                            <input className="input-field" placeholder="Size" value={v.size} onChange={(e) => updateVariantInNewProduct(i, 'size', e.target.value)} required />
                                                            <input className="input-field" placeholder="Color" value={v.color} onChange={(e) => updateVariantInNewProduct(i, 'color', e.target.value)} required />
                                                            <input className="input-field" type="number" placeholder="Price" value={v.price} onChange={(e) => updateVariantInNewProduct(i, 'price', e.target.value)} required />
                                                            <input className="input-field" type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariantInNewProduct(i, 'stock', e.target.value)} required />
                                                            <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeVariantFromNewProduct(i)}><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="input-group">
                                            <label>Product Photos</label>
                                            <ProductImageUploader 
                                                files={newProductImages} 
                                                uploading={addingProduct || uploadingImages} 
                                                onFilesSelected={handleNewProductFilesSelected} 
                                                onRemoveFile={removeNewProductImage}
                                                availableColors={Array.from(new Set(newProductVariants.map(v => v.color).filter(Boolean)))}
                                                onColorChange={handleImageColorChange}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" disabled={addingProduct || uploadingImages}>
                                            {addingProduct ? 'Creating...' : 'Add Product'}
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
                                        <React.Fragment key={product.id}>
                                            <div className="admin-table-row">
                                                {editingId === product.id ? (
                                                    <>
                                                        <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                                                        <input className="input-field" type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} />
                                                        <input className="input-field" type="number" value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} />
                                                        <div className="admin-actions">
                                                            <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(product.id)}><Save size={14} /></button>
                                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}><X size={14} /></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="admin-product-info">
                                                            <img src={product.images?.[0]?.image_url || '/images/placeholder.svg'} alt={product.name} className="admin-product-thumb" />
                                                            <div className="admin-product-copy">
                                                                <span className="body-sm" style={{ color: 'var(--on-surface)', fontWeight: 500 }}>{product.name}</span>
                                                                <div className="admin-product-variants">
                                                                    {(product.variants || []).slice(0, 3).map(v => (
                                                                        <span key={v.id} className="variant-info-tag">{v.size} / {v.color}</span>
                                                                    ))}
                                                                    {(product.variants?.length ?? 0) > 3 && <span className="variant-info-tag">...</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="label-sm">{formatPrice(product.price)}</span>
                                                        <span className={`body-sm ${product.stock <= 0 ? 'error-text' : ''}`}>{product.stock}</span>
                                                        <div className="admin-actions">
                                                            <button className={`btn btn-sm ${managingVariantsId === product.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setManagingVariantsId(managingVariantsId === product.id ? null : product.id)} title="Variants"><Package size={14} /></button>
                                                            <button className="btn btn-sm btn-ghost" onClick={() => startEdit(product)}><Edit3 size={14} /></button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {managingVariantsId === product.id && (
                                                <div className="variant-manager-box animate-fade-in-up">
                                                    <div className="variant-manager-header">
                                                        <h4 className="label-sm">Manage Variants: {product.name}</h4>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => setManagingVariantsId(null)}><X size={14} /></button>
                                                    </div>
                                                    <div className="variant-manager-list">
                                                        {(product.variants || []).map(v => (
                                                            <div key={v.id} className="variant-manager-item">
                                                                <span>{v.size} / {v.color} - {formatPrice(v.price)} ({v.stock})</span>
                                                                <button className="btn btn-xs btn-ghost btn-danger" onClick={() => handleDeleteVariant(v.id)}><Trash2 size={12} /></button>
                                                            </div>
                                                        ))}
                                                        <div className="variant-manager-add">
                                                            <input className="input-field input-sm" placeholder="Size" value={newVariantEdit.size} onChange={e => setNewVariantEdit({...newVariantEdit, size: e.target.value})} />
                                                            <input className="input-field input-sm" placeholder="Color" value={newVariantEdit.color} onChange={e => setNewVariantEdit({...newVariantEdit, color: e.target.value})} />
                                                            <input className="input-field input-sm" type="number" placeholder="Price" value={newVariantEdit.price} onChange={e => setNewVariantEdit({...newVariantEdit, price: e.target.value})} />
                                                            <input className="input-field input-sm" type="number" placeholder="Stock" value={newVariantEdit.stock} onChange={e => setNewVariantEdit({...newVariantEdit, stock: e.target.value})} />
                                                            <button className="btn btn-sm btn-primary" onClick={() => handleAddVariantToExisting(product.id)} disabled={addingVariant}>{addingVariant ? '...' : <Plus size={14} />}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="admin-content animate-fade-in">
                                {orders.length === 0 ? <div className="empty-state"><p className="headline-sm">No orders yet</p></div> : (
                                    <div className="admin-table">
                                        <div className="admin-table-header admin-table-header-orders"><span>Order Details</span><span>Items</span><span>Status</span><span>Summary</span></div>
                                        {orders.map(order => (
                                            <div key={order.id} className="admin-table-row admin-table-row-orders">
                                                <div className="admin-order-info">
                                                    <div className="admin-order-heading"><span className="label-sm">#{order.id.slice(0,8)}</span><span className="admin-order-date">{formatOrderDate(order.created_at)}</span></div>
                                                    <div className="admin-order-details">
                                                        <span className="admin-order-detail"><strong>Phone:</strong> {order.phone}</span>
                                                        <span className="admin-order-detail"><strong>Address:</strong> {getOrderAddress(order)}</span>
                                                    </div>
                                                </div>
                                                <div className="admin-order-items">
                                                    <span className="admin-order-items-count">{getOrderItemCount(order)} items</span>
                                                    <div className="admin-order-item-list">
                                                        {order.items?.map(it => (
                                                            <div key={it.id} className="admin-order-item">
                                                                <span style={{ fontWeight: 500 }}>{it.product?.name}</span>
                                                                {(it.size || it.color) && (
                                                                    <span className="admin-order-item-variants">
                                                                        ({it.size || 'N/A'} / {it.color || 'N/A'})
                                                                    </span>
                                                                )}
                                                                {it.custom_size_text && (
                                                                    <span className="admin-order-item-custom">
                                                                        [Custom: {it.custom_size_text}]
                                                                    </span>
                                                                )}
                                                                <span className="admin-order-item-qty">x{it.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="admin-order-actions">
                                                    <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v as Order['status'])}>
                                                        <SelectTrigger className="admin-status-trigger"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <button 
                                                        className="btn btn-sm btn-danger btn-icon" 
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="admin-order-summary">
                                                    <span className="admin-order-total">{formatPrice(order.total_price)}</span>
                                                    <span className="body-sm">{order.city}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="admin-content animate-fade-in">
                                <form onSubmit={handleAddCategory} className="admin-add-form" style={{ marginBottom: 'var(--space-8)' }}>
                                    <div className="form-row">
                                        <div className="input-group"><label>Category Name *</label><input className="input-field" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name:e.target.value})} required /></div>
                                        <div className="input-group"><label>Description</label><input className="input-field" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description:e.target.value})} /></div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={addingCategory}><Plus size={16} /> {addingCategory ? 'Adding...' : 'Add'}</button>
                                </form>
                                <div className="categories-list">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="category-item">
                                            <div><span className="body-sm" style={{ fontWeight: 500 }}>{cat.name}</span>{cat.description && <span className="body-sm">{cat.description}</span>}</div>
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
