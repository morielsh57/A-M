import React, { useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminForm from '../../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../../shared/components/admin-form/AdminFormActions';
import AdminFormError from '../../../../shared/components/admin-form/AdminFormError';
import type { IMainCategory } from '../../../../shared/store/category/category.types';
import { EUserRole } from '../../../../shared/store/user/user.types';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import type { CategoryId, ProductId } from '../../../product-page/product.types';
import {
  getAdminUsers,
  getAdminUsersCacheKey,
} from '../../users/adminUsers.store';
import type { IAdminProductListItem } from '../adminProducts.types';
import {
  createAdminProduct,
  createAdminProductVariant,
  deleteAdminProductImage,
  getAdminProductDetail,
  getAdminProductDetailCacheKey,
  updateAdminProduct,
  updateAdminProductVariant,
  uploadAdminProductImages,
} from '../adminProducts.store';
import { ADMIN_PRODUCT_NEW_OPTION_VALUE } from './adminProductForm.constants';
import type {
  AdminProductBaseFormValues,
  AdminProductSelectorValue,
  AdminProductVariantFormRow,
  AdminProductVariantRowError,
} from './adminProductForm.types';
import {
  createEmptyProductBaseValues,
  createEmptyVariantRow,
  getAdminProductFormErrorMessage,
  getBaseProductPayload,
  getExistingImageIds,
  getProductFormDirtySnapshot,
  getProductIdFromSelectorValue,
  getVariantPayload,
  hasBaseProductChanges,
  isNewProductValue,
  mapProductToBaseValues,
  mapProductToVariantRows,
  validateProductForm,
} from './adminProductForm.utils';
import AdminProductBaseFields from './AdminProductBaseFields';
import AdminProductSelector from './AdminProductSelector';
import AdminProductVariantRows from './AdminProductVariantRows';
import './AdminProductForm.scss';

interface AdminProductFormProps {
  defaultMainCategoryId?: CategoryId;
  disableMainCategorySelect?: boolean;
  initialProductId?: ProductId;
  mainCategories: IMainCategory[];
  products: IAdminProductListItem[];
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved: () => void;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({
  defaultMainCategoryId,
  disableMainCategorySelect = false,
  initialProductId,
  mainCategories,
  onCancel,
  onDirtyChange,
  onSaved,
  products,
}) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { adminProductDetailByProductReq } = useAppSelector((store) => store.adminProductsStoreReducer);
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const { usersByQueryReq } = useAppSelector((store) => store.adminUsersStoreReducer);
  const canManageProductSupplier = adminOrSupplierUser?.role === EUserRole.ADMIN;
  const supplierRequestParams = useMemo(() => ({
    role: EUserRole.SUPPLIER,
    page: 1,
    page_size: 100,
  }), []);
  const supplierCacheKey = getAdminUsersCacheKey(supplierRequestParams);
  const suppliersReq = usersByQueryReq[supplierCacheKey];
  const supplierOptions = useMemo(() => (
    (suppliersReq?.data || [])
      .filter((supplier) => supplier.supplier_id != null)
      .map((supplier) => ({
        value: supplier.supplier_id!,
        label: supplier.name,
        subtitle: supplier.email,
        searchLabel: `${supplier.name} ${supplier.email}`,
      }))
  ), [suppliersReq?.data]);
  const [selectedProductValue, setSelectedProductValue] = useState<AdminProductSelectorValue>(
    initialProductId || ADMIN_PRODUCT_NEW_OPTION_VALUE,
  );
  const [baseValues, setBaseValues] = useState<AdminProductBaseFormValues>(
    createEmptyProductBaseValues(defaultMainCategoryId),
  );
  const [originalBaseValues, setOriginalBaseValues] = useState<AdminProductBaseFormValues>(
    createEmptyProductBaseValues(defaultMainCategoryId),
  );
  const [variantRows, setVariantRows] = useState<AdminProductVariantFormRow[]>([
    createEmptyVariantRow(),
  ]);
  const [variantErrors, setVariantErrors] = useState<Record<string, AdminProductVariantRowError>>({});
  const [formError, setFormError] = useState<string>();
  const [originalFormSnapshot, setOriginalFormSnapshot] = useState<string>(
    getProductFormDirtySnapshot(
      initialProductId || ADMIN_PRODUCT_NEW_OPTION_VALUE,
      createEmptyProductBaseValues(defaultMainCategoryId),
      [createEmptyVariantRow()],
      canManageProductSupplier,
    ),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedProductId = getProductIdFromSelectorValue(selectedProductValue);
  const selectedProductDetailReq = selectedProductId
    ? adminProductDetailByProductReq[getAdminProductDetailCacheKey({ product_id: selectedProductId })]
    : undefined;
  const selectedProductDetail = selectedProductDetailReq?.data;
  const isEditMode = initialProductId !== undefined;
  const isExistingProduct = useMemo(
    () => !isNewProductValue(selectedProductValue),
    [selectedProductValue],
  );
  const isExistingProductLoading = isExistingProduct && (
    !selectedProductDetailReq || selectedProductDetailReq.status === EAPIStatus.PENDING
  );

  useEffect(() => {
    if (canManageProductSupplier && !suppliersReq) {
      dispatch(getAdminUsers(supplierRequestParams));
    }
  }, [canManageProductSupplier, dispatch, supplierRequestParams, suppliersReq]);

  useEffect(() => {
    if (selectedProductId && !selectedProductDetailReq) {
      dispatch(getAdminProductDetail({ product_id: selectedProductId }));
    }
  }, [dispatch, selectedProductDetailReq, selectedProductId]);

  useEffect(() => {
    const nextProductValue = initialProductId || ADMIN_PRODUCT_NEW_OPTION_VALUE;
    setSelectedProductValue(nextProductValue);
    setFormError(undefined);
    setVariantErrors({});

    if (!initialProductId) {
      const nextBaseValues = createEmptyProductBaseValues(defaultMainCategoryId);
      const nextVariantRows = [createEmptyVariantRow()];
      setBaseValues(nextBaseValues);
      setOriginalBaseValues(nextBaseValues);
      setVariantRows(nextVariantRows);
      setOriginalFormSnapshot(getProductFormDirtySnapshot(
        nextProductValue,
        nextBaseValues,
        nextVariantRows,
        canManageProductSupplier,
      ));
    }
  }, [canManageProductSupplier, defaultMainCategoryId, initialProductId]);

  useEffect(() => {
    if (!selectedProductDetail) {
      return;
    }

    const nextBaseValues = mapProductToBaseValues(selectedProductDetail, mainCategories);
    const nextVariantRows = mapProductToVariantRows(selectedProductDetail);
    setBaseValues(nextBaseValues);
    setOriginalBaseValues(nextBaseValues);
    setVariantRows(nextVariantRows);
    setOriginalFormSnapshot(getProductFormDirtySnapshot(
      selectedProductValue,
      nextBaseValues,
      nextVariantRows,
      canManageProductSupplier,
    ));
  }, [canManageProductSupplier, mainCategories, selectedProductDetail, selectedProductValue]);

  const currentFormSnapshot = useMemo(() => getProductFormDirtySnapshot(
    selectedProductValue,
    baseValues,
    variantRows,
    canManageProductSupplier,
  ), [baseValues, canManageProductSupplier, selectedProductValue, variantRows]);

  useEffect(() => {
    onDirtyChange?.(currentFormSnapshot !== originalFormSnapshot);
  }, [currentFormSnapshot, onDirtyChange, originalFormSnapshot]);

  const handleSelectedProductChange = (value: AdminProductSelectorValue) => {
    setSelectedProductValue(value);
    setFormError(undefined);
    setVariantErrors({});

    if (value === ADMIN_PRODUCT_NEW_OPTION_VALUE) {
      const nextBaseValues = createEmptyProductBaseValues(defaultMainCategoryId);
      const nextVariantRows = [createEmptyVariantRow()];
      setBaseValues(nextBaseValues);
      setOriginalBaseValues(nextBaseValues);
      setVariantRows(nextVariantRows);
      setOriginalFormSnapshot(getProductFormDirtySnapshot(
        value,
        nextBaseValues,
        nextVariantRows,
        canManageProductSupplier,
      ));
    }
  };

  const uploadRowImages = async (
    productId: ProductId,
    row: AdminProductVariantFormRow,
  ) => {
    const existingImageIds = getExistingImageIds(row);

    if (!row.files.length) {
      return row.variant_id ? existingImageIds : undefined;
    }

    const uploadedImages = await dispatch(uploadAdminProductImages({
      product_id: productId,
      files: row.files,
    })).unwrap();

    return [
      ...existingImageIds,
      ...uploadedImages.map((image) => image.image_id),
    ];
  };

  const saveVariantRow = async (productId: ProductId, row: AdminProductVariantFormRow) => {
    const imageIds = await uploadRowImages(productId, row);
    const payload = getVariantPayload(row, imageIds);

    if (row.variant_id) {
      await dispatch(updateAdminProductVariant({
        product_id: productId,
        variant_id: row.variant_id,
        payload,
      })).unwrap();
      return;
    }

    await dispatch(createAdminProductVariant({
      product_id: productId,
      payload,
    })).unwrap();
  };

  const deleteRemovedImages = async (productId: ProductId) => {
    const retainedImageIds = new Set(
      variantRows.flatMap((row) => getExistingImageIds(row).map(String)),
    );
    const removedImages = (selectedProductDetail?.images || []).filter((image) => (
      image.variant_id != null && !retainedImageIds.has(String(image.image_id))
    ));

    await Promise.all(removedImages.map((image) => dispatch(deleteAdminProductImage({
      product_id: productId,
      image_id: image.image_id,
    })).unwrap()));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);

    const validation = validateProductForm(selectedProductValue, baseValues, variantRows);
    setVariantErrors(validation.variantErrors);

    if (!validation.isValid) {
      setFormError(validation.formError || 'Please fix the variant row errors.');
      return;
    }

    setIsSubmitting(true);

    try {
      let productId = selectedProductId;

      if (!productId) {
        const createdProduct = await dispatch(createAdminProduct(
          getBaseProductPayload(baseValues, canManageProductSupplier),
        )).unwrap();
        productId = createdProduct.product_id;
      } else if (hasBaseProductChanges(originalBaseValues, baseValues, canManageProductSupplier)) {
        await dispatch(updateAdminProduct({
          product_id: productId,
          payload: getBaseProductPayload(baseValues, canManageProductSupplier),
        })).unwrap();
      }

      await Promise.all(variantRows.map((row) => saveVariantRow(productId as ProductId, row)));
      await deleteRemovedImages(productId as ProductId);
      await dispatch(getAdminProductDetail({ product_id: productId as ProductId })).unwrap();

      addToast(isExistingProduct ? 'Product updated successfully.' : 'Product created successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });
      onDirtyChange?.(false);
      onSaved();
    } catch (error) {
      setFormError(getAdminProductFormErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminForm onSubmit={handleSubmit}>
      {!isEditMode && (
        <AdminProductSelector
          products={products}
          value={selectedProductValue}
          onChange={handleSelectedProductChange}
        />
      )}

      {isExistingProductLoading ? (
        <div className="admin-product-form__loading">Loading product details...</div>
      ) : (
        <>
          <AdminProductBaseFields
            disableMainCategorySelect={disableMainCategorySelect}
            mainCategories={mainCategories}
            showSupplierSelect={canManageProductSupplier}
            supplierOptions={supplierOptions}
            values={baseValues}
            onChange={setBaseValues}
          />

          <AdminProductVariantRows
            errors={variantErrors}
            rows={variantRows}
            onChange={setVariantRows}
          />
        </>
      )}

      <AdminFormError message={formError} />

      <AdminFormActions
        isSubmitting={isSubmitting || isExistingProductLoading}
        submitLabel={isExistingProduct ? 'Save product' : 'Create product'}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default AdminProductForm;
