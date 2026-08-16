// Read state for notifications.
//
// There is no per-user read flag on the server, so "read" is tracked locally
// as a timestamp: anything created after it is still unread. Marking as read
// fires an event as well, because the storage event only reaches other tabs.

export const SEEN_KEY = "notifications_seen_at";
export const READ_EVENT = "notifications-read";

export const readSeenTime = () => {
    try {
        const seenAt = localStorage.getItem(SEEN_KEY);
        return seenAt ? new Date(seenAt).getTime() : 0;
    } catch (e) {
        return 0;
    }
};

export const markAllRead = () => {
    const now = new Date();
    try {
        localStorage.setItem(SEEN_KEY, now.toISOString());
    } catch (e) {
        /* storage blocked: the count still clears for this session */
    }
    window.dispatchEvent(new Event(READ_EVENT));
    return now.getTime();
};

export const isUnread = (notification, seenTime) =>
    new Date(notification.createdAt).getTime() > seenTime;
