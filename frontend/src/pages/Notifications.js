import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { getToken } from "../utils/auth";
import { READ_EVENT, isUnread, markAllRead, readSeenTime } from "../utils/notifications";

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
  const [seenTime, setSeenTime] = useState(readSeenTime);

  const unread = notifications.filter((n) => isUnread(n, seenTime)).length;

  useEffect(() => {
    const token = getToken();
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load notifications");
        setNotifications(await res.json());
      } catch (e) {
        setError("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Stay in step when the bell marks everything as read.
  useEffect(() => {
    const sync = () => setSeenTime(readSeenTime());
    window.addEventListener(READ_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(READ_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="notif-page">
      <div className="notif-page-head">
        <h2>
          Notifications
          {unread > 0 && <span className="notif-unread-count">{unread} new</span>}
        </h2>
        <button
          type="button"
          className="notif-mark-read"
          onClick={() => setSeenTime(markAllRead())}
          disabled={unread === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
          </svg>
          Mark all as read
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="notif-empty">No notifications yet.</p>
      )}

      <div className="notif-list">
        {notifications.map((n) => (
          <div className={`notif-card ${isUnread(n, seenTime) ? "is-unread" : ""}`} key={n._id}>
            {n.audience === "admin" && (
              <span className="notif-tag">
                {n.type === "new_user" ? "New user" : "Admin only"}
              </span>
            )}
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
