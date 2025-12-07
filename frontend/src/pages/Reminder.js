import React, { useState, useEffect } from "react";
import "./css/Reminder.css";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default function Reminder() {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    category: "appointment",
    repeat: "none",
  });

  const apiURL = process.env.REACT_APP_API_URL;
  const uuss = sessionStorage.getItem("userdata") || "{}";
  const parsedData = JSON.parse(uuss);
  const userId = parsedData.email || "TestUser";

  const loadreminder = async () => {
    try {
      const res = await axios.get(`${apiURL}/getreminder`, { params: { userId } });
      setReminders(res.data.reminders || []);
    } catch (e) {
      alert("Please try again later");
    }
  };

  useEffect(() => {
    loadreminder();
  }, []);

  // Check reminders for in-app notification
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setCurrentTime(now);

      reminders.forEach((reminder) => {
        if (reminder.acknowledged) return;

        const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
        const timeDiff = reminderDateTime - now;

        const notificationMinutes = [30, 25, 20, 15, 10, 5, 0];

        notificationMinutes.forEach((targetMinutes) => {
          const notifKey = `notified_${targetMinutes}`;
          const targetTimeDiff = targetMinutes * 60000;
          const differenceFromTarget = Math.abs(timeDiff - targetTimeDiff);
          const isAtOrPastTargetTime = timeDiff <= targetTimeDiff;

          if (differenceFromTarget <= 30000 && isAtOrPastTargetTime && !reminder[notifKey]) {
            const notifMessage =
              targetMinutes === 0
                ? `${reminder.title}${reminder.description ? " - " + reminder.description : ""} NOW!`
                : `${reminder.title}${reminder.description ? " - " + reminder.description : ""} in ${targetMinutes} minutes`;

            // In-app notification only
            setInAppNotification({
              id: reminder.id,
              title: reminder.title,
              message: notifMessage,
              time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            });

            setTimeout(() => setInAppNotification(null), 10000);

            setReminders((prev) =>
              prev.map((r) => (r.id === reminder.id ? { ...r, [notifKey]: true } : r))
            );
          }
        });
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [reminders]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      try {
        await axios.put(`${apiURL}/updatereminder/${editingId}`, { userId, ...formData }, { params: { userId } });
        loadreminder();
        alert("Updated reminder successfully.");
      } catch (e) {
        console.error("Edit reminder error:", e);
      }
      setEditingId(null);
    } else {
      try {
        await axios.post(`${apiURL}/createreminder`, { userId, ...formData });
        loadreminder();
        alert("Added reminder successfully.");
      } catch (err) {
        alert(err.response?.data?.message || "Add reminder failed. Please try again.");
      }

      const newReminder = {
        ...formData,
        id: Date.now(),
        notified: false,
        acknowledged: false,
        createdAt: new Date().toISOString(),
      };
      setReminders((prev) => [...prev, newReminder]);
    }

    setFormData({ title: "", description: "", date: "", time: "", category: "appointment", repeat: "none" });
    setShowForm(false);
  };

  const handleEdit = (reminder) => {
    setFormData({ ...reminder });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await axios.delete(`${apiURL}/deletereminder/${id}`, { params: { userId } });
        loadreminder();
      } catch (e) {
        alert("Failed to delete reminder. Please try again.");
      }
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleCancel = () => {
    setFormData({ title: "", description: "", date: "", time: "", category: "appointment", repeat: "none" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDismissNotifications = (reminderId) => {
    setReminders((prev) => prev.map((r) => (r.id === reminderId ? { ...r, acknowledged: true } : r)));
    setInAppNotification(null);
  };

  const getCategoryIcon = (category) => {
    const icons = { appointment: "🏥", medication: "💊", exercise: "🤸‍♀️", checkup: "📋", other: "📌" };
    return icons[category] || "📌";
  };

  const sortedReminders = [...reminders].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const upcomingReminders = sortedReminders.filter((r) => new Date(`${r.date}T${r.time}`) > currentTime);
  const pastReminders = sortedReminders.filter((r) => new Date(`${r.date}T${r.time}`) <= currentTime);

  return (
    <div className="reminder-container">
      {inAppNotification && (
        <div style={{ position: "fixed", top: "20px", right: "20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 9999, minWidth: "320px", animation: "slideIn 0.3s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔔</div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>{inAppNotification.title}</h3>
              <p style={{ margin: "0 0 0.5rem 0" }}>{inAppNotification.message}</p>
              <small style={{ opacity: 0.8 }}>{inAppNotification.time}</small>
            </div>
            <button onClick={() => setInAppNotification(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", cursor: "pointer", width: "30px", height: "30px", flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => handleDismissNotifications(inAppNotification.id)} style={{ background: "rgba(255,255,255,0.9)", color: "#667eea", border: "none", padding: "0.6rem 1rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", flex: 1 }}>🔕 Dismiss All</button>
          </div>
        </div>
      )}

      <div className="reminder-header">
        <h2>📅 Health Reminders</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className="btn-add-reminder" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Add Reminder"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="reminder-form-card">
          <h3>{editingId ? "Edit Reminder" : "Create New Reminder"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Doctor's Appointment" required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional details..." rows="3" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="time">Time *</label>
                <input type="time" id="time" name="time" value={formData.time} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="appointment">Appointment</option>
                  <option value="medication">Medication</option>
                  <option value="exercise">Exercise</option>
                  <option value="checkup">Check-up</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="repeat">Repeat</label>
                <select id="repeat" name="repeat" value={formData.repeat} onChange={handleInputChange}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn-submit">{editingId ? "Update Reminder" : "Create Reminder"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="reminders-list">
        {upcomingReminders.length === 0 && pastReminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No reminders yet</h3>
            <p>Create your first health reminder to stay on track!</p>
          </div>
        ) : (
          <>
            {upcomingReminders.length > 0 && (
              <div className="reminder-section">
                <h3 className="section-title">Upcoming Reminders ({upcomingReminders.length})</h3>
                <div className="reminder-cards">
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="reminder-card upcoming">
                      <div className="reminder-icon">{getCategoryIcon(reminder.category)}</div>
                      <div className="reminder-content">
                        <h4>{reminder.title}{reminder.acknowledged && <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", color: "#4CAF50" }}>✓</span>}</h4>
                        {reminder.description && <p className="reminder-description">{reminder.description}</p>}
                        <div className="reminder-meta">
                          <span className="reminder-date">📅{dayjs(reminder.date).local().format("ddd, MMM D, YYYY")}</span>
                          <span className="reminder-time">🕐 {reminder.time}</span>
                          <span className={`reminder-category category-${reminder.category}`}>{reminder.category}</span>
                          {reminder.repeat !== "none" && <span className="reminder-repeat">🔄 {reminder.repeat}</span>}
                        </div>
                      </div>
                      <div className="reminder-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleEdit(reminder)} title="Edit">✏️</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(reminder.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pastReminders.length > 0 && (
              <div className="reminder-section">
                <h3 className="section-title">Past Reminders ({pastReminders.length})</h3>
                <div className="reminder-cards">
                  {pastReminders.map((reminder) => (
                    <div key={reminder.id} className="reminder-card past">
                      <div className="reminder-icon">{getCategoryIcon(reminder.category)}</div>
                      <div className="reminder-content">
                        <h4>{reminder.title}</h4>
                        {reminder.description && <p className="reminder-description">{reminder.description}</p>}
                        <div className="reminder-meta">
                          <span className="reminder-date">{dayjs(reminder.date).local().format("ddd, MMM D, YYYY")}</span>
                          <span className="reminder-time">🕐 {reminder.time}</span>
                          <span className={`reminder-category category-${reminder.category}`}>{reminder.category}</span>
                        </div>
                      </div>
                      <div className="reminder-actions">
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(reminder.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
