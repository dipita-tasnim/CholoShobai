import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import RatingForm from "../components/RatingForm";

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRideIds, setExpandedRideIds] = useState([]);
  const [ratingOpenIds, setRatingOpenIds] = useState([]);
  const [ratedUsers, setRatedUsers] = useState({});

  useEffect(() => {
    const fetchRides = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API_BASE}/api/rides/myrides`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await response.json();

        if (response.ok) {
          setRides(json);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError("Failed to fetch rides");
      }
    };

    fetchRides();
  }, []);

  const updateStatus = async (rideId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE}/api/rides/${rideId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRides((prevRides) =>
          prevRides.map((ride) =>
            ride._id === rideId ? { ...ride, status: newStatus } : ride
          )
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating ride status", err);
    }
  };

  const toggleDetails = (rideId) => {
    setExpandedRideIds((prev) =>
      prev.includes(rideId)
        ? prev.filter((id) => id !== rideId)
        : [...prev, rideId]
    );
  };

  const toggleRating = (rideId) => {
    setRatingOpenIds((prev) =>
      prev.includes(rideId)
        ? prev.filter((id) => id !== rideId)
        : [...prev, rideId]
    );
  };

  const handleRate = async (ratedUserId, { rating, comment }) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ratedUserId, rating, comment }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || "Failed to submit rating");
    }
    setRatedUsers((prev) => ({ ...prev, [ratedUserId]: true }));
  };

  return (
    <div className="my-rides">
      <h2>My Rides</h2>
      {error && <p className="error">{error}</p>}
      {rides.length === 0 && <p>No rides posted yet.</p>}

      {rides.map((ride) => {
        const isExpanded = expandedRideIds.includes(ride._id);
        const isRatingOpen = ratingOpenIds.includes(ride._id);
        const confirmed = (ride.joinedUserIds || []).filter(
          (j) => j.status === "confirmed" && j.user
        );

        return (
          <div key={ride._id} className="ride-card">
            <div className="ride-summary">
              <h3>
                {ride.startingPoint} ➡ {ride.destination}
              </h3>
              <button
                onClick={() => toggleDetails(ride._id)}
                className="view-details-button"
              >
                {isExpanded ? "Hide Details" : "View Details"}
              </button>
            </div>

            {isExpanded && (
              <div className="ride-details">
                <p><strong>Date:</strong> {ride.date}</p>
                <p><strong>Time:</strong> {ride.time}</p>
                <p><strong>Slots:</strong> {ride.availableSlots}</p>
                <p><strong>Preference:</strong> {ride.preference === "Both" ? "Male/Female" : ride.preference}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge status-${ride.status || "open"}`}>
                    {ride.status || "open"}
                  </span>
                </p>

                <div className="status-buttons">
                  <button
                    className={`status-button ${ride.status === "open" ? "active-open" : ""}`}
                    onClick={() => updateStatus(ride._id, "open")}
                  >
                    Open
                  </button>
                  <button
                    className={`status-button ${ride.status === "closed" ? "active-closed" : ""}`}
                    onClick={() => updateStatus(ride._id, "closed")}
                  >
                    Close
                  </button>
                </div>

                <button
                  type="button"
                  className="rating-toggle-button"
                  onClick={() => toggleRating(ride._id)}
                >
                  {isRatingOpen ? "Hide Rating & Feedback" : "Rating & Feedback"}
                </button>

                {isRatingOpen && (
                  <div className="rating-section">
                    <h4>Rate your confirmed companions</h4>
                    {confirmed.length === 0 ? (
                      <p className="rc-rating-meta">No confirmed companions to rate yet.</p>
                    ) : (
                      confirmed.map((j) => {
                        const comp = j.user;
                        const name = `${comp.fullname?.firstname || ""} ${comp.fullname?.lastname || ""}`.trim() || comp.email;
                        return (
                          <div className="rating-companion" key={comp._id}>
                            <div className="rating-companion-name">{name}</div>
                            {ratedUsers[comp._id] ? (
                              <p className="rating-success">Your rating has been submitted. Thank you.</p>
                            ) : (
                              <RatingForm onSubmitRating={(data) => handleRate(comp._id, data)} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyRides;
