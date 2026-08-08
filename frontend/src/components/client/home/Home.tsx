import React from 'react';
import strip1 from '../../../assets/images//strip/strip1.jpg';
import './Home.scss';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import HomeCategoryList from './HomeCategoryList';

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
      <HomeCategoryList />
    </div>
  );
}

export default Home;
