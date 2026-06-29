import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useChat } from '../contexts/ChatContext';
import ChatWindow from '../components/chat/ChatWindow';
import '../components/chat/Chat.css';
import { API_BASE } from "../config";

const RideConfirmation = () => {
  const location = useLocation();
  const rideId = new URLSearchParams(location.search).get("rideId");
  const { setActiveRideId } = useChat();

  const [joinedUsers, setJoinedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ridePostedBy, setRidePostedBy] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [loadingRide, setLoadingRide] = useState(true);
  const [errorRide, setErrorRide] = useState(null);
  const [currentUserRideStatus, setCurrentUserRideStatus] = useState(null);
  const [userRatings, setUserRatings] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in");
      setLoadingRide(false);
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(decoded._id);
    } catch (err) {
      setError("Failed to decode token");
      setLoadingRide(false);
      return;
    }

    const loadRideDetails = async () => {
      if (!rideId) {
        setErrorRide('No ride ID provided.');
        setLoadingRide(false);
        return;
      }

      try {
        setLoadingRide(true);
        setErrorRide(null);
        const res = await fetch(`${API_BASE}/api/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setErrorRide('Ride not found.');
          } else {
            throw new Error("Failed to fetch ride");
          }
          setRideDetails(null);
          setJoinedUsers([]);
          setCurrentUserRideStatus(null);
          return;
        }

        const data = await res.json();
        setRideDetails(data);
        const ownerId = data.user_id?._id || data.user_id;
        setRidePostedBy(ownerId);
        const joined = data.joinedUserIds || [];
        setJoinedUsers(joined);

        if (currentUserId) {
          if (String(currentUserId) === String(ownerId)) {
            setCurrentUserRideStatus('owner');
          } else {
            const currentUserEntry = joined.find(item => String(item.user?._id || item.user) === String(currentUserId));
            setCurrentUserRideStatus(currentUserEntry ? currentUserEntry.status : 'not_joined');
          }
        }

      } catch (err) {
        console.error('Error fetching ride details:', err);
        setErrorRide("Failed to load ride details.");
      } finally {
        setLoadingRide(false);
      }
    };

    if (rideId && currentUserId) {
      loadRideDetails();
      setActiveRideId(rideId);
    } else if (!rideId) {
      setErrorRide('No ride ID provided.');
      setLoadingRide(false);
    }

    return () => {
      setActiveRideId(null);
    };
  }, [rideId, currentUserId, setActiveRideId]);

  useEffect(() => {
    if (currentUserId && rideDetails) {
      const ownerId = rideDetails.user_id?._id || rideDetails.user_id;
      if (String(currentUserId) === String(ownerId)) {
        setCurrentUserRideStatus('owner');
      } else {
        const currentUserEntry = joinedUsers.find(item => String(item.user?._id || item.user) === String(currentUserId));
        setCurrentUserRideStatus(currentUserEntry ? currentUserEntry.status : 'not_joined');
      }
    }
  }, [joinedUsers, currentUserId, rideDetails]);

  // Fetch the average rating for the owner and every joined user
  useEffect(() => {
    if (!rideDetails) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const ids = new Set();
    const ownerId = rideDetails.user_id?._id || rideDetails.user_id;
    if (ownerId) ids.add(String(ownerId));
    joinedUsers.forEach((item) => {
      const uid = item.user?._id || item.user;
      if (uid) ids.add(String(uid));
    });

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Array.from(ids).map(async (uid) => {
          try {
            const res = await fetch(`${API_BASE}/api/ratings/user/${uid}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return [uid, { average: 0, count: 0 }];
            const data = await res.json();
            const count = data.count ?? (data.ratings ? data.ratings.length : 0);
            return [uid, { average: data.averageRating || 0, count }];
          } catch (e) {
            return [uid, { average: 0, count: 0 }];
          }
        })
      );
      if (!cancelled) setUserRatings(Object.fromEntries(entries));
    })();

    return () => { cancelled = true; };
  }, [rideDetails, joinedUsers]);

  const renderRating = (uid) => {
    const r = userRatings[String(uid)];
    if (!r || r.count === 0) {
      return <span className="rc-rating-meta">No ratings yet</span>;
    }
    const rounded = Math.round(r.average);
    return (
      <>
        <span className="rc-stars">{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>{' '}
        <span className="rc-rating-meta">{r.average.toFixed(1)} ({r.count})</span>
      </>
    );
  };

  const handleAction = async (userId, status) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/rides/${rideId}/user/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updatedRide = await res.json();
      setJoinedUsers(updatedRide.joinedUserIds || []);
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const isOwner = String(currentUserId) === String(ridePostedBy);

  if (loadingRide) {
    return <div>Loading ride details...</div>;
  }

  if (errorRide) {
    return <div style={{ color: 'red' }}>Error: {errorRide}</div>;
  }

  if (!rideDetails) {
    return <div>Ride not found.</div>;
  }

  const isChatAllowed = currentUserRideStatus === 'owner' || currentUserRideStatus === 'confirmed';

  return (
    <div className="user-profile">
      <h2>Ride Confirmation</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Posted By</h3>
      <div className="user-list">
        <div className="user-card2">
          <span className="owner-tag">Ride Owner</span>
          <p><strong>Full Name:</strong> {rideDetails.user_id?.fullname?.firstname} {rideDetails.user_id?.fullname?.lastname}</p>
          <p><strong>Email:</strong> {rideDetails.user_id?.email}</p>
          {rideDetails.user_id?.phone && (
            <p><strong>Phone:</strong> {rideDetails.user_id.phone}</p>
          )}
          <p><strong>Rating:</strong> {renderRating(rideDetails.user_id?._id || rideDetails.user_id)}</p>
        </div>
      </div>

      <h3>Joined Users</h3>
      {joinedUsers.length > 0 ? (
        <div className="user-list">
          {joinedUsers.map((item) => {
            const user = item.user;
            const userId = user._id;
            const isItemOwner = String(userId) === String(ridePostedBy);

            return (
              <div className="user-card2" key={userId}>
                {isItemOwner && <span className="owner-tag">Ride Owner</span>}
                <p><strong>Full Name:</strong> {user.fullname?.firstname} {user.fullname?.lastname}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.phone && (
                  <p><strong>Phone:</strong> {user.phone}</p>
                )}
                <p><strong>Rating:</strong> {renderRating(userId)}</p>
                {!isItemOwner && (
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`status-badge status-${item.status}`}>
                      {item.status}
                    </span>
                  </p>
                )}
                {isOwner && !isItemOwner && (
                  <div className="confirmation-buttons">
                    <button
                      className={`confirm-btn ${item.status === 'confirmed' ? 'active' : ''}`}
                      onClick={() => handleAction(userId, 'confirmed')}
                    >
                      Confirm
                    </button>
                    <button
                      className={`cancel-btn ${item.status === 'cancelled' ? 'active' : ''}`}
                      onClick={() => handleAction(userId, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !error && <p>No users have joined this ride yet.</p>
      )}

      <div className="ride-chat-section">
        <h3>Chat</h3>
        {isChatAllowed ? (
          <ChatWindow />
        ) : (
          <div className="chat-restricted-message">
            Chat is only available for the ride owner and confirmed participants.
          </div>
        )}
      </div>
    </div>
  );
};

export default RideConfirmation; 