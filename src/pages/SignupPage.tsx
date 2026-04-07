import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../contexts/useAuth';
import { showToast } from '../components/toastStore';
import { getErrorMessage } from '../lib/errors';
import './AuthPages.css';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { requiresEmailConfirmation } = await signUp(email, password, fullName);

            if (requiresEmailConfirmation) {
                showToast('Check your email to confirm your account, then sign in.', 'info');
                navigate('/login');
                return;
            }

            navigate('/');
        } catch (error) {
            setError(getErrorMessage(error, 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            setError(getErrorMessage(error, 'Google signup failed'));
        }
    };

    return (
        <div className="auth-page" id="signup-page">
            <div className="auth-container animate-fade-in-up">
                <div className="auth-header">
                    <BrandLogo size="lg" showText={false} center className="auth-brand-mark" />
                    <h1 className="headline-lg">Create Account</h1>
                    <p className="body-sm">Join the Detailee collector community</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            className="input-field"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="input-field"
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                        id="submit-signup"
                    >
                        {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-divider">Or</div>

                <button
                    type="button"
                    className="btn btn-google btn-lg"
                    style={{ width: '100%' }}
                    onClick={handleGoogleSignup}
                >
                    <svg className="google-icon" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <p className="auth-switch body-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-switch-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
