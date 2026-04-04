import { useEffect, useState, type FormEvent } from 'react';
import { Package, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { getUserOrders, type Order } from '../lib/orders';
import { updateProfile } from '../lib/profiles';
import { showToast } from '../components/toastStore';
import { withTimeout } from '../lib/async';
import { formatPrice } from '../lib/currency';
import './DashboardPage.css';

export default function DashboardPage() {
    const { user, profile, refreshProfile } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) setFullName(profile.full_name || '');
    }, [profile]);

    useEffect(() => {
        async function load() {
            if (!user) return;
            try {
                const data = await withTimeout(
                    getUserOrders(user.id),
                    6000,
                    'Orders took too long to load'
                );
                setOrders(data);
            } catch (error) {
                console.error('Error loading orders:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [user]);

    const handleProfileUpdate = async (event: FormEvent) => {
        event.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await withTimeout(
                updateProfile(user.id, { full_name: fullName }),
                6000,
                'Profile update took too long'
            );
            await refreshProfile();
            showToast('Profile updated', 'success');
        } catch {
            showToast('Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const statusColor = (status: string) => {
        const map: Record<string, string> = {
            pending: 'badge-warning',
            paid: 'badge-primary',
            shipped: 'badge-primary',
            delivered: 'badge-success',
            cancelled: 'badge-error',
        };
        return map[status] || 'badge-primary';
    };

    return (
        <div className="dashboard-page" id="dashboard-page">
            <div className="container">
                <div className="dashboard-header animate-fade-in-up">
                    <div>
                        <span className="label-md" style={{ color: 'var(--primary)' }}>Account</span>
                        <h1 className="display-md">
                            Welcome, {profile?.full_name || 'Collector'}
                        </h1>
                    </div>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <Package size={16} />
                        Orders
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <UserIcon size={16} />
                        Profile
                    </button>
                </div>

                {activeTab === 'orders' && (
                    <div className="dashboard-content animate-fade-in">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="skeleton" style={{ height: '80px' }} />
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state">
                                <Package size={48} strokeWidth={1} />
                                <p className="headline-sm">No orders yet</p>
                                <p className="body-sm">Your order history will appear here.</p>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div key={order.id} className="order-card" id={`order-${order.id}`}>
                                        <div className="order-card-header">
                                            <div>
                                                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                                    Order #{order.id.slice(0, 8)}
                                                </span>
                                                <span className={`badge ${statusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <span className="headline-sm" style={{ color: 'var(--primary)' }}>
                                                {formatPrice(order.total_price)}
                                            </span>
                                        </div>
                                        <div className="order-card-meta">
                                            <span className="body-sm">
                                                <Clock size={14} />
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </span>
                                            <span className="body-sm">
                                                <MapPin size={14} />
                                                {order.items?.length || 0} items
                                            </span>
                                        </div>
                                        {order.items && order.items.length > 0 && (
                                            <div className="order-items-preview">
                                                {order.items.map((item) => (
                                                    <span key={item.id} className="body-sm">
                                                        {item.product?.name || 'Product'} x {item.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="dashboard-content animate-fade-in">
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="input-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    className="input-field"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ opacity: 0.5 }}
                                />
                            </div>

                            <div className="input-group">
                                <label>Role</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile?.role || 'user'}
                                    disabled
                                    style={{ opacity: 0.5 }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
