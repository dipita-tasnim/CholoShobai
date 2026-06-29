import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "../config";

const Sidebar = () => {

  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    
    const checkAdminStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setIsAdmin(decoded.role === 'admin');
        } catch (error) {
          console.error("Error decoding token:", error);
          setIsAdmin(false);
        }
      }
    };

    const fetchProfile = async () => {
      const token = localStorage.getItem('token'); // Get token from local storage
      if (token) {
        try {
          const response = await fetch(`${API_BASE}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const json = await response.json();

          if (response.ok) {
            const { firstname, lastname } = json.fullname; // Assuming the server returns `fullname`
            setUserName(`${firstname ?? ""} ${lastname ?? ""}`.trim());
          } else {
            setError(json.message || "Failed to fetch profile");
          }
        } catch (err) {
          setError("Failed to fetch profile");
        }
      }
    };

    checkAdminStatus();
    fetchProfile();

    }, []);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger toggle, shown only on mobile */}
      <button
        type="button"
        className="menu-toggle"
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Dim background while the drawer is open */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-container">
          <Link to="/" onClick={closeSidebar} className="sidebar-brand">
            <img
              src={`${process.env.PUBLIC_URL}/logo1.png`}
              alt="CholoShobai"
              className="sidebar-logo"
            />
            <h1 className="sidebar-title">CholoShobai</h1>
          </Link>

          <nav className="sidebar-nav" onClick={closeSidebar}>
            {isAdmin && (
              <Link to="/admin" className="sidebar-link admin-link">Admin Dashboard</Link>
            )}
            <Link to="/home" className="sidebar-link">Home</Link>
            <Link to="/profile" className="sidebar-link">Profile</Link>
            <Link to="/myrides" className="sidebar-link">My Rides</Link>
            <Link to="/search-users" className="sidebar-link">Rating</Link>
            <Link to="/logout" className="sidebar-link">Logout</Link>
          </nav>

          {/* Show logged-in user's name */}
          <div className="sidebar-user">
            {userName ? <>👤 {userName}</> : "Not logged in"}
          </div>

          {/* Show error message if there's an issue fetching the profile */}
          {error && <p>{error}</p>}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;