import { getErrorMessage } from './errors';
import { supabase } from './supabase';

const CATEGORY_PICS_BUCKET = 'category_pics';

function sanitizeFileName(fileName: string) {
    const normalizedName = fileName.trim().toLowerCase();
    return normalizedName
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/^-+|-+$/g, '') || 'image';
}

function buildCategoryImagePath(categoryId: string, fileName: string) {
    const timestamp = Date.now();
    const safeFileName = sanitizeFileName(fileName);
    return `categories/${categoryId}/${timestamp}-${safeFileName}`;
}

function extractCategoryImagePath(publicUrl: string) {
    try {
        const url = new URL(publicUrl);
        const marker = `/storage/v1/object/public/${CATEGORY_PICS_BUCKET}/`;
        const markerIndex = url.pathname.indexOf(marker);
        if (markerIndex === -1) {
            return null;
        }
        return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    } catch {
        return null;
    }
}

export async function uploadCategoryImage(categoryId: string, file: File) {
    const path = buildCategoryImagePath(categoryId, file.name);
    const { error: uploadError } = await supabase.storage
        .from(CATEGORY_PICS_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
        });

    if (uploadError) {
        throw new Error(getErrorMessage(uploadError, 'Failed to upload category image'));
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(CATEGORY_PICS_BUCKET).getPublicUrl(path);

    return publicUrl;
}

export async function deleteCategoryImageByUrl(publicUrl: string) {
    const path = extractCategoryImagePath(publicUrl);
    if (!path) {
        return;
    }

    const { error } = await supabase.storage.from(CATEGORY_PICS_BUCKET).remove([path]);
    if (error) {
        throw new Error(getErrorMessage(error, 'Failed to remove category image'));
    }
}
