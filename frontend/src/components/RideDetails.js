import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

const RideDetails = ({ ride }) => {
  const isOpen = ride.status === "open";
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsJoined(false);
      return;
    }
    
    try {
      const user = JSON.parse(atob(token.split(".")[1]));
      // Check if user is in joinedUserIds array by comparing user IDs
      const isUserJoined = ride.joinedUserIds?.some(
        (entry) => entry.user._id === user._id || entry.user === user._id
      );
      setIsJoined(isUserJoined);
    } catch (error) {
      console.error("Error checking join status:", error);
      setIsJoined(false);
    }
  }, [ride.joinedUserIds]);

  const toggleJoin = async () => {
    const token = localStorage.getItem("token");
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
          <span>{ride.preference}</span>
        </div>
      </div>

      <div className="ride-actions">
        <button
          type="button"
          className="btn-view-riders"
          onClick={handleProfileClick}
        >
          View Riders
        </button>

        <button
          type="button"
          className={`btn-connect ${isJoined ? "connected" : ""}`}
          disabled={!isOpen}
          onClick={toggleJoin}
        >
          {!isOpen ? "Ride Closed" : isJoined ? "Connected" : "Connect"}
        </button>
      </div>
    </div>
  );
};

export default RideDetails;


