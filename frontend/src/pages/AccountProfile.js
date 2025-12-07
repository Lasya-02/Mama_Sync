import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Register.css";
import "./css/Shared.css";
import apiClient from "../service/Api";

import { useAuth } from '../contexts/AuthContext'; 

export default function AccountProfile() {

  const { logout } = useAuth(); 
  
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    email: "",
    name: "",
    pregnancyMonth: "",
    working: false,
    workHours: "",
    wakeTime: "",
    sleepTime: "",
    mealTime: "",
    emergencyContact: "",
    dueDate: "",
    height: "",
    weight: ""
  });

    const loaddata = async () => {
       try {
       const storedDataString = sessionStorage.getItem('userdata'); 
        const updateddata = await apiClient.get(
          `/user/`+JSON.parse(storedDataString)["email"]
        );     

        if(updateddata){
            setProfile(updateddata.data.userdata)
        }

      } catch (err) {
        alert("please try after sometime");
      }  
  
    }
   useEffect(() => {
   loaddata();
  }, []); 

  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation:
    if (profile.emergencyContact && !/^\d{10}$/.test(profile.emergencyContact)) {
      setError("Emergency contact must be a 10-digit number.");
      return;
    }
    if (profile.height && (profile.height < 100 || profile.height > 250)) {
      setError("Height must be between 100 and 250 cm.");
      return;
    }
    if (profile.weight && (profile.weight < 30 || profile.weight > 200)) {
      setError("Weight must be between 30 and 200 kg.");
      return;
    }
     try {

        const response = await apiClient.put(
          `/updateprofile`, 
          profile
        );

        alert("Profile updated successfully!");
        
      } catch (err) {
        alert("Profile not updated! please try after sometime");
      }  
  };

  const handleSignOut = () => {
   logout();
   navigate("/");
  };

  return (
    <div className="register-page">
      <div className="background-blobs">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`blob blob${i + 1}`}></div>
        ))}
      </div>

      <div className="register-content">
        <div className="register-right">
          <div className="register-box">
            <h2 className="text-center mb-4">Account Profile</h2>

            <form onSubmit={handleSave} className="register-form">
              <div className="form-grid">

                <div>
                  <label>Full name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <label>Email address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div>
                  <label>Pregnancy month</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={profile.pregnancyMonth}
                    onChange={(e) =>
                      handleChange("pregnancyMonth", e.target.value)
                    }
                  />
                </div>

                <div className="inline-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={profile.working}
                      onChange={(e) => handleChange("working", e.target.checked)}
                    />
                    <span>Currently working?</span>
                  </label>

                  {profile.working && (
                    <input
                      type="number"
                      min="1"
                      max="16"
                      placeholder="Work hours/day"
                      value={profile.workHours}
                      onChange={(e) => handleChange("workHours", e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label>Wake time</label>
                  <input
                    type="time"
                    value={profile.wakeTime}
                    onChange={(e) => handleChange("wakeTime", e.target.value)}
                  />
                </div>

                <div>
                  <label>Sleep time</label>
                  <input
                    type="time"
                    value={profile.sleepTime}
                    onChange={(e) => handleChange("sleepTime", e.target.value)}
                  />
                </div>

                <div>
                  <label>Meal time</label>
                  <input
                    type="time"
                    value={profile.mealTime}
                    onChange={(e) => handleChange("mealTime", e.target.value)}
                  />
                </div>

                <div>
                  <label>Emergency contact (10 digits)</label>
                  <input
                    type="tel"
                    value={profile.emergencyContact}
                    onChange={(e) =>
                      handleChange("emergencyContact", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label>Approximate due date</label>
                  <input
                    type="date"
                    value={profile.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                  />
                </div>

                <div>
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={profile.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>

                <div>
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={profile.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit">Save Changes</button>
            </form>

            <div className="register-footer" style={{ marginTop: "20px" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "#3478f6",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginRight: "12px",
                }}
              >
                ← Back to Dashboard
              </button>

              <button
                onClick={handleSignOut}
                style={{
                  background: "#ff4d4d",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
