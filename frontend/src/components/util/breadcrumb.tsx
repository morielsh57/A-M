import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbsPropsT {
  linkAr?: { to: string, name: string }[]
  pName: string
}

const Breadcrumbs: React.FC<BreadcrumbsPropsT> = (props) => {

  return (
    <div className="d-md-block d-none">
      <div className="breadcrumb mb-0 mt-2">
        <Link className="breadcrumb-item" to="/">Home</Link>
        {props.linkAr && props.linkAr.map((item, i) => {
          return (
            item.name !== "undefined" && <Link className="breadcrumb-item" to={item.to} key={i}>{item.name}</Link>
          )
        })}
        <p className="breadcrumb-item active" >{props.pName}</p>
      </div>
    </div>
  );
}

export default Breadcrumbs;