import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { resetPassword } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';
import './AuthPages.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await resetPassword(email);
            setSent(true);
        } catch (error) {
            setError(getErrorMessage(error, 'Failed to send reset email'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" id="forgot-password-page">
            <div className="auth-container animate-fade-in-up">
                <div className="auth-header">
                    <BrandLogo size="lg" showText={false} center className="auth-brand-mark" />
                    <h1 className="headline-lg">Reset Password</h1>
                    <p className="body-sm">Enter your email to receive a reset link</p>
                </div>

                {sent ? (
                    <div className="auth-success">
                        <p className="body-md">Check your email for a password reset link.</p>
                        <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-6)' }}>
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}

                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <p className="auth-switch body-sm">
                    Remember your password?{' '}
                    <Link to="/login" className="auth-switch-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
