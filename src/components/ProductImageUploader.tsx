import type { ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import './ProductImageUploader.css';

export interface SelectedProductImageFile {
    id: string;
    file: File;
    previewUrl: string;
}

interface ProductImageUploaderProps {
    files: SelectedProductImageFile[];
    uploading?: boolean;
    onFilesSelected: (files: FileList | null) => void;
    onRemoveFile: (fileId: string) => void;
}

function formatFileSize(fileSize: number) {
    if (fileSize < 1024 * 1024) {
        return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
    }

    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductImageUploader({
    files,
    uploading = false,
    onFilesSelected,
    onRemoveFile,
}: ProductImageUploaderProps) {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(event.target.files);
        event.target.value = '';
    };

    return (
        <div className="product-image-uploader">
            <label className={`product-image-dropzone ${uploading ? 'is-disabled' : ''}`}>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                <ImagePlus size={20} />
                <span className="headline-sm">Upload Product Photos</span>
                <span className="body-sm">
                    Choose one or more images from your device.
                </span>
            </label>

            {uploading && (
                <p className="body-sm product-image-status">
                    Uploading selected images to Supabase Storage...
                </p>
            )}

            {files.length > 0 ? (
                <div className="product-image-preview-grid">
                    {files.map((item) => (
                        <div key={item.id} className="product-image-preview-card">
                            <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="product-image-preview"
                            />
                            <div className="product-image-preview-copy">
                                <span className="body-sm product-image-file-name">{item.file.name}</span>
                                <span className="label-sm">{formatFileSize(item.file.size)}</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => onRemoveFile(item.id)}
                                disabled={uploading}
                                aria-label={`Remove ${item.file.name}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="body-sm product-image-empty-state">
                    No images selected yet. You can upload multiple photos for each product.
                </p>
            )}
        </div>
    );
}
