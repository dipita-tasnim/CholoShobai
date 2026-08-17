import { useRef } from "react";

// A native date/time input with our own text on top of it.
//
// Browsers render the value of <input type="date"> and <input type="time">
// in the locale of the device, so a phone can show "16:30" where a laptop
// shows "04:30 PM". That text cannot be styled, so the real input is laid
// over the field at zero opacity: taps and clicks still reach it and open
// the usual picker, while the label below is text we control.
const DateTimeField = ({ type, value, onChange, display, placeholder, required, id }) => {
    const inputRef = useRef(null);

    // Desktop browsers only open the picker from the small calendar/clock
    // icon, so ask for it explicitly. Not supported everywhere, and it
    // throws if the input is not user-activated, hence the guard.
    const openPicker = () => {
        const input = inputRef.current;
        if (!input) return;
        try {
            if (typeof input.showPicker === "function") input.showPicker();
        } catch (err) {
            /* the browser will still open its own picker on focus */
        }
    };

    return (
        <div className="datetime-field">
            <span className={`datetime-display ${value ? "" : "is-placeholder"}`}>
                {value ? display : placeholder}
            </span>
            <span className="datetime-icon" aria-hidden="true">
                {type === "date" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                )}
            </span>
            <input
                id={id}
                ref={inputRef}
                type={type}
                className="datetime-native"
                value={value}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                onClick={openPicker}
            />
        </div>
    );
};

export default DateTimeField;
