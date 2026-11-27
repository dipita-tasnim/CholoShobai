// Counts requests that are waiting on the server so the app can show a
// loading bar while any of them is in flight.
//
// It wraps window.fetch once. Background requests (such as the notification
// bell's polling) pass `trackLoading: false` in the fetch options so they do
// not flash the bar on their own.

let pending = 0;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn(pending));

export const subscribeLoading = (fn) => {
  listeners.add(fn);
  fn(pending);
  return () => listeners.delete(fn);
};

export const installFetchTracker = () => {
  if (typeof window === 'undefined' || window.fetch.__tracked) return;
  const originalFetch = window.fetch.bind(window);

  const trackedFetch = (input, init = {}) => {
    const { trackLoading = true, ...rest } = init || {};
    if (!trackLoading) return originalFetch(input, rest);

    pending += 1;
    emit();
    return originalFetch(input, rest).finally(() => {
      pending = Math.max(0, pending - 1);
      emit();
    });
  };

  trackedFetch.__tracked = true;
  window.fetch = trackedFetch;
};
