import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  
  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch users data
        const usersResponse = await fetch('/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (usersResponse.status === 403) {
          // Not an admin
          setIsAdmin(false);
          return;
        }

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users data');
        }

        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Fetch ratings data
        const ratingsResponse = await fetch('/admin/ratings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!ratingsResponse.ok) {
          throw new Error('Failed to fetch ratings data');
        }

        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData);

      } catch (err) {
        setError(err.message || 'An error occurred while loading admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete user');
        }

        // Remove user from state
        setUsers(users.filter(user => user._id !== userId));
        
        // Also remove any ratings associated with this user
        setRatings(ratings.filter(rating => 
          rating.ratedUserId._id !== userId && rating.raterUserId._id !== userId
        ));
        
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/admin/ratings/${ratingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete rating');
        }

        // Remove rating from state
        setRatings(ratings.filter(rating => rating._id !== ratingId));
        
      } catch (err) {
        setError(err.message || 'Failed to delete rating');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/users/${userId}/update-role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update user role');
      }

      const { user: updatedUser } = await response.json();
      
      // Update user in state
      setUsers(users.map(u => u._id === userId ? { ...u, role: updatedUser.role } : u));
      
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  if (!isAdmin) {
    return <Navigate to="/home" />;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Ratings
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="users-panel">
          <h2>Manage Users</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    {user.fullname.firstname} {user.fullname.lastname}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`role-button ${user.role}`}
                        onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}
                      >
                        Make {user.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ratings' && (
        <div className="ratings-panel">
          <h2>Manage Ratings</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Rated</th>
                <th>Rated By</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map(rating => (
                <tr key={rating._id}>
                  <td>
                    {rating.ratedUserId.fullname.firstname} {rating.ratedUserId.fullname.lastname}
                  </td>
                  <td>
                    {rating.raterUserId.fullname.firstname} {rating.raterUserId.fullname.lastname}
                  </td>
                  <td className="rating-stars">
                    {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                  </td>
                  <td className="rating-comment">{rating.comment || '—'}</td>
                  <td>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteRating(rating._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;