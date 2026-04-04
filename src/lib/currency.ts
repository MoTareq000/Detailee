/**
 * Standardizes currency formatting across the application.
 * Currently set to Egyptian Pounds (EGP).
 */
export function formatPrice(price: number): string {
    return `${price.toFixed(2)} EGP`;
}
