import { useState } from 'react';

const RatingForm = ({ onSubmitRating }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError(null);
    
    try {
      await onSubmitRating({ rating, comment });
      // Clear form after successful submission
      setComment('');
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <div className="rating-stars-input">
        <label>Your Rating:</label>
        <div className="star-selector">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-button ${star <= rating ? 'selected' : ''}`}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} stars`}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="comment">Comment (optional):</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this user..."
          rows="3"
          maxLength="300"
        />
        <small className="char-count">{comment.length}/300</small>
      </div>
      
      <button 
        type="submit" 
        className="submit-rating-button" 
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
};

export default RatingForm;