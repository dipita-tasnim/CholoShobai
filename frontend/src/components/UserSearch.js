import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users');
      }

      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const viewUserProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="user-search">
      <h2>Search Users to Rate</h2>
      <p>Find users by name or email and rate their profiles</p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="search-results">
        {users.length > 0 ? (
          <div className="users-list">
            {users.map(user => (
              <div key={user._id} className="user-card">
                <div className="user-info">
                  <h3>{user.fullname.firstname} {user.fullname.lastname}</h3>
                  <p>{user.email}</p>
                </div>
                <button 
                  onClick={() => viewUserProfile(user._id)}
                  className="view-profile-button"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery && !isLoading ? (
          <p>No users found. Try a different search term.</p>
        ) : null}
      </div>
    </div>
  );
};

export default UserSearch;