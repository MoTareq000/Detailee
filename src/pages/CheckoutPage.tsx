import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useCart } from '../contexts/useCart';
import { createOrder } from '../lib/orders';
import { showToast } from '../components/toastStore';
import { getErrorMessage } from '../lib/errors';
import { withTimeout } from '../lib/async';
import { formatPrice } from '../lib/currency';
import './CheckoutPage.css';

type CheckoutFormValues = {
    phone: string;
    city: string;
    street: string;
    building: string;
    notes: string;
};

type CheckoutField = keyof CheckoutFormValues;

export default function CheckoutPage() {
    const { user } = useAuth();
    const { items, total, clearAll } = useCart();
    const navigate = useNavigate();

    const [form, setForm] = useState<CheckoutFormValues>({
        phone: '',
        city: '',
        street: '',
        building: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const nextErrors: Partial<Record<CheckoutField, string>> = {};
        if (!form.phone.trim()) nextErrors.phone = 'Phone number is required';
        if (!form.city.trim()) nextErrors.city = 'City is required';
        if (!form.street.trim()) nextErrors.street = 'Street is required';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleChange = (field: CheckoutField) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { value } = event.target;
        setForm((current) => ({ ...current, [field]: value }));
        if (errors[field]) {
            setErrors((current) => ({ ...current, [field]: undefined }));
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validate() || !user) return;

        setLoading(true);
        try {
            const orderItems = items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.product?.price ?? 0,
            }));
            await withTimeout(
                createOrder({
                    userId: user.id,
                    items: orderItems,
                    totalPrice: total,
                    phone: form.phone.trim(),
                    city: form.city.trim(),
                    street: form.street.trim(),
                    building: form.building,
                    notes: form.notes,
                }),
                8000,
                'Checkout took too long'
            );
            await clearAll();
            showToast('Order placed successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            showToast(getErrorMessage(error, 'Failed to place order'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="checkout-page" id="checkout-page">
                <div className="container">
                    <div className="empty-state">
                        <p className="headline-sm">Your cart is empty</p>
                        <Link to="/shop" className="btn btn-primary">Browse Products</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page" id="checkout-page">
            <div className="container">
                <Link to="/shop" className="back-link animate-fade-in">
                    <ArrowLeft size={16} />
                    <span>Continue Shopping</span>
                </Link>

                <div className="checkout-grid">
                    <div className="checkout-form-section animate-fade-in-up">
                        <h1 className="headline-lg">Checkout</h1>
                        <p className="body-sm checkout-helper-copy">
                            Enter your delivery details below and we&apos;ll create your order with the
                            new structured shipping information.
                        </p>

                        <form onSubmit={handleSubmit} className="checkout-form">
                            <div className="checkout-form-block">
                                <h3 className="label-lg checkout-section-label">Delivery Information</h3>

                                <div className="input-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        className={`input-field ${errors.phone ? 'input-error' : ''}`}
                                        value={form.phone}
                                        onChange={handleChange('phone')}
                                        placeholder="+20 100 000 0000"
                                    />
                                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="city">City</label>
                                        <input
                                            id="city"
                                            type="text"
                                            className={`input-field ${errors.city ? 'input-error' : ''}`}
                                            value={form.city}
                                            onChange={handleChange('city')}
                                            placeholder="Cairo"
                                        />
                                        {errors.city && <span className="error-text">{errors.city}</span>}
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="street">Street</label>
                                        <input
                                            id="street"
                                            type="text"
                                            className={`input-field ${errors.street ? 'input-error' : ''}`}
                                            value={form.street}
                                            onChange={handleChange('street')}
                                            placeholder="Street name and area"
                                        />
                                        {errors.street && <span className="error-text">{errors.street}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="building">Building</label>
                                        <input
                                            id="building"
                                            type="text"
                                            className="input-field"
                                            value={form.building}
                                            onChange={handleChange('building')}
                                            placeholder="Building, floor, apartment"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="checkout-form-block">
                                <h3 className="label-lg checkout-section-label">Order Notes</h3>

                                <div className="input-group">
                                    <label htmlFor="notes">Notes</label>
                                    <textarea
                                        id="notes"
                                        className="checkout-textarea"
                                        value={form.notes}
                                        onChange={handleChange('notes')}
                                        placeholder="Delivery notes, landmarks, or any extra instructions"
                                        rows={5}
                                    />
                                </div>
                            </div>

                            <div className="checkout-submit-row">
                                <p className="body-sm checkout-submit-note">
                                    Your order will be created under {user?.email}.
                                </p>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={loading}
                                    style={{ width: '100%' }}
                                    id="place-order-button"
                                >
                                    {loading ? (
                                        <div className="spinner" style={{ width: 18, height: 18 }} />
                                    ) : (
                                        <>
                                            <CreditCard size={18} />
                                            Place Order - {formatPrice(total)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="checkout-summary animate-fade-in">
                        <div className="checkout-summary-card">
                            <h3 className="headline-sm">Order Summary</h3>
                            <div className="checkout-items">
                                {items.map((item) => (
                                    <div key={item.id} className="checkout-item">
                                        <img
                                            src={item.product?.images?.[0]?.image_url || '/images/placeholder.svg'}
                                            alt={item.product?.name}
                                            className="checkout-item-image"
                                        />
                                        <div className="checkout-item-info">
                                            <span className="body-sm" style={{ color: 'var(--on-surface)' }}>
                                                {item.product?.name}
                                            </span>
                                            <span className="label-sm">Qty: {item.quantity}</span>
                                        </div>
                                        <span className="body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
                                            {formatPrice((item.product?.price ?? 0) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="checkout-totals">
                                <div className="checkout-total-row">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                <div className="checkout-total-row">
                                    <span>Shipping</span>
                                    <span className="label-sm">Free</span>
                                </div>
                                <div className="checkout-total-row checkout-grand-total">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
