import React from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import './Breadcrumbs.scss';

interface BreadcrumbLink {
  to: string;
  name: string;
}

interface BreadcrumbsProps {
  linkAr?: BreadcrumbLink[];
  pageName: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ linkAr, pageName }) => {
  return (
    <nav className="app-breadcrumbs d-md-block d-block" aria-label="Breadcrumb">
      <ol className="app-breadcrumbs__list mb-0 mt-0">
        <li className="app-breadcrumbs__item">
          <Link to={APP_ROUTING_PATHS.APP_HOME_PAGE} state={{ restoreScroll: true }}>Home</Link>
        </li>
        {linkAr?.map((item) => (
          item.name !== 'undefined' && (
            <li className="app-breadcrumbs__item" key={`${item.to}-${item.name}`}>
              <Link to={item.to} state={{ restoreScroll: true }}>{item.name}</Link>
            </li>
          )
        ))}
        <li className="app-breadcrumbs__item app-breadcrumbs__item--active" aria-current="page">
          {pageName}
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
