import { useEffect, useState } from "react";

const MyProfile = () => {
  const [user, setUser] = useState(null); // Only one user
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token'); // get token from local storage
      try {
        const response = await fetch('/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const json = await response.json();

        if (response.ok) {
          setUser(json);
        } else {
          setError(json.message || "Failed to fetch profile");
        }
      } catch (err) {
        setError("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="my-profile">
      <h2>My Profile</h2>
      {error && <p>{error}</p>}
      {user && (
        <div className="user-card3">
          <p><strong>Full Name:</strong> {user.fullname.firstname} {user.fullname.lastname}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
