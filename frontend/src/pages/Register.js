import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Register.css';
import './css/Shared.css';
import apiClient from '../service/Api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pregnancyMonth, setPregnancyMonth] = useState('');
  const [working, setWorking] = useState(false);
  const [workHours, setWorkHours] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      const blobs = document.querySelectorAll('.blob');
      blobs.forEach((blob, i) => {
        const speed = 0.05 + i * 0.02;
        const x = (e.clientX - window.innerWidth / 2) * speed;
        const y = (e.clientY - window.innerHeight / 2) * speed;
        blob.style.transform = `translate(${x}px, ${y}px) scale(1.2)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const validatePassword = (pwd) => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(pwd);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validatePassword(password)) {
      setPasswordError(
        'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.'
      );
      return;
    }
    setPasswordError('');

    if (pregnancyMonth && (pregnancyMonth < 1 || pregnancyMonth > 9)) {
      setFormError('Pregnancy month must be between 1 and 9.');
      return;
    }
    if (working && workHours && (workHours < 1 || workHours > 16)) {
      setFormError('Work hours must be between 1 and 16.');
      return;
    }
    if (height && (height < 100 || height > 250)) {
      setFormError('Height must be between 100 and 250 cm.');
      return;
    }
    if (weight && (weight < 30 || weight > 200)) {
      setFormError('Weight must be between 30 and 200 kg.');
      return;
    }
    if (emergencyContact && !/^\d{10}$/.test(emergencyContact)) {
      setFormError('Emergency contact must be a 10-digit number.');
      return;
    }

   try {

        const response = await apiClient.post(
          `/register`, // Replace with your backend URL
          {
            "email": email,
            "name": name,
            "password": password,
            "pregnancyMonth": pregnancyMonth,
            "working": working,
            "workHours": workHours,
            "wakeTime": wakeTime,
            "sleepTime": sleepTime,
            "mealTime": mealTime,
            "emergencyContact": emergencyContact,
            "dueDate": dueDate,
            "height": height,
            "weight": weight
          }        
        );

       navigate("/");
      } catch (err) {
        setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
      }  
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
            <h2 className="text-center mb-4">Create Account</h2>
            <form onSubmit={handleRegister} className="register-form">
              <div className="form-grid">
                <div>
                  <label>Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label>Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {passwordError && <p className="error-text">{passwordError}</p>}
                </div>
                <div>
                  <label>Pregnancy month</label>
                  <input type="number" min="0" max="9" value={pregnancyMonth} onChange={(e) => setPregnancyMonth(e.target.value)} />
                </div>
                <div className="inline-field">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={working} onChange={(e) => setWorking(e.target.checked)} />
                    <span>Currently working?</span>
                  </label>
                  {working && (
                    <input type="number" min="1" max="16" placeholder="Work hours/day" value={workHours} onChange={(e) => setWorkHours(e.target.value)} />
                  )}
                </div>
                <div>
                  <label>Wake time</label>
                  <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                </div>
                <div>
                  <label>Sleep time</label>
                  <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                </div>
                <div>
                  <label>Meal time</label>
                  <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
                </div>
                <div>
                  <label>Emergency contact (10 digits)</label>
                  <input type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required/>
                </div>
                <div>
                  <label>Approximate due date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label>Height (cm)</label>
                  <input type="number" min="100" max="250" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div>
                  <label>Weight (kg)</label>
                  <input type="number" min="30" max="200" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
              {formError && <p className="error-text">{formError}</p>}
              <button type="submit">Register</button>
            </form>
            <div className="register-footer">
              <span>
                Already have an account? <Link to="/">Login</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
