import React from 'react';
import { getProductInformationItems } from '../productPage.utils';
import './ProductDetailsCare.scss';

interface ProductDetailsCareProps {
  information?: string | null;
}

const ProductDetailsCare: React.FC<ProductDetailsCareProps> = ({ information }) => {
  const details = getProductInformationItems(information);

  if (details.length === 0) return null;

  return (
    <section className="product-page__info-block">
      <h2>Details & care</h2>
      <ul>
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </section>
  );
};

export default ProductDetailsCare;
