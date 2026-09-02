import React from 'react';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import { SHIPPING_POLICY_PAGE_CONTENT } from './shippingPolicyPage.utils';
import './ShippingPolicyPage.scss';

const ShippingPolicyPage: React.FC = () => (
  <section className="shipping-policy-page">
    <Breadcrumbs pageName={SHIPPING_POLICY_PAGE_CONTENT.title} />
    <div className="shipping-policy-page__header">
      <AppTitle title={SHIPPING_POLICY_PAGE_CONTENT.title} />
      <p className="shipping-policy-page__intro">{SHIPPING_POLICY_PAGE_CONTENT.intro}</p>
    </div>

    <div className="shipping-policy-page__content">
      {SHIPPING_POLICY_PAGE_CONTENT.sections.map((section) => (
        <article className="shipping-policy-page__section" key={section.title}>
          <h2 className="shipping-policy-page__section-title">{section.title}</h2>
          <p className="shipping-policy-page__section-text">{section.text}</p>
        </article>
      ))}
    </div>
  </section>
);

export default ShippingPolicyPage;
