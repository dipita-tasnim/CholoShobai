// Helpers for reading the logged-in user out of the stored JWT.
//
// Two things here are browser-sensitive and used to be done inline:
//   * localStorage throws (instead of returning null) in Firefox when the user
//     blocks site data, so every read is guarded.
//   * A JWT payload is base64url encoded and unpadded. atob() only accepts
//     standard, padded base64, so the payload has to be normalised first --
//     otherwise decoding fails for any token whose payload happens to contain
//     a "-" or "_", which is what made pages using it break on some browsers.

export const getToken = () => {
    try {
        return localStorage.getItem("token");
    } catch (err) {
        return null;
    }
};

export const decodeToken = (token) => {
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    try {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );

        // atob gives back one character per byte, so rebuild the UTF-8 text
        // to keep non-ASCII names intact.
        const bytes = atob(padded);
        const json = decodeURIComponent(
            Array.from(bytes, (ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
        );

        return JSON.parse(json);
    } catch (err) {
        return null;
    }
};

export const getCurrentUserId = () => decodeToken(getToken())?._id || null;
