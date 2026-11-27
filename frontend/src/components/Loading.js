import { useEffect, useState } from "react";
import { subscribeLoading } from "../utils/loadingTracker";

// Wait this long before showing the bar, so instant responses never flicker.
const SHOW_DELAY = 150;
// After this long, explain that the server may be starting up.
const SLOW_DELAY = 6000;

// Thin animated bar across the top of the page while any request is waiting,
// plus a friendly notice if the wait gets long.
export const TopLoadingBar = () => {
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => subscribeLoading((count) => setBusy(count > 0)), []);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      setSlow(false);
      return;
    }
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_DELAY);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(slowTimer);
    };
  }, [busy]);

  return (
    <>
      <div
        className={`top-loading-bar ${visible ? "is-active" : ""}`}
        role="progressbar"
        aria-hidden={!visible}
        aria-label="Loading"
      >
        <span className="top-loading-bar-fill" />
      </div>
      {visible && slow && (
        <div className="slow-loading-notice" role="status">
          <Spinner size="small" />
          <span>Waking up the server, this can take up to a minute the first time…</span>
        </div>
      )}
    </>
  );
};

export const Spinner = ({ size = "medium", label }) => (
  <span className={`spinner spinner-${size}`} role={label ? "status" : undefined} aria-label={label}>
    <span className="spinner-ring" aria-hidden="true" />
  </span>
);

// Centered spinner with a message, for a page that is waiting on its data.
export const PageLoader = ({ message = "Loading…" }) => (
  <div className="page-loader" role="status">
    <Spinner size="large" />
    <span className="page-loader-text">{message}</span>
  </div>
);

// Placeholder shaped like a ride card, shown while the ride list loads.
export const RideCardSkeleton = () => (
  <div className="ride-card skeleton-card" aria-hidden="true">
    <div className="skeleton-row">
      <span className="skeleton skeleton-circle" />
      <span className="skeleton skeleton-line" style={{ width: "28%" }} />
    </div>
    <div className="skeleton-row skeleton-spread">
      <span className="skeleton skeleton-line skeleton-thick" style={{ width: "32%" }} />
      <span className="skeleton skeleton-line skeleton-thick" style={{ width: "32%" }} />
    </div>
    <div className="skeleton-row skeleton-spread">
      <span className="skeleton skeleton-line" style={{ width: "18%" }} />
      <span className="skeleton skeleton-line" style={{ width: "18%" }} />
      <span className="skeleton skeleton-line" style={{ width: "18%" }} />
      <span className="skeleton skeleton-line" style={{ width: "18%" }} />
    </div>
  </div>
);

export const RideListSkeleton = ({ count = 3 }) => (
  <div role="status" aria-label="Loading rides">
    {Array.from({ length: count }, (_, i) => <RideCardSkeleton key={i} />)}
  </div>
);
