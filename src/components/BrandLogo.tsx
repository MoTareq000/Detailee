import './BrandLogo.css';

interface BrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    tagline?: string;
    center?: boolean;
}

export default function BrandLogo({
    className = '',
    size = 'md',
    showText = true,
    tagline,
    center = false,
}: BrandLogoProps) {
    const classes = [
        'brand-logo',
        `brand-logo-${size}`,
        showText ? '' : 'brand-logo-mark-only',
        center ? 'brand-logo-center' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes}>
            <div className="brand-logo-mark-shell">
                <img
                    src="/images/LOGO.png"
                    alt="Detailee logo"
                    className="brand-logo-mark"
                />
            </div>
            {showText && (
                <div className="brand-logo-copy">
                    <span className="brand-logo-name">Detailee</span>
                    {tagline && <span className="brand-logo-tagline">{tagline}</span>}
                </div>
            )}
        </div>
    );
}
