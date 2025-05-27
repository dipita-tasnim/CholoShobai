import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const RideConfirmation = () => {
  const location = useLocation();
  const rideId = new URLSearchParams(location.search).get("rideId");

  const [joinedUsers, setJoinedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ridePostedBy, setRidePostedBy] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(decoded._id);
    } catch (err) {
      setError("Failed to decode token");
      return;
    }

    const fetchRideDetails = async () => {
      if (!rideId) {
        setError("Missing ride ID");
        return;
      }

      try {
        const res = await fetch(`/api/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch ride");
        }

        const rideData = await res.json();
        setRidePostedBy(rideData.user_id?._id || rideData.user_id);
        setJoinedUsers(rideData.joinedUserIds || []);
      } catch (err) {
        setError("Failed to load ride details");
      }
    };

    fetchRideDetails();
  }, [rideId]);

  const handleAction = async (userId, status) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/rides/${rideId}/user/${userId}/status`, {
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

  return (
    <div className="user-profile">
      <h2>Ride Confirmation</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Joined Users</h3>
      {joinedUsers.length > 0 ? (
        <div className="user-list">
          {joinedUsers.map((item) => {
            const user = item.user;
            const userId = user._id;
            const isRideOwner = String(userId) === String(ridePostedBy);

            return (
              <div className="user-card2" key={userId}>
                {isRideOwner && <span className="owner-tag">Ride Owner</span>}
                <p><strong>Full Name:</strong> {user.fullname?.firstname} {user.fullname?.lastname}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {!isRideOwner && (
                  <p><strong>Status:</strong> {item.status}</p>
                )}
                {isOwner && !isRideOwner && (
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
        !error && <p>No users have joined this ride.</p>
      )}
    </div>
  );
};

export default RideConfirmation; 