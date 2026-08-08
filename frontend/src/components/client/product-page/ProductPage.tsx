import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const ProductPage: React.FC = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const variantId = searchParams.get('variant');

  return (
    <main style={{ minHeight: '60vh', padding: '48px 24px', textAlign: 'center' }}>
      <h1>Product Page</h1>
      <p>Product: {productId}</p>
      {variantId && <p>Selected variant: {variantId}</p>}
    </main>
  );
};

export default ProductPage;
