import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

// components
import RideDetails from "../components/RideDetails";
import DateTimeField from "../components/DateTimeField";
import { API_BASE } from "../config";
import {
  formatDateDisplay,
  formatTimeDisplay,
  toRideDate,
  toRideTime,
} from "../utils/datetime";

export default function Home() {
  const [rides, setRides] = useState(null);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    preference: ''
  });

  const fetchRides = async (params = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Handling search
    try {
      // Same helpers the post form uses, so a search matches what was saved.
      const formattedParams = {
        ...params,
        date: toRideDate(params.date),
        time: toRideTime(params.time)
      };

      const queryString = new URLSearchParams(formattedParams).toString();
      const response = await fetch(`${API_BASE}/api/rides?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const json = await response.json();
      if (response.ok) {
        setRides(json);
      }
    } catch (err) {
      console.error("Error fetching rides:", err);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRides(searchParams);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="home-wrapper">
      {/* Intro box */}
      <div className="home-card">
        <div className="home-header">
          <div>
            <h2 className="home-title">Share Your Route, Share the Cost</h2>
            <p className="home-subtext">
              Need to head somewhere? Create a post and find friends to share the journey with. It's fast, easy, and safe!
            </p>
          </div>
          <Link to="/create">
            <button className="create-new-post-button">+ Create New Post</button>
          </Link>
        </div>
      </div>

      {/* Search Bar Section */}
      <form onSubmit={handleSearch} className="search-bar-section">
        <div className="search-field-group">
          <label className="search-label">From</label>
          <input
            type="text"
            name="from"
            className="search-field"
            placeholder="Starting point"
            value={searchParams.from}
            onChange={handleInputChange}
          />
        </div>
        <div className="search-field-group">
          <label className="search-label">To</label>
          <input
            type="text"
            name="to"
            className="search-field"
            placeholder="Destination"
            value={searchParams.to}
            onChange={handleInputChange}
          />
        </div>
        <div className="search-field-group">
          <label className="search-label" htmlFor="search-date">Date</label>
          <DateTimeField
            id="search-date"
            type="date"
            className="is-compact"
            value={searchParams.date}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, date: v }))}
            display={formatDateDisplay(searchParams.date)}
            placeholder="Any date"
          />
        </div>
        <div className="search-field-group">
          <label className="search-label" htmlFor="search-time">Time</label>
          <DateTimeField
            id="search-time"
            type="time"
            className="is-compact"
            value={searchParams.time}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, time: v }))}
            display={formatTimeDisplay(searchParams.time)}
            placeholder="Any time"
          />
        </div>
        <div className="search-field-group">
          <label className="search-label">Preference</label>
          <select
            name="preference"
            className={`search-field ${searchParams.preference === "" ? "is-placeholder" : ""}`}
            value={searchParams.preference}
            onChange={handleInputChange}
          >
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Both">Male, Female</option>
          </select>
        </div>
        <button type="submit" className="search-btn">Search</button>
      </form>

      {/* Ride listing */}
      <div className="ride-list">
        {rides && rides.map((ride) => (
          <RideDetails key={ride._id} ride={ride} />
        ))}
      </div>
    </div>
  );
}
