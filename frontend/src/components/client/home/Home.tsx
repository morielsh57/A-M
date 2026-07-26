import React from 'react';
import strip1 from '../../../assets/images//strip/strip1.jpg';

const Home: React.FC = () => {
  
  return (
    <div style={{background:"white", display:"flex", flexDirection:"column", justifyContent:"start", alignItems:"center"}}>
      {/* strip image */}
      <div style={{ maxHeight: "300px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "start", marginBottom: "40px"}}>
        <img
          className="d-block w-100"
          src={strip1}
          alt="First slide"
        />
      </div>
      <hr className="hr-for-title" />
      <h1 className="title-with-hr text-center fw-normal">
        <span>A&amp;M Fashion Store</span>
      </h1>
      {/* home category list will be here */}
    </div>
  );
}

export default Home;
