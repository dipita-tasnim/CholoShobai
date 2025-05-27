import { useEffect, useState } from "react";

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRideIds, setExpandedRideIds] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("/api/rides/myrides", {
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

      const response = await fetch(`/api/rides/${rideId}/status`, {
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

  return (
    <div className="my-rides">
      <h2>My Rides</h2>
      {error && <p className="error">{error}</p>}
      {rides.length === 0 && <p>No rides posted yet.</p>}

      {rides.map((ride) => {
        const isExpanded = expandedRideIds.includes(ride._id);

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
                <p><strong>Preference:</strong> {ride.preference}</p>
                <p><strong>Status:</strong> {ride.status || "closed"}</p>

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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyRides;