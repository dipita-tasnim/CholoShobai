import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { getToken } from "../utils/auth";
import { READ_EVENT, SEEN_KEY, isUnread, markAllRead, readSeenTime } from "../utils/notifications";

// How often the bell re-checks for new notifications, in milliseconds.
const POLL_INTERVAL = 60000;

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
  const [seenTime, setSeenTime] = useState(readSeenTime);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const token = getToken();

  // Anything newer than the last "mark as read" counts as unread.
  const unread = notifications.filter((n) => isUnread(n, seenTime)).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch (e) {
      /* ignore */
    }
  }, [token]);

  // Poll so a new signup or announcement shows up without a page reload.
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [token, fetchNotifications]);

  // The notifications page (or another tab) may mark everything as read.
  useEffect(() => {
    const sync = () => setSeenTime(readSeenTime());
    const onStorage = (e) => {
      if (e.key === SEEN_KEY) sync();
    };
    window.addEventListener(READ_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(READ_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!token) return null;

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <span className="notif-dropdown-heading">
              Notifications
              {unread > 0 && <span className="notif-unread-count">{unread} new</span>}
            </span>
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
          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-dropdown-empty">No notifications yet.</div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  className={`notif-dropdown-item ${isUnread(n, seenTime) ? "is-unread" : ""}`}
                  key={n._id}
                >
                  {n.audience === "admin" && (
                    <span className="notif-tag">
                      {n.type === "new_user" ? "New user" : "Admin only"}
                    </span>
                  )}
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
