import React from 'react';
import strip1 from '../../../assets/images//strip/strip1.jpg';
import ProductCard from '../../../shared/components/product-card/ProductCard';
import './Home.scss';

const Home: React.FC = () => {

  return (
    <div className="home-page">
      {/* strip image */}
      <div className="home-page__strip">
        <img
          className="d-block w-100"
          src={strip1}
          alt="First slide"
        />
      </div>
      <hr className="hr-for-title" />
      <h1 className="home-page__products-title title-with-hr text-center fw-normal">
        <span>A&amp;M Fashion Store</span>
      </h1>
      <div className="home-page__products-grid">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
      {/* home category list will be here */}
    </div>
  );
}

export default Home;
