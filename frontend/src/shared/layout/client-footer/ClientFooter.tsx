import React from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import './ClientFooter.scss';

const ClientFooter: React.FC = () => {

  return (
    <div className="footer w-100 p-3 pb-3 text-center">
      <div className="d-flex flex-wrap w-100 justify-content-md-around justify-content-center">
        <div className="col-md-4 col-12">
          <Link to={APP_ROUTING_PATHS.APP_ABOUT_US_PAGE}>About Us <i className="fa fa-book text-light"></i></Link>
          <Link to={APP_ROUTING_PATHS.APP_SHIPPING_POLICY_PAGE}>Shipping policy <i className="fa fa-plane text-light"></i></Link>
          <button className="btn btn-light rounded-circle me-3 mt-3"><i className="fa fa-facebook"></i></button>
          <button className="btn btn-light rounded-circle mt-3"><i className="fa fa-instagram fw-bold"></i></button>
        </div>
        <div className="col-md-4 col-12 mt-md-0 mt-2">
          <p className="fw-bold">Contact Us <i className="fa fa-phone text-light"></i> :</p>
          <p>am_fashoin.service.customer@gmail.com</p>
          <p>077-2136567</p>
          <p>
            <strong>Customer service hours:</strong><br />
            Sunday-Thursday, 10:00-16:00<br />
            On Fridays and holidays, the customer service is closed.
          </p>
        </div>
        <div className="col-md-4 col-12 d-none d-md-block">
          <p className="fw-bold">Club Members <i className="fa fa-heart-o text-light"></i> :</p>
          <p className="w-50 mx-auto">
            Come and be a member of our club,<br />
            register and you will be updated before everyone
            on all the most valuable items in our store.
          </p>
          <Link to={APP_ROUTING_PATHS.AUTH_SIGNUP_PAGE} className="fw-bold">Click here to sign up</Link>
        </div>
      </div>
      <p className="mt-md-0 mt-2">&copy;A&M Fashion</p>
    </div>
  );
}

export default ClientFooter;
