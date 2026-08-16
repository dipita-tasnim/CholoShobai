import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { API_BASE } from "../config";
import LocationSelect from "./LocationSelect";




const RideForm = () => {
    const navigate = useNavigate();

    const [startingPoint, setStartingPoint] = useState("");
    const [destination, setDestination] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState("");
    const [preference, setPreference] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Format date and time to match the format in the database
        const formattedDate = date ? (() => {
            const dateObj = new Date(date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString('en-US', { month: 'long' });
            const year = dateObj.getFullYear();
            return `${day} ${month}, ${year}`;
        })() : '';
        
        const formattedTime = time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase().replace(':', '.') : '';

        const ride = {
            startingPoint,
            destination,
            date: formattedDate,
            time: formattedTime,
            availableSlots,
            preference
        };

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/rides`, {
            method: 'POST',
            body: JSON.stringify(ride),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok){
            setStartingPoint('')
            setDestination('')
            setDate('')
            setTime('')
            setAvailableSlots('')
            setPreference('')
            setError(null)
            navigate('/home')
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Create a New Post</h3>

            {error && <div className="error">{error}</div>}

            <label htmlFor="starting-point">Starting Point:</label>
            <LocationSelect
                id="starting-point"
                value={startingPoint}
                onChange={setStartingPoint}
                placeholder="Type or pick a starting point"
                exclude={destination}
                required
            />

            <label htmlFor="destination">Destination:</label>
            <LocationSelect
                id="destination"
                value={destination}
                onChange={setDestination}
                placeholder="Type or pick a destination"
                exclude={startingPoint}
                required
            />

            <label>Date:</label>
            <input
                type="date"
                onChange={(e) => setDate(e.target.value)}
                value={date}
            />
            <label>Time:</label>
            <input
                type="time"
                onChange={(e) => setTime(e.target.value)}
                value={time}
            />
            <label>Available Slots:</label>
            <select
                value={availableSlots}
                onChange={(e) => setAvailableSlots(e.target.value)}
                required
            >
                <option value="" disabled>Select number of slots</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
            <label>Preference (Male/Female):</label>
            <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                required
            >
                <option value="" disabled>Select preference</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Both">Male/Female</option>
            </select>
            <button className="post-button">+ POST</button>
        </form>
    )
}

export default RideForm