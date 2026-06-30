import { useEffect, useState } from "react";
import { API_BASE } from "../config";

const fmtDateTime = (x) => {
  if (!x) return "";
  const d = new Date(x);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();
        setNotifications(data);
        // Mark everything as seen so the sidebar badge clears.
        localStorage.setItem("notifications_seen_at", new Date().toISOString());
      } catch (e) {
        setError("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="notif-page">
      <h2>Notifications</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="notif-empty">No notifications yet.</p>
      )}

      <div className="notif-list">
        {notifications.map((n) => (
          <div className="notif-card" key={n._id}>
            {n.title && <h3 className="notif-title">{n.title}</h3>}
            <p className="notif-message">{n.message}</p>
            <div className="notif-meta">
              {n.createdByName ? `${n.createdByName} · ` : ""}{fmtDateTime(n.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
