import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useCart } from '../contexts/useCart';
import { useIsAdmin } from '../hooks/useIsAdmin';
import BrandLogo from './BrandLogo';
import { showToast } from './toastStore';
import './Navbar.css';

export default function Navbar({ onCartClick }: { onCartClick: () => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const { isAdmin } = useIsAdmin();
    const { itemCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/shop', label: 'Shop' },
    ];

    const handleSignOut = async () => {
        try {
            await signOut();
            setProfileOpen(false);
            navigate('/');
        } catch {
            showToast('Unable to sign out cleanly. Local session was cleared.', 'info');
            setProfileOpen(false);
            navigate('/');
        }
    };

    return (
        <nav className="navbar glass" id="main-navbar">
            <div className="navbar-inner container">
                {/* Logo */}
                <Link to="/" className="navbar-logo" id="navbar-logo">
                    <BrandLogo size="sm" tagline="Digital Atelier" />
                </Link>

                {/* Desktop Nav Links */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="navbar-actions">
                    {/* Cart Button */}
                    <button
                        className="navbar-cart btn-icon"
                        onClick={onCartClick}
                        id="cart-button"
                        aria-label="Open cart"
                    >
                        <ShoppingCart size={20} />
                        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                    </button>

                    {/* Auth / Profile */}
                    {user ? (
                        <div className="profile-menu-wrapper">
                            <button
                                className="navbar-avatar btn-icon"
                                onClick={() => setProfileOpen(!profileOpen)}
                                id="profile-button"
                            >
                                <User size={20} />
                            </button>
                            {profileOpen && (
                                <div className="profile-dropdown glass" id="profile-dropdown">
                                    <div className="profile-dropdown-header">
                                        <span className="body-sm">{profile?.full_name || user.email}</span>
                                        <span className="label-sm">{profile?.role}</span>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="profile-dropdown-item"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="profile-dropdown-item"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <LayoutDashboard size={16} />
                                            Admin Panel
                                        </Link>
                                    )}
                                    <button className="profile-dropdown-item" onClick={handleSignOut}>
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm" id="login-button">
                            Sign In
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="navbar-hamburger btn-icon"
                        onClick={() => setMenuOpen(!menuOpen)}
                        id="mobile-menu-button"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mobile-menu glass" id="mobile-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`mobile-menu-link ${location.pathname === link.to ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!user && (
                        <Link
                            to="/login"
                            className="mobile-menu-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
