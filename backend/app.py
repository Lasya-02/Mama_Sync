from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI, HTTPException,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# from flask import request
from pydantic import BaseModel,EmailStr
from typing import Optional
from pymongo import MongoClient
from bson import ObjectId
import uvicorn
from database import mongo_db
import os


from userrepository import user_repository
from datetime import date, time
from dailytaskrepository import dailytask_repository
from waterintakerepository import waterintake_repository
from moodrepository import mood_repository
import jwt
from datetime import datetime, timedelta, timezone

app = FastAPI()

# instrument metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","http://127.0.0.1:8000","http://54.197.27.81:8000",  # optional if accessing by IP
        "http://ec2-54-197-27-81.compute-1.amazonaws.com:8000","http://ec2-54-197-27-81.compute-1.amazonaws.com","http://54.197.27.81"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#-------JWT-----
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_secret_key")
SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = "HS256"

#-----MONGODB CONNECTION----


tasks_collection = mongo_db.get_collection("daily_tasks")
forum_collection = mongo_db.get_collection("forum_posts")
reminder_collection = mongo_db.get_collection("reminder")
guide_collection = mongo_db.get_collection("guide")
waterintake_collection = mongo_db.get_collection("water_intake")
mood_collection = mongo_db.get_collection("mood_tracking")

    

# ---------- MODELS ----------
class TaskCreate(BaseModel):
    userId: str
    date: str               # "YYYY-MM-DD"
    emoji: str
    title: str
    time: str
    completed: bool = False
    isPreset: bool = False

class ForumPost(BaseModel):
    userId: str
    title: str
    content: str
    created_at: Optional[str] = None

class ForumReply(BaseModel):
    userId: str
    content: str
    created_at: Optional[str] = None

class ReminderData(BaseModel):
    userId: str
    title: str
    description: str
    date:str
    time: str
    category: str
    repeat: str

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegistration(BaseModel):
    email: EmailStr
    name: str
    password: str
    pregnancyMonth: int
    working: bool
    workHours: int
    wakeTime: str  # Pydantic v2 handles time objects
    sleepTime: str
    mealTime: str
    emergencyContact: str # Stored as a simple string for the number/info
    dueDate: str   # Pydantic v2 handles date objects
    height: float
    weight: float

class WaterIntakeData(BaseModel):
    userId: str
    date: str  # "YYYY-MM-DD"
    goalIntake: int  # in ml
    currentIntake: int = 0  # in ml

class WaterIntakeUpdate(BaseModel):
    amount: int  # amount to add in ml

class MoodData(BaseModel):
    userId: str
    date: str  # "YYYY-MM-DD"
    mood: str  # "happy", "calm", "tired", "anxious", "unwell"

# ---------- HELPERS ----------
def build_task_dict(task: TaskCreate) -> dict:
    """Create a new task object with its own id."""
    return {
        "id": str(ObjectId()),            # task-level id for frontend
        "emoji": task.emoji,
        "title": task.title,
        "time": task.time,
        "completed": task.completed,
        "isPreset": task.isPreset,
    }


def find_doc(user_id: str, date: str):
    return tasks_collection.find_one({"userId": user_id, "date": date})


def create_access_token(user_id: int):
    """Generates a JWT token that expires in 30 minutes."""
    to_encode = {"user_id": user_id}
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifies a JWT token and returns the payload if valid."""
    try:
        decoded_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_payload
    except jwt.ExpiredSignatureError:
        return None  # Token is expired
    except jwt.InvalidTokenError:
        return None  # Token is invalid

# ---------- ROUTES ----------

@app.post("/login",status_code=status.HTTP_200_OK)
def login_for_access_token(user_data: UserLogin):

    user_in_db = user_repository.find_by_email(user_data.email)
    #print(user_in_db)
    if not user_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if (user_data.password != user_in_db['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_in_db["_id"])

    return {"token":token,"user":user_in_db}

    #return JSONResponse(
    #    status_code=status.HTTP_200_OK,
    #    content={
    #        "message": "Login successful",
    #        "user_email": user_in_db['email'],
    #        "user_name" : user_in_db['name'],
    #        "user_id": user_in_db['_id']
    #        # "access_token": "your_generated_jwt_token_goes_here"
    #    }
    #)


@app.get("/users")
def get_user():
    return user_repository.find_all()

@app.get("/user/{id}")
def get_userbyid(id):
    return user_repository.find_by_id(id)

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegistration):

    #print(user_data)
    # Convert Pydantic model to a dictionary for PyMongo
    user_dict = user_data.model_dump()
    
    # Check if the user already exists in the database
    existing_user = user_repository.find_by_email(user_dict['email'])
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create the user using the repository (which handles hashing)
    user_id = user_repository.create(user_dict)
    
    # Return a success message and the new user ID
    return {"message": "User registered successfully", "user_id": user_id, "email": user_dict['email']}

@app.put("/updateprofile", status_code=status.HTTP_200_OK)
def update_user(user_data: UserRegistration):

    # Convert Pydantic model to a dictionary for PyMongo
    user_dict = user_data.model_dump()
    
    # Check if the user already exists in the database
    existing_user = user_repository.find_by_email(user_dict['email'])
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user not found"
        )
        
    # Create the user using the repository (which handles hashing)
    user_id = user_repository.update(existing_user['_id'],user_dict)
    
    # Return a success message and the new user ID
    return {"message": "User updated successfully", "user_id": user_id, "email": user_dict['email']}

#@app.get("/tasks")
#def get_tasks(userId: str, date: str):
#    """
#    Get all tasks for a user for a given date.
#    ONE document per (userId, date) with tasks array.
#    """
#    auth_header = request.headers.get("Authorization")
#    if not auth_header:
#        return {"msg": "Missing Authorization Header"}, 401
#    
#    # Extract the token part after "Bearer "
#    token = auth_header.split("Bearer ")[1] if len(auth_header.split("Bearer ")) > 1 else None
#
#    if token:
#        user_info = verify_token(token)
#        if user_info:
#            #return {"message": f"Hello User {user_info['user_id']}! This is protected data."}, 200
#            return dailytask_repository.find_by_id_date(userId,date)
#
#    return {"msg": "Invalid or expired token"}, 401



