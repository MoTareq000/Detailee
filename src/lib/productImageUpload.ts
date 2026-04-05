import { getErrorMessage } from './errors';
import type { ProductImage } from './products';
import { publicSupabase, supabase } from './supabase';

const PRODUCT_PICS_BUCKET = 'product_pics';

function normalizeImageUploadMessage(message: string) {
    if (message.toLowerCase().includes('row-level security policy')) {
        return 'Supabase policy blocked image uploads. Allow INSERT on storage.objects and product_images for the admin account.';
    }

    return message;
}

export interface UploadedProductImagesResult {
    uploadedImages: ProductImage[];
    failedUploads: Array<{
        fileName: string;
        message: string;
    }>;
}

function sanitizeFileName(fileName: string) {
    const normalizedName = fileName.trim().toLowerCase();

    return normalizedName
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/^-+|-+$/g, '') || 'image';
}

function buildProductImagePath(productId: string, fileName: string, attempt: number) {
    const timestamp = Date.now() + attempt;
    const safeFileName = sanitizeFileName(fileName);
    return `products/${productId}/${timestamp}-${safeFileName}`;
}

async function uploadSingleProductImage(productId: string, file: File, color?: string) {
    let lastUploadError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const storagePath = buildProductImagePath(productId, file.name, attempt);

        const { error: uploadError } = await supabase.storage
            .from(PRODUCT_PICS_BUCKET)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || undefined,
            });

        if (uploadError) {
            lastUploadError = uploadError;
            const uploadMessage = normalizeImageUploadMessage(
                getErrorMessage(uploadError, 'Failed to upload image')
            );
            const isDuplicateName =
                uploadMessage.toLowerCase().includes('duplicate') ||
                uploadMessage.toLowerCase().includes('already exists');

            if (isDuplicateName && attempt < 2) {
                continue;
            }

            throw uploadError;
        }

        const {
            data: { publicUrl },
        } = publicSupabase.storage.from(PRODUCT_PICS_BUCKET).getPublicUrl(storagePath);

        const { data, error: insertError } = await supabase
            .from('product_images')
            .insert({
                product_id: productId,
                image_url: publicUrl,
                color: color || null,
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return data as ProductImage;
    }

    throw lastUploadError instanceof Error
        ? lastUploadError
        : new Error('Failed to upload image');
}

export async function uploadProductImageFiles(
    productId: string,
    files: Array<{ file: File; color?: string }>
): Promise<UploadedProductImagesResult> {
    const uploadedImages: ProductImage[] = [];
    const failedUploads: UploadedProductImagesResult['failedUploads'] = [];

    for (const item of files) {
        try {
            const uploadedImage = await uploadSingleProductImage(productId, item.file, item.color);
            uploadedImages.push(uploadedImage);
        } catch (error) {
            failedUploads.push({
                fileName: item.file.name,
                message: normalizeImageUploadMessage(
                    getErrorMessage(error, 'Failed to upload image')
                ),
            });
        }
    }

    return {
        uploadedImages,
        failedUploads,
    };
}
