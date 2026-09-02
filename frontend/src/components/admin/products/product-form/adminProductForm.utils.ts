import type { IAppSelectOption } from '../../../../shared/components/app-select/AppSelect';
import type { IAPIError } from '../../../../shared/api/models';
import type { IMainCategory } from '../../../../shared/store/category/category.types';
import type { CategoryId, IProductVariant, ProductId } from '../../../product-page/product.types';
import type {
  IAdminProductDetail,
  IAdminProductImage,
  IAdminProductListItem,
  IAdminProductVariantWriteRequest,
  IAdminProductWriteRequest,
} from '../adminProducts.types';
import { ADMIN_PRODUCT_NEW_OPTION_VALUE } from './adminProductForm.constants';
import type {
  AdminProductBaseFormValues,
  AdminProductSelectorValue,
  AdminProductVariantFormRow,
  AdminProductVariantRowError,
} from './adminProductForm.types';

export const createEmptyProductBaseValues = (
  defaultMainCategoryId?: CategoryId,
): AdminProductBaseFormValues => ({
  catalog_number: '',
  name: '',
  description: '',
  information: '',
  price: '',
  tags: '',
  fabric: '',
  main_category_id: defaultMainCategoryId || null,
  sub_category_id: null,
  supplier_id: null,
  is_active: true,
});

export const createEmptyVariantRow = (): AdminProductVariantFormRow => ({
  color: '',
  existingImages: [],
  files: [],
  is_active: true,
  localId: `${Date.now()}-${Math.random()}`,
  quantity: '0',
  size: '',
});

export const getCategorySelectionFromProduct = (
  categoryId: CategoryId | null | undefined,
  mainCategories: IMainCategory[],
) => {
  if (!categoryId) {
    return { mainCategoryId: null, subCategoryId: null };
  }

  const mainCategory = mainCategories.find((category) => (
    String(category.category_id) === String(categoryId)
  ));

  if (mainCategory) {
    return { mainCategoryId: mainCategory.category_id, subCategoryId: null };
  }

  for (const category of mainCategories) {
    const subCategory = category.subcategories.find((item) => (
      String(item.category_id) === String(categoryId)
    ));

    if (subCategory) {
      return {
        mainCategoryId: category.category_id,
        subCategoryId: subCategory.category_id,
      };
    }
  }

  return { mainCategoryId: null, subCategoryId: categoryId };
};

export const mapProductToBaseValues = (
  product: IAdminProductDetail,
  mainCategories: IMainCategory[],
): AdminProductBaseFormValues => {
  const { mainCategoryId, subCategoryId } = getCategorySelectionFromProduct(
    product.category_id,
    mainCategories,
  );

  return {
    catalog_number: product.catalog_number || '',
    name: product.name || '',
    description: product.description || '',
    information: product.information || '',
    price: String(product.price ?? ''),
    tags: product.tags || '',
    fabric: product.fabric || '',
    main_category_id: mainCategoryId,
    sub_category_id: subCategoryId,
    supplier_id: product.supplier_id || null,
    is_active: product.is_active !== false,
  };
};

const getVariantImages = (
  variant: IProductVariant,
  productImages: IAdminProductImage[] = [],
) => productImages.filter((image) => (
  String(image.variant_id || '') === String(variant.variant_id)
));

export const mapProductToVariantRows = (
  product: IAdminProductDetail,
): AdminProductVariantFormRow[] => (
  product.variants.length
    ? product.variants.map((variant) => ({
      color: variant.color || '',
      existingImages: getVariantImages(variant, product.images),
      files: [],
      is_active: variant.is_active !== false,
      localId: String(variant.variant_id),
      quantity: String(variant.quantity ?? 0),
      size: variant.size || '',
      variant_id: variant.variant_id,
    }))
    : [createEmptyVariantRow()]
);

export const getProductSelectorOptions = (
  products: IAdminProductListItem[],
): IAppSelectOption[] => [
  {
    value: ADMIN_PRODUCT_NEW_OPTION_VALUE,
    label: 'New product',
    subtitle: 'Create a new base product with variants',
    searchLabel: 'new product',
  },
  ...products.map((product) => ({
    value: product.product_id,
    label: product.name,
    subtitle: product.catalog_number,
    searchLabel: `${product.name} ${product.catalog_number}`,
  })),
];

export const getMainCategoryOptions = (mainCategories: IMainCategory[]): IAppSelectOption[] => (
  mainCategories.map((category) => ({
    value: category.category_id,
    label: category.main_category_name,
  }))
);

