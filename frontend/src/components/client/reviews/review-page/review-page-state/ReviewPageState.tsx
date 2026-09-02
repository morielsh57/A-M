import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import './ReviewPageState.scss';

interface ReviewPageStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  isError?: boolean;
  onAction?: () => void;
}

const ReviewPageState: React.FC<ReviewPageStateProps> = ({
  title,
  message,
  actionLabel,
  isError = false,
  onAction,
}) => (
  <section className={[
    'review-page-state',
    isError ? 'review-page-state--error' : '',
  ].filter(Boolean).join(' ')}
  >
    <h1 className="review-page-state__title">{title}</h1>
    <p className="review-page-state__message">{message}</p>
    {actionLabel && onAction && (
      <AppButton className="review-page-state__action" onClick={onAction}>
        {actionLabel}
      </AppButton>
    )}
  </section>
);

export default ReviewPageState;