@app.get("/tasks")
def get_tasks(userId: str, date: str):
    """
    Get all tasks for a user for a given date.
    ONE document per (userId, date) with tasks array.
    """
    doc = find_doc(userId, date)
    if not doc:
        return {"tasks": []}
    return {"tasks": doc.get("tasks", [])}


@app.post("/tasks")
def create_task(task: TaskCreate):
    """
    Add one task to the user's task list for that date.
    If doc doesn't exist, create it.
    """
    existing = find_doc(task.userId, task.date)
    new_task = build_task_dict(task)

    if existing:
        tasks_collection.update_one(
            {"_id": existing["_id"]},
            {"$push": {"tasks": new_task}}
        )
    else:
        tasks_collection.insert_one(
            {
                "userId": task.userId,
                "date": task.date,
                "tasks": [new_task],
            }
        )

    return {"task": new_task}


@app.patch("/tasks/{task_id}")
def update_task(task_id: str, userId: str, date: str, patch: TaskUpdate):
    """
    Update one task in the tasks array (currently only 'completed').
    """
    update_ops = {}

    if patch.completed is not None:
        update_ops["tasks.$.completed"] = patch.completed

    if not update_ops:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = tasks_collection.update_one(
        {"userId": userId, "date": date, "tasks.id": task_id},
        {"$set": update_ops},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    # fetch the updated task
    doc = find_doc(userId, date)
    tasks = doc.get("tasks", [])
    updated_task = next((t for t in tasks if t["id"] == task_id), None)

    return {"task": updated_task}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str, userId: str, date: str):
    """
    Delete one task from the tasks array.
    """
    result = tasks_collection.update_one(
        {"userId": userId, "date": date},
        {"$pull": {"tasks": {"id": task_id}}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}


@app.post("/tasks/mark-all-complete")
def mark_all_complete(userId: str, date: str):
    """
    Mark all tasks for this user & date as completed.
    """
    result = tasks_collection.update_one(
        {"userId": userId, "date": date},
        {"$set": {"tasks.$[].completed": True}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No tasks for this day")

    return {"updated": result.modified_count}

@app.post("/forum", status_code=201)
def create_post(post: ForumPost):
    post_dict = post.model_dump()
    post_dict["created_at"] = datetime.now(timezone.utc).isoformat(timespec="milliseconds")
    post_dict["replies"] = []   # initialize empty replies array
    result = forum_collection.insert_one(post_dict)
    post_dict["_id"] = str(result.inserted_id)
    return post_dict


@app.get("/forum")
def get_posts(userId: Optional[str] = None):
    query = {"userId": userId} if userId else {}
    posts = list(forum_collection.find(query))
    for p in posts:
        p["_id"] = str(p["_id"])
    return posts


@app.get("/forum/{post_id}")
def get_post(post_id: str):
    post = forum_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post["_id"] = str(post["_id"])
    return post


@app.post("/forum/{post_id}/replies", status_code=201)
def add_reply(post_id: str, reply: ForumReply):
    reply_dict = reply.model_dump()
    reply_dict["id"] = str(ObjectId())
    reply_dict["created_at"] = datetime.now(timezone.utc).isoformat(timespec="milliseconds")


    result = forum_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"replies": reply_dict}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")

    return reply_dict

@app.get("/forum/{post_id}/replies")
def get_replies(post_id: str):
    post = forum_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post.get("replies", [])

@app.get("/getreminder")
def get_reminder(userId: str):

    doc = reminder_collection.find_one({"userId": userId})
    if not doc:
        return {"reminders": []}
    return {"reminders": doc.get("reminders", [])}


@app.post("/createreminder")
def create_reminder(reminder: ReminderData):
    existing = reminder_collection.find_one({"userId": reminder.userId})
    new_reminder = {
    "id": str(ObjectId()),           
    "title": reminder.title,
    "description": reminder.description,
    "date": reminder.date,
    "time": reminder.time,
    "category": reminder.category,
    "repeat": reminder.repeat,
    }

    if existing:
        reminder_collection.update_one(
            {"_id": existing["_id"]},
            {"$push": {"reminders": new_reminder}}
        )
    else:
        reminder_collection.insert_one(
            {
                "userId": reminder.userId,
                "reminders": [new_reminder],
            }
        )

    return {"reminders": new_reminder}


@app.delete("/deletereminder/{reminder_id}")
def delete_reminder(reminder_id: str, userId: str):
    """
    Delete one task from the tasks array.
    """
    result = reminder_collection.update_one(
        {"userId": userId},
        {"$pull": {"reminders": {"id": reminder_id}}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="reminder not found")

    return {"message": "reminder deleted"}
    
@app.put("/updatereminder/{reminder_id}")
def update_task(reminder_id: str, userId: str, patch: ReminderData):
    update_ops = {}
    
    if patch is not None:
        update_ops["reminders.$.title"] = patch.title
        update_ops["reminders.$.description"] = patch.description
        update_ops["reminders.$.date"] = patch.date
        update_ops["reminders.$.time"] = patch.time
        update_ops["reminders.$.category"] = patch.category
        update_ops["reminders.$.repeat"] = patch.repeat



    if not update_ops:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = reminder_collection.update_one(
        {"userId": userId, "reminders.id": reminder_id},
        {"$set": update_ops},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="reminder not found")

    # fetch the updated task
    doc = reminder_collection.find_one({"userId": userId})
    reminders = doc.get("reminders", [])
    updated_reminder = next((r for r in reminders if r["id"] == reminder_id), None)

    return {"reminders": updated_reminder}
    
@app.get("/guide")
def get_guides():
    docs = list(guide_collection.find({}, {"_id": 1, "title": 1}))
    # Convert ObjectId to string if needed
    for d in docs:
        d["_id"] = str(d["_id"])
    return {"documents": docs}

@app.get("/guide/{doc_id}")
def get_guide_content(doc_id: str):
    doc = guide_collection.find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Guide not found")

    doc["_id"] = str(doc["_id"])
    return doc

# ---------- WATER INTAKE ROUTES ----------

@app.get("/waterintake")
def get_water_intake(userId: str, date: str):
    """
    Get water intake data for a specific user and date.
    Automatically creates a new record for today with 0 intake if it doesn't exist.
    Uses the user's previous goal or defaults to 2000ml.
    """
    intake = waterintake_repository.find_by_user_and_date(userId, date)
    
    if not intake:
        # Get user's last known goal, or use default
        last_goal = waterintake_repository.find_latest_goal(userId)
        goal = last_goal if last_goal else 2000
        
        # Create new record for today with 0 intake
        new_intake = {
            "userId": userId,
            "date": date,
            "goalIntake": goal,
            "currentIntake": 0
        }
        intake_id = waterintake_repository.create(new_intake)
        new_intake["_id"] = intake_id
        return {"data": new_intake, "message": "New day started - water intake reset"}
    
    return {"data": intake}


@app.post("/waterintake", status_code=201)
def create_water_intake(intake: WaterIntakeData):
    """
    Create a new water intake record for a user on a specific date.
    If a record already exists, return an error.
    """
    existing = waterintake_repository.find_by_user_and_date(intake.userId, intake.date)
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Water intake record already exists for this date"
        )
    
    intake_dict = intake.model_dump()
    intake_id = waterintake_repository.create(intake_dict)
    intake_dict["_id"] = intake_id
    
    return {"message": "Water intake record created", "data": intake_dict}


@app.patch("/waterintake/add")
def add_water_intake(userId: str, date: str, update: WaterIntakeUpdate):
    """
    Increment water intake by a specific amount.
    Creates a new record with default goal if it doesn't exist.
    """
    existing = waterintake_repository.find_by_user_and_date(userId, date)
    
    if not existing:
        # Create new record with default goal of 2000ml
        new_intake = {
            "userId": userId,
            "date": date,
            "goalIntake": 2000,
            "currentIntake": update.amount
        }
        intake_id = waterintake_repository.create(new_intake)
        new_intake["_id"] = intake_id
        return {"message": "Water intake tracked", "data": new_intake}
    
    # Increment existing intake
    success = waterintake_repository.increment_intake(userId, date, update.amount)
    
    if not success:
        raise HTTPException(status_code=404, detail="Failed to update water intake")
    
    # Fetch updated record
    updated = waterintake_repository.find_by_user_and_date(userId, date)
    return {"message": "Water intake updated", "data": updated}


@app.put("/waterintake/goal")
def update_water_goal(userId: str, date: str, goalIntake: int):
    """
    Update the daily water intake goal for a user.
    """
    existing = waterintake_repository.find_by_user_and_date(userId, date)
    
    if not existing:
        # Create new record with specified goal
        new_intake = {
            "userId": userId,
            "date": date,
            "goalIntake": goalIntake,
            "currentIntake": 0
        }
        intake_id = waterintake_repository.create(new_intake)
        new_intake["_id"] = intake_id
        return {"message": "Water intake goal set", "data": new_intake}
    
    # Update goal
    waterintake_collection.update_one(
        {"userId": userId, "date": date},
        {"$set": {"goalIntake": goalIntake}}
    )
    
    updated = waterintake_repository.find_by_user_and_date(userId, date)
    return {"message": "Water intake goal updated", "data": updated}


@app.put("/waterintake/reset")
def reset_water_intake(userId: str, date: str):
    """
    Reset the current water intake to 0 for a specific date.
    """
    existing = waterintake_repository.find_by_user_and_date(userId, date)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Water intake record not found")
    
    success = waterintake_repository.update_intake(userId, date, 0)
    
    if not success:
        raise HTTPException(status_code=404, detail="Failed to reset water intake")
    
    updated = waterintake_repository.find_by_user_and_date(userId, date)
    return {"message": "Water intake reset", "data": updated}


@app.delete("/waterintake")
def delete_water_intake(userId: str, date: str):
    """
    Delete water intake record for a specific date.
    """
    success = waterintake_repository.delete(userId, date)
    
    if not success:
        raise HTTPException(status_code=404, detail="Water intake record not found")
    
    return {"message": "Water intake record deleted"}

# ---------- MOOD TRACKING ROUTES ----------

@app.post("/mood", status_code=201)
def create_mood(mood: MoodData):
    """
    Save or update mood for a user on a specific date.
    If mood already exists for that date, update it.
    """
    # Validate mood value
    valid_moods = ["happy", "calm", "tired", "anxious", "unwell"]
    if mood.mood not in valid_moods:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mood value. Must be one of: {', '.join(valid_moods)}"
        )
    
    existing = mood_repository.find_by_user_and_date(mood.userId, mood.date)
    
    if existing:
        # Update existing mood
        success = mood_repository.update(mood.userId, mood.date, mood.mood)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update mood")
        updated = mood_repository.find_by_user_and_date(mood.userId, mood.date)
        return {"message": "Mood updated", "data": updated}
    else:
        # Create new mood entry
        mood_dict = mood.model_dump()
        mood_id = mood_repository.create(mood_dict)
        mood_dict["_id"] = mood_id
        return {"message": "Mood saved", "data": mood_dict}


@app.get("/mood")
def get_mood(userId: str, date: Optional[str] = None):
    """
    Get mood data for a user.
    If date is provided, get mood for that specific date.
    If date is not provided, get all mood history (last 30 days).
    """
    if date:
        mood = mood_repository.find_by_user_and_date(userId, date)
        if not mood:
            return {"data": None}
        return {"data": mood}
    else:
        moods = mood_repository.find_by_user(userId, limit=30)
        return {"data": moods}


@app.put("/mood")
def update_mood(mood: MoodData):
    """
    Update mood value for a specific user and date.
    """
    # Validate mood value
    valid_moods = ["happy", "calm", "tired", "anxious", "unwell"]
    if mood.mood not in valid_moods:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mood value. Must be one of: {', '.join(valid_moods)}"
        )
    
    existing = mood_repository.find_by_user_and_date(mood.userId, mood.date)
    
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Mood entry not found for this date"
        )
    
    success = mood_repository.update(mood.userId, mood.date, mood.mood)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update mood")
    
    updated = mood_repository.find_by_user_and_date(mood.userId, mood.date)
    return {"message": "Mood updated", "data": updated}


@app.delete("/mood")
def delete_mood(userId: str, date: str):
    """
    Delete mood entry for a specific date.
    """
    success = mood_repository.delete(userId, date)
    
    if not success:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    
    return {"message": "Mood entry deleted"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
