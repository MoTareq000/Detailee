import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../contexts/useAuth';
import { getErrorMessage } from '../lib/errors';
import './AuthPages.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/');
        } catch (error) {
            setError(getErrorMessage(error, 'Invalid credentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" id="login-page">
            <div className="auth-container animate-fade-in-up">
                <div className="auth-header">
                    <BrandLogo size="lg" showText={false} center className="auth-brand-mark" />
                    <h1 className="headline-lg">Welcome Back</h1>
                    <p className="body-sm">Sign in to your Detailee account</p>
                </div>

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

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Link to="/forgot-password" className="auth-forgot-link">
                        Forgot password?
                    </Link>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                        id="submit-login"
                    >
                        {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch body-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="auth-switch-link">Create one</Link>
                </p>
            </div>
        </div>
    );
}
