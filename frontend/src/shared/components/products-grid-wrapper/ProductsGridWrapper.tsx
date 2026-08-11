import React, { HTMLAttributes, ReactNode } from 'react';
import './ProductsGridWrapper.scss';

interface ProductsGridWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const ProductsGridWrapper: React.FC<ProductsGridWrapperProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={['products-grid-wrapper', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};

export default ProductsGridWrapper;
