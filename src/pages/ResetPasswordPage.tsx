import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { updatePassword } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';
import { showToast } from '../components/toastStore';
import './AuthPages.css';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
            await updatePassword(password);
            showToast('Password updated successfully', 'success');
            navigate('/login');
        } catch (error) {
            setError(getErrorMessage(error, 'Failed to update password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" id="reset-password-page">
            <div className="auth-container animate-fade-in-up">
                <div className="auth-header">
                    <BrandLogo size="lg" showText={false} center className="auth-brand-mark" />
                    <h1 className="headline-lg">New Password</h1>
                    <p className="body-sm">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="password">New Password</label>
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
                        <label htmlFor="confirmPassword">Confirm New Password</label>
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
                        style={{ width: '100%', marginTop: 'var(--space-4)' }}
                        disabled={loading}
                    >
                        {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
