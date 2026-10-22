import React from 'react';
import { createPortal } from 'react-dom';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { IAdminProductImage } from '../adminProducts.types';

interface AdminProductImageUploaderProps {
  existingImages: IAdminProductImage[];
  files: File[];
  onExistingImagesChange: (images: IAdminProductImage[]) => void;
  onFilesChange: (files: File[]) => void;
}

const AdminProductImageUploader: React.FC<AdminProductImageUploaderProps> = ({
  existingImages,
  files,
  onExistingImagesChange,
  onFilesChange,
}) => {
  const [selectedPreview, setSelectedPreview] = React.useState<{
    alt: string;
    src: string;
  }>();
  const filePreviews = React.useMemo(() => (
    files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
  ), [files]);

  React.useEffect(() => {
    if (!selectedPreview) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPreview(undefined);
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedPreview]);

  React.useEffect(() => () => {
    filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [filePreviews]);

  const confirmRemoveImage = (onConfirm: () => void) => {
    Modal.confirm({
      title: 'Remove image?',
      content: 'This image will be permanently deleted when you save the product.',
      okText: 'Remove image',
      cancelText: 'Keep image',
      okButtonProps: { danger: true },
      onOk: () => {
        setSelectedPreview(undefined);
        onConfirm();
      },
    });
  };

  const removeExistingImage = (imageId: IAdminProductImage['image_id']) => {
    confirmRemoveImage(() => {
      onExistingImagesChange(existingImages.filter((image) => image.image_id !== imageId));
    });
  };

  const removeFile = (fileIndex: number) => {
    confirmRemoveImage(() => {
      onFilesChange(files.filter((_, index) => index !== fileIndex));
    });
  };

  const imagePreviewModal = selectedPreview ? createPortal(
    <div
      className="admin-product-form__image-modal"
      role="presentation"
      onClick={() => setSelectedPreview(undefined)}
    >
      <div
        aria-label="Image preview"
        aria-modal="true"
        className="admin-product-form__image-modal-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close image preview"
          className="admin-product-form__image-modal-close"
          type="button"
          onClick={() => setSelectedPreview(undefined)}
        >
          <CloseOutlined />
        </button>
        <img
          alt={selectedPreview.alt}
          className="admin-product-form__image-modal-preview"
          src={selectedPreview.src}
        />
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="admin-product-form__image-uploader">
      {(existingImages.length > 0 || filePreviews.length > 0) && (
        <div className="admin-product-form__image-list">
          {existingImages.map((image) => (
            <figure
              className="admin-product-form__image-preview-frame"
              key={image.image_id}
            >
              <button
                aria-label="Open image preview"
                className="admin-product-form__image-preview-button"
                type="button"
                onClick={() => setSelectedPreview({
                  alt: image.alt_text || 'Product',
                  src: image.secure_url,
                })}
              >
                <img
                  alt={image.alt_text || 'Product'}
                  className="admin-product-form__image-preview"
                  src={image.secure_url}
                />
              </button>
              <button
                aria-label="Remove image"
                className="admin-product-form__image-remove-button"
                type="button"
                onClick={() => removeExistingImage(image.image_id)}
              >
                <CloseOutlined />
              </button>
            </figure>
          ))}
          {filePreviews.map((preview, index) => (
            <figure
              className="admin-product-form__image-preview-frame"
              key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}`}
            >
              <button
                aria-label={`Open ${preview.file.name} preview`}
                className="admin-product-form__image-preview-button"
                type="button"
                onClick={() => setSelectedPreview({
                  alt: preview.file.name,
                  src: preview.url,
                })}
              >
                <img
                  alt={preview.file.name}
                  className="admin-product-form__image-preview"
                  src={preview.url}
                />
              </button>
              <figcaption className="admin-product-form__image-preview-name">
                {preview.file.name}
              </figcaption>
              <button
                aria-label={`Remove ${preview.file.name}`}
                className="admin-product-form__image-remove-button"
                type="button"
                onClick={() => removeFile(index)}
              >
                <CloseOutlined />
              </button>
            </figure>
          ))}
        </div>
      )}

      <label className="admin-product-form__image-input-label">
        Add images
        <input
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          type="file"
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files || []);
            const newFiles = selectedFiles.filter((selectedFile) => !files.some((file) => (
              file.name === selectedFile.name
              && file.size === selectedFile.size
              && file.lastModified === selectedFile.lastModified
            )));

            if (newFiles.length) {
              onFilesChange([...files, ...newFiles]);
            }

            event.target.value = '';
          }}
        />
      </label>

      {imagePreviewModal}
    </div>
  );
};

export default AdminProductImageUploader;
