import { useEffect, useState,useRef } from "react";
import "./css/Dashboard.css";
import apiClient from "../service/Api";
import BmiResultsDisplay from './BmiResultsDisplay';
import { getUserTasks } from './BMIHelper';

export default function Dashboard() {
  const userdt = sessionStorage.getItem("userdata") || "{}";
  const parsedData = JSON.parse(userdt);
  const userId = parsedData.email || "TestUser";
const age = parsedData.age; 
const pregnancyMonth= parsedData.pregnancyMonth; 
const working = parsedData.working;           
const height = parsedData.height;               
const weight= parsedData.weight;  

  const effectRan = useRef(false); 

  const today = new Date().toISOString().split("T")[0];

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8);
  const [waterLoading, setWaterLoading] = useState(true);

  const tips={
  "1": "Start taking folic acid daily to support your baby’s brain and spine development.",
  "2": "Eat small, frequent meals and stay hydrated to reduce morning sickness.",
  "3": "Avoid caffeine, smoking, and alcohol completely to protect your baby’s organ development.",
  "4": "Your energy may improve now—start light activities like walking or prenatal yoga.",
  "5": "You may feel your baby move for the first time—schedule your anatomy scan.",
  "6": "Your baby can hear sounds now—try talking, singing, or playing gentle music.",
  "7": "Increase iron and calcium intake as your baby gains weight rapidly.",
  "8": "Sleep on your left side to improve blood flow to your baby.",
  "9": "Pack your hospital bag and learn the signs of labor—your baby is almost ready!"
}
  const moods = [
    { emoji: "😊", label: "Happy", value: "happy" },
    { emoji: "😌", label: "Calm", value: "calm" },
    { emoji: "😴", label: "Tired", value: "tired" },
    { emoji: "😰", label: "Anxious", value: "anxious" },
    { emoji: "🤢", label: "Unwell", value: "unwell" },
  ];



  // LOAD TASKS
  

const appUserData = {
    age: age, 
    pregnancyMonth: pregnancyMonth,
    working: working,
    height: height,
    weight: weight,
};

