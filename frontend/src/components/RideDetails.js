import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { getCurrentUserId, getToken } from "../utils/auth";

const RideDetails = ({ ride }) => {
  const isOpen = ride.status === "open";
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);

  const currentUserId = useMemo(() => getCurrentUserId(), []);
  const ownerId = ride.user_id?._id || ride.user_id;
  // The owner cannot connect to their own ride.
  const isOwner = !!currentUserId && String(ownerId) === String(currentUserId);

  const posterName = ride.user_id?.fullname?.firstname || "Unknown";
  const posterInitial = posterName.charAt(0).toUpperCase();

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      setIsJoined(false);
      return;
    }

    // Check if user is in joinedUserIds array by comparing user IDs
    const isUserJoined = ride.joinedUserIds?.some(
      (entry) => entry.user?._id === userId || entry.user === userId
    );
    setIsJoined(!!isUserJoined);
  }, [ride.joinedUserIds]);

  const toggleJoin = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/rides/${ride._id}/join`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join/leave ride');
      }

      await response.json();
      setIsJoined(!isJoined);
    } catch (error) {
      console.error('Error joining/leaving ride:', error);
      alert(error.message);
    }
  };

  const handleProfileClick = () => {
    navigate(`/ride-confirmation?rideId=${ride._id}`);
  };

  return (
    <div className="ride-card">
      <div className="ride-poster">
        <span className="ride-poster-avatar" aria-hidden="true">{posterInitial}</span>
        <span className="ride-poster-name">{posterName}</span>
        {isOwner && <span className="ride-poster-you">Your post</span>}
      </div>

      <div className="ride-from-to-wrapper">
        <div className="ride-from">
          <strong>{ride.startingPoint}</strong>
          <span>From</span>
        </div>
        <div className="horizontal-divider" />
        <div className="ride-to">
          <strong>{ride.destination}</strong>
          <span>To</span>
        </div>
      </div>

      <div className="ride-bottom-row">
        <div className="ride-detail-block">
          <span className="detail-title">Date</span>
          <span>{ride.date}</span>
        </div>
        <div className="ride-thin-divider" />
        <div className="ride-detail-block">
          <span className="detail-title">Time</span>
          <span>{ride.time}</span>
        </div>
        <div className="ride-thin-divider" />
        <div className="ride-detail-block">
          <span className="detail-title">Slots</span>
          <span>{ride.availableSlots}</span>
        </div>
        <div className="ride-thin-divider" />
        <div className="ride-detail-block">
          <span className="detail-title">Preference</span>
          <span>{ride.preference === "Both" ? "Male/Female" : ride.preference}</span>
        </div>
      </div>

      <div className="ride-actions">
        <button
          type="button"
          className="btn-view-riders"
          onClick={handleProfileClick}
        >
          See Who's Going
        </button>

        {/* A closed ride reads as "Closed", so it must not also carry the
            green connected styling. */}
        {!isOwner && (
          <button
            type="button"
            className={`btn-connect ${isJoined && isOpen ? "connected" : ""}`}
            disabled={!isOpen}
            onClick={toggleJoin}
          >
            {!isOpen ? "Closed" : isJoined ? "Connected" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RideDetails;


