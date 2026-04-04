export const ADMIN_EMAIL = 'mohamad23012778@gmail.com';

export function isAuthorizedAdminEmail(email: string | null | undefined) {
    return (email ?? '').trim().toLowerCase() === ADMIN_EMAIL;
}