export const getSubCategoryOptions = (
  mainCategories: IMainCategory[],
  mainCategoryId: CategoryId | null,
): IAppSelectOption[] => {
  const mainCategory = mainCategories.find((category) => (
    String(category.category_id) === String(mainCategoryId)
  ));

  return mainCategory?.subcategories.map((category) => ({
    value: category.category_id,
    label: category.sub_category_name || category.main_category_name,
  })) || [];
};

export const getBaseProductPayload = (
  values: AdminProductBaseFormValues,
  includeSupplier = false,
): IAdminProductWriteRequest => ({
  catalog_number: values.catalog_number.trim(),
  name: values.name.trim(),
  description: values.description.trim() || null,
  information: values.information.trim() || null,
  price: values.price,
  tags: values.tags.trim() || null,
  fabric: values.fabric.trim() || null,
  category_id: values.main_category_id || '',
  ...(includeSupplier ? { supplier_id: values.supplier_id || null } : {}),
  is_active: values.is_active,
});

export const getVariantPayload = (
  row: AdminProductVariantFormRow,
  imageIds?: Array<string | number>,
): IAdminProductVariantWriteRequest => ({
  color: row.color.trim() || null,
  size: row.size || null,
  quantity: Number(row.quantity || 0),
  is_active: row.is_active,
  ...(imageIds ? { image_ids: imageIds } : {}),
});

export const getExistingImageIds = (row: AdminProductVariantFormRow) => (
  row.existingImages.map((image) => image.image_id)
);

export const hasBaseProductChanges = (
  original: AdminProductBaseFormValues,
  current: AdminProductBaseFormValues,
  includeSupplier = false,
) => (
  JSON.stringify(getBaseProductPayload(original, includeSupplier))
  !== JSON.stringify(getBaseProductPayload(current, includeSupplier))
);

export const getProductFormDirtySnapshot = (
  selectedProductValue: AdminProductSelectorValue,
  baseValues: AdminProductBaseFormValues,
  variantRows: AdminProductVariantFormRow[],
  includeSupplier = false,
) => JSON.stringify({
  selectedProductValue,
  base: getBaseProductPayload(baseValues, includeSupplier),
  variants: variantRows.map((row) => ({
    color: row.color.trim(),
    existingImageIds: getExistingImageIds(row).map(String).sort(),
    files: row.files.map((file) => ({
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
    })),
    is_active: row.is_active,
    quantity: Number(row.quantity || 0),
    size: row.size,
    variant_id: row.variant_id || null,
  })),
});

export const validateProductForm = (
  selectedProductValue: AdminProductSelectorValue,
  baseValues: AdminProductBaseFormValues,
  variantRows: AdminProductVariantFormRow[],
) => {
  const formErrors: string[] = [];
  const variantErrors: Record<string, AdminProductVariantRowError> = {};

  if (!baseValues.catalog_number.trim()) formErrors.push('Catalog number is required.');
  if (!baseValues.name.trim()) formErrors.push('Product name is required.');
  if (!baseValues.price || Number(baseValues.price) < 0) formErrors.push('Valid price is required.');
  if (!baseValues.main_category_id) formErrors.push('Main category is required.');

  if (!variantRows.length) {
    formErrors.push('At least one variant row is required.');
  }

  const seenVariants = new Set<string>();

  variantRows.forEach((row) => {
    const rowError: AdminProductVariantRowError = {};

    if (!row.color.trim()) rowError.color = 'Color is required.';
    if (!row.size) rowError.size = 'Size is required.';
    if (Number(row.quantity) < 0 || Number.isNaN(Number(row.quantity))) {
      rowError.quantity = 'Quantity must be zero or more.';
    }

    const duplicateKey = `${row.color.trim().toLowerCase()}|${row.size}`;
    if (row.color.trim() && row.size) {
      if (seenVariants.has(duplicateKey)) {
        rowError.duplicate = 'This color and size already exists in the form.';
      }
      seenVariants.add(duplicateKey);
    }

    if (Object.keys(rowError).length) {
      variantErrors[row.localId] = rowError;
    }
  });

  return {
    formError: formErrors[0],
    variantErrors,
    isValid: formErrors.length === 0 && Object.keys(variantErrors).length === 0,
  };
};

export const isNewProductValue = (
  value: AdminProductSelectorValue,
) => value === ADMIN_PRODUCT_NEW_OPTION_VALUE;

export const getProductIdFromSelectorValue = (
  value: AdminProductSelectorValue,
): ProductId | undefined => (isNewProductValue(value) ? undefined : value);

export const getAdminProductFormErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (apiError?.message) {
    return apiError.message;
  }

  if (details && typeof details === 'object') {
    return Object.values(details as Record<string, string[] | string>)
      .flat()
      .join(' ');
  }

  return 'Request failed. Please try again.';
};
