import React from 'react';
import './AdminHomeInfoBox.scss';

interface InfoBoxTypes {
  amount: number;
  name: string;
  caption: string;
  icon: React.ReactNode;
  trend: string;
  isLoading?: boolean;
  valuePrefix?: string;
}

const formatAmount = (amount: number, valuePrefix = '') => {
  return `${valuePrefix}${amount.toLocaleString()}`;
};

const AdminHomeInfoBox: React.FC<InfoBoxTypes> = (props) => {
  return (
    <article className="admin-home-info-box">
      <div className="admin-home-info-box__top">
        <div>
          <p className="admin-home-info-box__label">{props.name}</p>
          <div className="admin-home-info-box__value">
            {props.isLoading ? '...' : formatAmount(props.amount, props.valuePrefix)}
          </div>
        </div>
        <span className="admin-home-info-box__icon" aria-hidden="true">
          {props.icon}
        </span>
      </div>
      <div className="admin-home-info-box__footer">
        <span className="admin-home-info-box__trend">{props.trend}</span>
        <span className="admin-home-info-box__caption">{props.caption}</span>
      </div>
    </article>
  );
};

export default AdminHomeInfoBox;
