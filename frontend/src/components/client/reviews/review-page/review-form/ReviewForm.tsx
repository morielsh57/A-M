import React, { useEffect, useState } from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import type { IOrderItem } from '../../../orders/orders.store';
import type { IReviewPayload } from '../../reviews.store';
import './ReviewForm.scss';

interface ReviewFormProps {
  initialReview?: IOrderItem['review'];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: IReviewPayload) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  initialReview,
  isSaving,
  onCancel,
  onSubmit,
}) => {
  const [stars, setStars] = useState(initialReview?.stars || 5);
  const [reviewText, setReviewText] = useState(initialReview?.review_text || '');
  const [error, setError] = useState('');
  const isEditing = Boolean(initialReview);

  useEffect(() => {
    setStars(initialReview?.stars || 5);
    setReviewText(initialReview?.review_text || '');
  }, [initialReview]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedReview = reviewText.trim();

    if (!trimmedReview) {
      setError('Please write your review before saving.');
      return;
    }

    setError('');
    onSubmit({
      stars,
      review_text: trimmedReview,
    });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form__header">
        <span className="review-form__eyebrow">
          {isEditing ? 'Edit Review' : 'Add Review'}
        </span>
        <h2 className="review-form__title">
          {isEditing ? 'Update your review' : 'Tell us what you think'}
        </h2>
      </div>

      <div className="review-form__rating" aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const isFilled = value <= stars;
          return (
            <button
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              className={[
                'review-form__star',
                isFilled ? 'review-form__star--filled' : '',
              ].filter(Boolean).join(' ')}
              key={value}
              type="button"
              onClick={() => setStars(value)}
            >
              &#9733;
            </button>
          );
        })}
      </div>

      <label className="review-form__field">
        <span className="review-form__label">Your review</span>
        <textarea
          className="review-form__textarea"
          disabled={isSaving}
          placeholder="Write your review"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
        />
      </label>

      {error && <span className="review-form__error">{error}</span>}

      <div className="review-form__actions">
        <AppButton className="review-form__submit" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : isEditing ? 'Update Review' : 'Add Review'}
        </AppButton>
        <AppButton
          className="review-form__cancel"
          disabled={isSaving}
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </AppButton>
      </div>
    </form>
  );
};

export default ReviewForm;
