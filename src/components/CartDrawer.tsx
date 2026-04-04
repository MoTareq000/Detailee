import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/useCart';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/currency';
import './CartDrawer.css';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, total, removeItem, updateQuantity } = useCart();

    return (
        <>
            {/* Backdrop */}
            {isOpen && <div className="cart-backdrop" onClick={onClose} />}

            {/* Drawer */}
            <div className={`cart-drawer glass ${isOpen ? 'open' : ''}`} id="cart-drawer">
                <div className="cart-drawer-header">
                    <h3 className="headline-sm">Your Cart</h3>
                    <button className="btn-icon" onClick={onClose} aria-label="Close cart">
                        <X size={20} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="cart-empty">
                        <ShoppingBag size={48} strokeWidth={1} />
                        <p>Your cart is empty</p>
                        <Link to="/shop" className="btn btn-secondary btn-sm" onClick={onClose}>
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {items.map((item) => {
                                const imageUrl =
                                    item.product?.images?.[0]?.image_url || '/images/placeholder.svg';
                                return (
                                    <div key={item.id} className="cart-item" id={`cart-item-${item.id}`}>
                                        <img
                                            src={imageUrl}
                                            alt={item.product?.name}
                                            className="cart-item-image"
                                        />
                                        <div className="cart-item-info">
                                            <h4 className="body-sm">{item.product?.name}</h4>
                                            <span className="label-sm">
                                                {formatPrice(item.product?.price ?? 0)}
                                            </span>
                                            <div className="cart-item-qty">
                                                <button
                                                    className="btn-icon btn-sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    className="btn-icon btn-sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="cart-item-actions">
                                            <span className="cart-item-total">
                                                {formatPrice((item.product?.price ?? 0) * item.quantity)}
                                            </span>
                                            <button
                                                className="btn-icon btn-sm"
                                                onClick={() => removeItem(item.id)}
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="cart-footer">
                            <div className="cart-total">
                                <span className="body-md">Total</span>
                                <span className="headline-sm" style={{ color: 'var(--primary)' }}>
                                    {formatPrice(total)}
                                </span>
                            </div>
                            <Link
                                to="/checkout"
                                className="btn btn-primary btn-lg"
                                onClick={onClose}
                                style={{ width: '100%' }}
                                id="checkout-button"
                            >
                                Proceed to Checkout
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
