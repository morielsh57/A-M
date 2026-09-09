import type { IProduct, IProductVariant, ProductVariantId } from '../../product-page/product.types';
import type { IMainCategory, CategoryId } from '../../../shared/store/category/category.types';
import { PRODUCT_SIZE_OPTIONS } from '../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../app/routing';

export interface IProductPageColorOption {
  color: string;
  inStock: boolean;
  variant: IProductVariant;
  images: string[];
}

export interface IProductPageSizeOption {
  size: string;
  variant?: IProductVariant;
  inStock: boolean;
}

export const isVariantInStock = (variant?: IProductVariant) => (
  !!variant && variant.is_active !== false && (variant.in_stock ?? variant.quantity > 0)
);

export const getActiveVariants = (variants: IProductVariant[] = []) => (
  variants.filter((variant) => variant.is_active !== false)
);

export const getDefaultVariant = (variants: IProductVariant[]) => (
  variants.find((variant) => isVariantInStock(variant) && variant.images.length > 0)
  || variants.find((variant) => variant.images.length > 0)
  || variants.find((variant) => isVariantInStock(variant))
  || variants[0]
);

export const getVariantById = (
  variants: IProductVariant[],
  variantId?: ProductVariantId | string | null,
) => {
  if (!variantId) return undefined;

  return variants.find((variant) => String(variant.variant_id) === String(variantId));
};

export const getProductFallbackImages = (product?: IProduct) => (
  product?.images
    ?.filter((image) => image.is_active !== false && image.secure_url)
    .sort((first, second) => (first.display_order || 0) - (second.display_order || 0))
    .map((image) => image.secure_url) || []
);

export const getUniqueImages = (images: string[]) => (
  Array.from(new Set(images.filter(Boolean)))
);

export const getColorOptions = (
  variants: IProductVariant[],
  productFallbackImages: string[] = [],
): IProductPageColorOption[] => {
  const colors = new Map<string, IProductVariant[]>();

  variants.forEach((variant) => {
    const color = variant.color?.trim() || 'Default';
    colors.set(color, [...(colors.get(color) || []), variant]);
  });

  return Array.from(colors.entries()).map(([color, colorVariants]) => {
    const representativeVariant = getDefaultVariant(colorVariants) || colorVariants[0];
    const colorImages = getUniqueImages(colorVariants.flatMap((variant) => variant.images));

    return {
      color,
      inStock: colorVariants.some(isVariantInStock),
      variant: representativeVariant,
      images: colorImages.length > 0 ? colorImages : productFallbackImages,
    };
  });
};

export const getVariantsForColor = (
  variants: IProductVariant[],
  color?: string | null,
) => variants.filter((variant) => {
  const variantColor = variant.color?.trim() || 'Default';
  return variantColor === (color?.trim() || 'Default');
});

export const sortVariantsBySize = (variants: IProductVariant[]) => (
  [...variants].sort((first, second) => {
    const firstIndex = PRODUCT_SIZE_OPTIONS.indexOf(
      first.size as typeof PRODUCT_SIZE_OPTIONS[number],
    );
    const secondIndex = PRODUCT_SIZE_OPTIONS.indexOf(
      second.size as typeof PRODUCT_SIZE_OPTIONS[number],
    );

    if (firstIndex === -1 && secondIndex === -1) {
      return String(first.size || '').localeCompare(String(second.size || ''));
    }

    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;

    return firstIndex - secondIndex;
  })
);

export const getSizeOptionsForColor = (
  variants: IProductVariant[],
  color?: string | null,
): IProductPageSizeOption[] => {
  const colorVariants = getVariantsForColor(variants, color);

  return PRODUCT_SIZE_OPTIONS.map((size) => {
    const variant = colorVariants.find((item) => item.size === size);

    return {
      size,
      variant,
      inStock: isVariantInStock(variant),
    };
  });
};

export const getImagesForColor = (
  variants: IProductVariant[],
  color?: string | null,
  productFallbackImages: string[] = [],
) => {
  const colorImages = getUniqueImages(
    getVariantsForColor(variants, color).flatMap((variant) => variant.images),
  );

  if (colorImages.length > 0) return colorImages;

  const allVariantImages = getUniqueImages(variants.flatMap((variant) => variant.images));
  return allVariantImages.length > 0 ? allVariantImages : productFallbackImages;
};

export const getBestVariantForColor = (
  variants: IProductVariant[],
  color: string,
  preferredSize?: string | null,
) => {
  const colorVariants = getVariantsForColor(variants, color);

  return colorVariants.find((variant) => variant.size === preferredSize && isVariantInStock(variant))
    || colorVariants.find((variant) => variant.size === preferredSize)
    || getDefaultVariant(colorVariants);
};

export const getProductInformationItems = (information?: string | null) => (
  (information || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

export const getMainCategoryIdForProduct = (
  productCategoryId: CategoryId,
  mainCategories: IMainCategory[],
) => {
  const matchedMainCategory = mainCategories.find(
    (category) => String(category.category_id) === String(productCategoryId),
  );

  if (matchedMainCategory) {
    return matchedMainCategory.category_id;
  }

  return mainCategories.find((category) => (
    category.subcategories.some((subCategory) => (
      String(subCategory.category_id) === String(productCategoryId)
    ))
  ))?.category_id;
};

export const getProductCategoryBreadcrumbLinks = (
  productCategoryId: CategoryId,
  mainCategories: IMainCategory[],
) => {
  const mainCategory = mainCategories.find(
    (category) => String(category.category_id) === String(productCategoryId),
  );

  if (mainCategory) {
    return [{
      to: APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', mainCategory.category_id),
      name: mainCategory.main_category_name,
    }];
  }

  for (const parentCategory of mainCategories) {
    const subCategory = parentCategory.subcategories.find(
      (category) => String(category.category_id) === String(productCategoryId),
    );

    if (subCategory) {
      return [
        {
          to: APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', parentCategory.category_id),
          name: parentCategory.main_category_name,
        },
        {
          to: APP_ROUTING_PATHS.APP_CATEGORY_PAGE('sub', subCategory.category_id),
          name: subCategory.sub_category_name || subCategory.main_category_name,
        },
      ];
    }
  }

  return undefined;
};
