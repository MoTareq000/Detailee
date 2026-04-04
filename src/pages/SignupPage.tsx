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
    const { signUp } = useAuth();
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

                <p className="auth-switch body-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-switch-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