const dailyTaskList = getUserTasks(appUserData);


  useEffect(() => {
     if (!effectRan.current) {
      loadTasks();
      loadWaterIntake();
      loadMood();
      effectRan.current = true;
     }
  }, []);
  
  const loadTasks = async () => {
    try {
      const res = await apiClient.get(`/tasks`, {
        params: { userId, date: today },
      });

      const existingTasks = res.data.tasks || [];

      if (existingTasks.length === 0) {
        await initializeDefaultTasks();
      } else {
        setTasks(existingTasks);
      }
    } catch (e) {
      console.error("Error loading tasks:", e);
      setTasks(dailyTaskList.map((t, i) => ({ ...t, id: i, completed: false })));
    } finally {
      setLoading(false);
    }
  };

  // INITIALIZE DEFAULT TASKS

  const initializeDefaultTasks = async () => {
    try {

      await apiClient.post(`/tasks/`+ userId + '/' +today, {
        tasks:dailyTaskList
        })

      await loadTasks();
    } catch (e) {
      console.error("Error initializing default tasks:", e);
    }
  };

  
  // LOAD WATER INTAKE

  const loadWaterIntake = async () => {
    try {
      const res = await apiClient.get(`/waterintake`, {
        params: { userId, date: today },
      });

      if (res.data.data) {
        const glasses = Math.floor(res.data.data.currentIntake / 250);
        setWaterIntake(glasses);
        const goalGlasses = Math.floor(res.data.data.goalIntake / 250);
        setWaterGoal(goalGlasses);

        if (res.data.message && res.data.message.includes("New day")) {
          console.log("🌅 New day started! Water intake reset to 0");
        }
      }
    } catch (e) {
      console.error("Error loading water intake:", e);
      setWaterIntake(0);
      setWaterGoal(8);
    } finally {
      setWaterLoading(false);
    }
  };

  
  // LOAD MOOD
 
  const loadMood = async () => {
    try {
      const res = await apiClient.get(`/mood`, {
        params: { userId, date: today },
      });
      
      if (res.data.data) {
        setCurrentMood(res.data.data.mood);
      }
    } catch (e) {
      console.error("Error loading mood:", e);
    }
  };



  // ADD CUSTOM TASK
 
  const openAddModal = () => {
    setShowAddModal(true);
    setNewTaskTitle("");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !newTaskTitle.trim()) {
      alert("Please enter a task title!");
      return;
    }

    try {

      await apiClient.post(`/tasks/`+ userId + '/' +today, {
        tasks:[{      
        emoji: "📝",
        title: newTaskTitle.trim(),
        time: "Anytime",
        completed: false,
        isPreset: false,
      }]
        })

      setShowAddModal(false);
      setNewTaskTitle("");
      loadTasks();
    } catch (e) {
      console.error("Add task error:", e);
      alert("Failed to add task. Please try again.");
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewTaskTitle("");
  };


  // TOGGLE COMPLETE
 
  const toggleComplete = async (task) => {
    try {
      await apiClient.patch(
        `/tasks/${task.id}`,
        { completed: !task.completed },
        { params: { userId, date: today } }
      );

      loadTasks();
    } catch (e) {
      console.error("Toggle complete error:", e);
    }
  };


  // DELETE A TASK
 
  const openDeleteModal = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      await apiClient.delete(`/tasks/${taskToDelete.id}`, {
        params: { userId, date: today },
      });

      setShowDeleteModal(false);
      setTaskToDelete(null);
      loadTasks();
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete task. Please try again.");
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

 
  // HANDLE MOOD SELECTION
 
  const handleMoodSelect = async (moodValue) => {
    try {
      await apiClient.post(`/mood`, {
        userId,
        date: today,
        mood: moodValue,
      });
      setCurrentMood(moodValue);
    } catch (e) {
      console.error("Error saving mood:", e);
      
      setCurrentMood(moodValue);
    }
  };


  // WATER INTAKE HANDLERS

  const increaseWater = async () => {
    if (waterIntake < waterGoal) {
      try {
      
        await apiClient.patch(
          `/waterintake/add`,
          { amount: 250 },
          { params: { userId, date: today } }
        );
        setWaterIntake(waterIntake + 1);
      } catch (e) {
        console.error("Error increasing water intake:", e);
      }
    }
  };

  const decreaseWater = async () => {
    if (waterIntake > 0) {
      try {
     
        await apiClient.patch(
          `/waterintake/add`,
          { amount: -250 },
          { params: { userId, date: today } }
        );
        setWaterIntake(waterIntake - 1);
      } catch (e) {
        console.error("Error decreasing water intake:", e);
      }
    }
  };

  
  // COUNTS
 
  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPercentage =
    tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;
  const waterPercentage = waterGoal === 0 ? 0 : (waterIntake / waterGoal) * 100;

 
  // UI RETURN

  return (
    <div className="dashboard-wrapper">
 
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
    
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">✨</div>
              <h2 className="modal-title">Add New Task</h2>
              <p className="modal-subtitle">
                What would you like to accomplish today?
              </p>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="e.g., Read a pregnancy book"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel-btn" onClick={closeAddModal}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={handleAddTask}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}


      {showDeleteModal && taskToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div
            className="modal-container delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header delete-header">
              <div className="modal-icon">🗑️</div>
              <h2 className="modal-title">Delete Task?</h2>
              <p className="modal-subtitle">
                {taskToDelete.isPreset
                  ? "This is a preset task. Are you sure you want to delete it?"
                  : "Are you sure you want to delete this task?"}
              </p>
            </div>

            <div className="modal-body">
              <div className="delete-task-preview">
                <div className="task-emoji">{taskToDelete.emoji}</div>
                <div>
                  <div className="delete-task-title">{taskToDelete.title}</div>
                  <div className="delete-task-time">{taskToDelete.time}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button className="modal-btn delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="welcome-header">
        <h1>Welcome Mama!</h1>
      </div>
      <div className="welcome-header">
    
        <BmiResultsDisplay userData={appUserData} />
      </div>

      <div className="top-cards">

        <div className="card water-card">
          <span className="water-label">Water Intake 💧</span>
          {waterLoading ? (
            <div className="water-value">Loading...</div>
          ) : (
            <>
              <div className="water-value">
                {waterIntake}/{waterGoal} glasses
              </div>
              <div className="water-ml-value">
                {waterIntake * 250}ml / {waterGoal * 250}ml
              </div>
              <div className="water-bar">
                <div
                  className="water-fill"
                  style={{ width: `${waterPercentage}%` }}
                ></div>
              </div>
              <div className="water-controls">
                <button
                  className="water-btn"
                  onClick={decreaseWater}
                  disabled={waterIntake === 0}
                >
                  −
                </button>
                <button
                  className="water-btn"
                  onClick={increaseWater}
                  disabled={waterIntake >= waterGoal}
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>


        <div className="card tasks-card">
          <span className="tasks-label">Daily Tasks</span>
          <div className="tasks-value">
            {completedCount}/{tasks.length}
          </div>
          <div className="tasks-bar">
            <div
              className="tasks-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>


      <div className="section-card tasks-section">
        <div className="section-header">
          <h3>📅 Today's Tasks</h3>
          <button className="add-btn" onClick={openAddModal}>
            + Add
          </button>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : tasks.length === 0 ? (
          <p>No tasks added yet.</p>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div
                className={`task-item ${task.completed ? "completed" : ""}`}
                key={task.id}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task)}
                />

                <div className="task-emoji">{task.emoji}</div>

                <div className="task-details">
                  <div className="task-title">{task.title}</div>
                  <div className="task-time">{task.time}</div>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => openDeleteModal(task)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="feelings-card">
        <h3>😊 How are you feeling today?</h3>
        <div className="feelings-row">
          {moods.map((mood) => (
            <button
              key={mood.value}
              className={`mood-btn ${
                currentMood === mood.value ? "selected" : ""
              }`}
              onClick={() => handleMoodSelect(mood.value)}
            >
              <div className="mood-emoji">{mood.emoji}</div>
              <div className="mood-label">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>



      <div className="tip-card">
        <h3>💡 Tip of the month</h3>
        <p>
          {tips[pregnancyMonth] || "Stay positive and take care of yourself!"}
        </p>
      </div>

      <div className="affirm-card">
        <h3>💖 Daily Affirmation</h3>
        <p>
          "I am strong, capable, and creating life. Every day my body does
          amazing things for my baby."
        </p>
      </div>
    </div>
  );
}
