import { IProductCardProduct, IProductColorOption } from '../../../components/product-page/product.types';
import mockProductImage from '../../../assets/images/shirt.webp';
import { APP_ROUTING_PATHS } from '../../../app/routing';

// Mock product data for demonstration purposes and testing
export const mockProductItem: IProductCardProduct = {
  product_id: 1,
  catalog_number: 'AM-CL-001',
  name: 'Relaxed Tailored Cotton Overshirt With Soft Structure',
  images: [mockProductImage],
  price: '79.99',
  fabric: 'Cotton twill',
  selected_color: 'Black',
  selected_variant_id: 101,
  colors: [
    {
      color: 'Black',
      variant_id: 101,
      in_stock: true,
      images: [mockProductImage],
    },
    {
      color: 'Ivory',
      variant_id: 102,
      in_stock: true,
      images: [mockProductImage],
    },
    {
      color: 'Rose',
      variant_id: 103,
      in_stock: false,
      images: [mockProductImage],
    },
    {
      color: 'Sage',
      variant_id: 104,
      in_stock: true,
      images: [],
    },
  ],
};

export const colorHexMap: Record<string, string> = {
  beige: '#d8c4a7',
  black: '#151515',
  blue: '#315c96',
  brown: '#76543f',
  cream: '#efe6d4',
  green: '#6e7f5f',
  gold: '#d4af37',
  grey: '#8b8d91',
  gray: '#8b8d91',
  ivory: '#f8f1e4',
  khaki: '#b7a77a',
  navy: '#20283f',
  olive: '#6f7a45',
  orange: '#d9772f',
  pink: '#d88fa9',
  purple: '#7a4f8f',
  red: '#b4373f',
  rose: '#c9838c',
  sage: '#9aaa85',
  silver: '#c8c8c8',
  teal: '#2f7d78',
  white: '#ffffff',
  yellow: '#f4d35e',
};

export const getColorValue = (color: string): string => {
  const normalizedColor = color.trim().toLowerCase();
  return colorHexMap[normalizedColor] || normalizedColor || '#d8c4a7';
};

export const formatPrice = (price: string | number): string => {
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return String(price);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericPrice);
};

export const getProductPageUrl = (
  product: IProductCardProduct,
  variant?: IProductColorOption,
): string => {
  return APP_ROUTING_PATHS.APP_PRODUCT_PAGE(
    product.product_id,
    variant?.variant_id || product.selected_variant_id,
  );
};
