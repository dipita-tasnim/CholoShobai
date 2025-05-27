import { useState } from "react";
import { useNavigate } from 'react-router-dom';




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
        const response = await fetch('/api/rides', {
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

            <label>Starting Point:</label>
            <input
                type="text"
                onChange={(e) => setStartingPoint(e.target.value)}
                value={startingPoint}  
            />    

            <label>Destination:</label>
            <input
                type="text"
                onChange={(e) => setDestination(e.target.value)}
                value={destination}  
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
            <input
                type="text"
                onChange={(e) => setAvailableSlots(e.target.value)}
                value={availableSlots}
            />
            <label>Preference:</label>
            <input
                type="text"
                onChange={(e) => setPreference(e.target.value)}
                value={preference}
            />
            <button className="post-button">+ POST</button>
        </form>
    )
}

export default RideForm