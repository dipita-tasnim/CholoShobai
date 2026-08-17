import { useEffect, useMemo, useRef, useState } from "react";
import { DHAKA_LOCATIONS } from "../data/dhakaLocations";

// Location field for Dhaka district: type freely and pick from the matching
// suggestions, or keep typing to add detail the list does not cover.
const LocationSelect = ({
    value,
    onChange,
    placeholder = "Select a location",
    required = false,
    exclude = "",
    id
}) => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    // Filtering only applies while the user is typing. After a place is
    // picked, the field holds a complete name, so filtering by it would
    // leave a list of exactly one entry.
    const [filtering, setFiltering] = useState(false);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const skipNextFocusRef = useRef(false);

    const groups = useMemo(() => {
        const search = filtering ? value.trim().toLowerCase() : "";
        return DHAKA_LOCATIONS
            .map((group) => ({
                district: group.district,
                places: group.places.filter(
                    (place) =>
                        place !== exclude &&
                        (search === "" ||
                            place.toLowerCase().includes(search) ||
                            group.district.toLowerCase().includes(search))
                )
            }))
            .filter((group) => group.places.length > 0);
    }, [value, exclude, filtering]);

    // Flat list of the visible places so arrow keys can walk across groups.
    const suggestions = useMemo(
        () => groups.flatMap((group) => group.places),
        [groups]
    );

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Keep the highlighted suggestion inside the scrollable list.
    useEffect(() => {
        if (!open || activeIndex < 0 || !listRef.current) return;
        const active = listRef.current.querySelector(".location-option.is-active");
        if (active) active.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    const handleChange = (e) => {
        onChange(e.target.value);
        setActiveIndex(-1);
        setFiltering(true);
        setOpen(true);
    };

    const select = (place) => {
        onChange(place);
        setActiveIndex(-1);
        setFiltering(false);
        setOpen(false);
        // Leave the cursor in the field so extra detail can be typed right
        // away, without the focus re-opening the list we just closed.
        skipNextFocusRef.current = true;
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        if (skipNextFocusRef.current) {
            skipNextFocusRef.current = false;
            return;
        }
        setOpen(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (suggestions.length === 0) return;
            e.preventDefault();
            if (!open) {
                setOpen(true);
                return;
            }
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((prev) => {
                const next = prev + step;
                if (next < 0) return suggestions.length - 1;
                if (next >= suggestions.length) return 0;
                return next;
            });
        } else if (e.key === "Enter") {
            // Only hijack Enter while a suggestion is highlighted, so the form
            // can still be submitted from a plain typed value.
            if (open && activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                select(suggestions[activeIndex]);
            }
        } else if (e.key === "Escape") {
            if (open) {
                e.preventDefault();
                setOpen(false);
            }
        }
    };

    const showDropdown = open && suggestions.length > 0;
    let optionIndex = -1;

    return (
        <div className="location-select" ref={wrapperRef}>
            <input
                id={id}
                ref={inputRef}
                type="text"
                className="location-select-input"
                placeholder={placeholder}
                value={value}
                required={required}
                autoComplete="off"
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
            />

            {showDropdown && (
                <div className="location-dropdown" ref={listRef}>
                    {groups.map((group) => (
                        <div key={group.district} className="location-group">
                            <div className="location-group-title">{group.district}</div>
                            {group.places.map((place) => {
                                optionIndex += 1;
                                const index = optionIndex;
                                return (
                                    <button
                                        key={place}
                                        type="button"
                                        className={`location-option ${
                                            index === activeIndex ? "is-active" : ""
                                        } ${place === value ? "is-selected" : ""}`}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => select(place)}
                                    >
                                        {place}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LocationSelect;
