// Date and time formatting for ride posts.
//
// The month names are spelled out here rather than taken from toLocaleString
// so a phone set to another locale produces exactly the same text as a laptop.

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// "2026-08-17" (the value of an <input type="date">) -> [2026, 8, 17]
const splitDate = (value) => {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day || month < 1 || month > 12) return null;
    return [year, month, day];
};

// "16:30" (the value of an <input type="time">) -> [16, 30]
const splitTime = (value) => {
    const [hour, minute] = String(value || "").split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return [hour, minute];
};

// What the form shows once a date is picked: "17 August 2026"
export const formatDateDisplay = (value) => {
    const parts = splitDate(value);
    if (!parts) return "";
    const [year, month, day] = parts;
    return `${day} ${MONTHS[month - 1]} ${year}`;
};

// What the form shows once a time is picked: "04:30 pm"
export const formatTimeDisplay = (value) => {
    const parts = splitTime(value);
    if (!parts) return "";
    const [hour, minute] = parts;
    const suffix = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

// What gets stored on the ride: "17 August, 2026"
export const toRideDate = (value) => {
    const parts = splitDate(value);
    if (!parts) return "";
    const [year, month, day] = parts;
    return `${day} ${MONTHS[month - 1]}, ${year}`;
};

// What gets stored on the ride: "4.30 pm"
export const toRideTime = (value) => {
    const parts = splitTime(value);
    if (!parts) return "";
    const [hour, minute] = parts;
    const suffix = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${hour12}.${String(minute).padStart(2, "0")} ${suffix}`;
};
