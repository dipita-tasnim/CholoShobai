// Date and time formatting for ride posts.
//
// The month names are spelled out here rather than taken from toLocaleString
// so a phone set to another locale produces exactly the same text as a laptop.

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// "2026-08-17" (the value of an <input type="date">) -> [2026, 8, 17]
// Anything else, including an empty field, gives null. The shape is checked
// with a pattern because Number("") is 0 rather than NaN, so arithmetic
// guards alone would let an empty value through.
const splitDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return [year, month, day];
};

// "16:30" (the value of an <input type="time">) -> [16, 30]
const splitTime = (value) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value || "").trim());
    if (!match) return null;
    const [hour, minute] = match.slice(1).map(Number);
    if (hour > 23 || minute > 59) return null;
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
