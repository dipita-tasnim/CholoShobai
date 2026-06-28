import { useEffect, useState } from "react";
import { API_BASE } from "../config";

const initialsOf = (first = "", last = "") =>
  ((first[0] || "") + (last[0] || "")).toUpperCase() || "?";

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", phone: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

  const startEdit = () => {
    setForm({
      firstname: user.fullname?.firstname || "",
      lastname: user.fullname?.lastname || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setError(null);
    setSuccess(null);
    setEditing(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.firstname.trim().length < 3) {
      setError("First name must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message || "Failed to update profile.");
        return;
      }
      setUser(json);
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.fullname?.firstname || ""} ${user.fullname?.lastname || ""}`.trim();

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {initialsOf(user.fullname?.firstname, user.fullname?.lastname)}
          </div>
          <div className="profile-heading">
            <h2>{fullName || "My Profile"}</h2>
            <span className="profile-sub">{user.email}</span>
          </div>
        </div>

        {success && <div className="profile-success">{success}</div>}
        {error && editing && <div className="profile-error">{error}</div>}

        {!editing ? (
          <>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="profile-label">Full Name</span>
                <span className="profile-value">{fullName || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Phone</span>
                <span className="profile-value">
                  {user.phone ? user.phone : <span className="profile-muted">Not added</span>}
                </span>
              </div>
            </div>
            <button className="profile-edit-btn" onClick={startEdit}>Edit Profile</button>
          </>
        ) : (
          <form className="profile-form" onSubmit={handleSave}>
            <label>First Name</label>
            <input name="firstname" value={form.firstname} onChange={handleChange} required />

            <label>Last Name</label>
            <input name="lastname" value={form.lastname} onChange={handleChange} />

            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />

            <label>Phone</label>
            <input name="phone" type="tel" placeholder="Add your phone number" value={form.phone} onChange={handleChange} />

            <div className="profile-actions">
              <button type="submit" className="profile-save-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => { setEditing(false); setError(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
