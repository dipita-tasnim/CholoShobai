import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

const fmtDateTime = (x) => {
  if (!x) return "";
  const d = new Date(x);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data);
        const seenAt = localStorage.getItem("notifications_seen_at");
        const seenTime = seenAt ? new Date(seenAt).getTime() : 0;
        setUnread(data.filter((n) => new Date(n.createdAt).getTime() > seenTime).length);
      } catch (e) {
        /* ignore */
      }
    };
    fetchNotifications();
  }, [token]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      localStorage.setItem("notifications_seen_at", new Date().toISOString());
      setUnread(0);
    }
  };

  if (!token) return null;

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={toggle}
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">Notifications</div>
          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-dropdown-empty">No notifications yet.</div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div className="notif-dropdown-item" key={n._id}>
                  {n.title && <div className="notif-dropdown-title">{n.title}</div>}
                  <div className="notif-dropdown-msg">{n.message}</div>
                  <div className="notif-dropdown-meta">
                    {n.createdByName ? `${n.createdByName} · ` : ""}{fmtDateTime(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <Link to="/notifications" className="notif-dropdown-all" onClick={() => setOpen(false)}>
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
