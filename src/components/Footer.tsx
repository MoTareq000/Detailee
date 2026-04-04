import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './Footer.css';

const InstagramIcon = ({ size = 24, color = 'currentColor', ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

export default function Footer() {
    return (
        <footer className="footer" id="main-footer">
            <div className="footer-inner container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <BrandLogo className="footer-logo" tagline="Precision in Every Layer" />
                        <p className="body-sm">
                            Premium 3D-printed figures crafted with precision engineering and artistic vision.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4 className="label-md">Navigate</h4>
                        <Link to="/">Home</Link>
                        <Link to="/shop">Shop</Link>
                    </div>

                    <div className="footer-col">
                        <h4 className="label-md">Account</h4>
                        <Link to="/login">Sign In</Link>
                        <Link to="/signup">Create Account</Link>
                        <Link to="/dashboard">Dashboard</Link>
                    </div>

                    <div className="footer-col">
                        <h4 className="label-md">Connect</h4>
                        <div className="footer-social">
                            <a href="#" aria-label="Website" className="social-link">
                                <Globe size={18} />
                            </a>
                            <a href="https://www.instagram.com/detailee.official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                                <InstagramIcon size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div className="footer-bottom">
                        <span className="body-sm">
                            (c) {new Date().getFullYear()} Detailee. All rights reserved.
                        </span>
                        <span className="label-sm">Precision in Every Layer</span>
                    </div>
                    <div className="body-sm" style={{ marginTop: 'var(--space-6)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        Website created by <a href="https://www.linkedin.com/in/mohamad-tareq" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', transition: 'color var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-light)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--primary)'}>Mohamad Tareq</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
