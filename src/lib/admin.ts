export const ADMIN_EMAILS = [
    'mohamad23012778@gmail.com',
    'mostafamarzuk5@gmail.com'
];

export function isAuthorizedAdminEmail(email: string | null | undefined) {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    return ADMIN_EMAILS.includes(normalizedEmail);
}
