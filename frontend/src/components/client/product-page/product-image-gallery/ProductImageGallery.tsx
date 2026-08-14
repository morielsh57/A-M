import React, { useEffect, useMemo, useState } from 'react';
import { AppCarousel } from '../../../../shared/components/app-carousel/AppCarousel';
import paletteColors from '../../../../shared/styles/colors.module.scss';
import type { IProduct, IProductVariant } from '../../../product-page/product.types';
import {
  getImagesForColor,
  getProductFallbackImages,
} from '../productPage.utils';
import './ProductImageGallery.scss';

interface ProductImageGalleryProps {
  product: IProduct;
  activeVariants: IProductVariant[];
  selectedVariant?: IProductVariant;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  activeVariants,
  selectedVariant,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const selectedColor = selectedVariant?.color?.trim() || 'Default';
  const productFallbackImages = useMemo(() => getProductFallbackImages(product), [product]);
  const images = useMemo(
    () => getImagesForColor(activeVariants, selectedColor, productFallbackImages),
    [activeVariants, productFallbackImages, selectedColor],
  );
  const imagesKey = images.join('|');

  useEffect(() => {
    setActiveSlide(0);
  }, [imagesKey]);

  if (images.length === 0) {
    return (
      <div className="product-page__image-placeholder">
        No product image yet
      </div>
    );
  }

  return (
    <div className="product-page__gallery">
      <div className="product-page__slide-count">
        {activeSlide + 1} of {images.length}
      </div>
      <AppCarousel
        slides={images}
        className="product-page__carousel"
        arrowsColor={paletteColors.purple6}
        infinite={images.length > 1}
        autoplay={false}
        activeSlide={activeSlide}
        onSlideChange={setActiveSlide}
      />

      {images.length > 1 && (
        <div className="product-page__thumbnail-list" aria-label={`${product.name} image thumbnails`}>
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              className={[
                'product-page__thumbnail',
                index === activeSlide ? 'product-page__thumbnail--active' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === activeSlide}
            >
              <img src={image} alt={`${product.name} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
