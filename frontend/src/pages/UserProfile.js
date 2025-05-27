import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RatingForm from '../components/RatingForm';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch user details
        const userResponse = await fetch(`/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await userResponse.json();
        setUser(userData);

        // Fetch user ratings
        const ratingsResponse = await fetch(`/api/ratings/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!ratingsResponse.ok) {
          throw new Error('Failed to fetch ratings');
        }

        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData.ratings || []);
        setAverageRating(ratingsData.averageRating || 0);

      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleRatingSubmit = async (newRating) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ratedUserId: userId,
          ...newRating
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      // Refetch ratings after successful submission
      const ratingsResponse = await fetch(`/api/ratings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const ratingsData = await ratingsResponse.json();
      setRatings(ratingsData.ratings || []);
      setAverageRating(ratingsData.averageRating || 0);

    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    }
  };

  if (loading) {
    return <div className="loading">Loading user profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="not-found">User not found</div>;
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-header">
        <h2>{user.fullname.firstname} {user.fullname.lastname}</h2>
        <div className="rating-badge">
          <span className="stars">{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</span>
          <span className="rating-number">{averageRating} ({ratings.length} reviews)</span>
        </div>
      </div>

      <div className="user-profile-content">
        <div className="user-details">
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <div className="rating-section">
          <h3>Rate this user</h3>
          <RatingForm onSubmitRating={handleRatingSubmit} />
        </div>

        <div className="ratings-list">
          <h3>User Ratings</h3>
          {ratings.length > 0 ? (
            ratings.map(rating => (
              <div key={rating._id} className="rating-item">
                <div className="rating-header">
                  <div className="rating-stars">{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</div>
                  <div className="rating-author">
                    by {rating.raterUserId.fullname.firstname} {rating.raterUserId.fullname.lastname}
                  </div>
                  <div className="rating-date">{new Date(rating.createdAt).toLocaleDateString()}</div>
                </div>
                {rating.comment && <p className="rating-comment">{rating.comment}</p>}
              </div>
            ))
          ) : (
            <p className="no-ratings">No ratings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;