import React from 'react';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import { ABOUT_US_PAGE_CONTENT } from './aboutUsPage.utils';
import './AboutUsPage.scss';

const AboutUsPage: React.FC = () => (
  <section className="about-us-page">
    <Breadcrumbs pageName={ABOUT_US_PAGE_CONTENT.title} />
    <div className="about-us-page__header">
      <AppTitle title={ABOUT_US_PAGE_CONTENT.title} />
      <p className="about-us-page__intro">{ABOUT_US_PAGE_CONTENT.intro}</p>
    </div>

    <div className="about-us-page__content">
      {ABOUT_US_PAGE_CONTENT.sections.map((section) => (
        <article className="about-us-page__section" key={section.title}>
          <h2 className="about-us-page__section-title">{section.title}</h2>
          <p className="about-us-page__section-text">{section.text}</p>
        </article>
      ))}
    </div>
  </section>
);

export default AboutUsPage;
