import pytest
from fastapi.testclient import TestClient
from bson import ObjectId
from unittest.mock import MagicMock
import jwt
from datetime import datetime, timedelta, timezone
from app import create_access_token, verify_token
import os
from app import app

client = TestClient(app)

# -----------------------------------------------------------
# Shared Mock Collection used for all database interactions
# -----------------------------------------------------------

class MockCollection:
    """A simple mock collection that simulates MongoDB behavior."""

    def __init__(self):
        self.find_one_result = None
        self.find_result = None
        self.insert_result = ObjectId()
        self.update_result = True

    def find_one(self, query):
        return self.find_one_result

    def find(self, query=None, projection=None):
        return self.find_result or []

    def insert_one(self, document):
        class R:
            inserted_id = str(self.insert_result)
        return R()

    def update_one(self, query, update):
        class R:
            matched_count = 1 if self.update_result else 0
            modified_count = 1 if self.update_result else 0
        return R()


VALID_ID = str(ObjectId())


# -----------------------------------------------------------
# Replace all Mongo collection objects in app.py
# -----------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_collections(monkeypatch):
    fake = MockCollection()

    monkeypatch.setattr("app.tasks_collection", fake)
    monkeypatch.setattr("app.forum_collection", fake)
    monkeypatch.setattr("app.guide_collection", fake)
    monkeypatch.setattr("app.reminder_collection", fake)

    return fake


# ===========================================================
#                     USER TESTS
# ===========================================================

def test_register_user(monkeypatch):
    from userrepository import user_repository

    monkeypatch.setattr(user_repository, "find_by_email", lambda email: None)
    monkeypatch.setattr(user_repository, "create", lambda data: "mock_user")

    payload = {
        "email": "test@example.com",
        "name": "Test",
        "password": "secret",
        "pregnancyMonth": 4,
        "working": True,
        "workHours": 8,
        "wakeTime": "06:00",
        "sleepTime": "22:00",
        "mealTime": "12:00",
        "emergencyContact": "123",
        "dueDate": "2025-12-01",
        "height": 160,
        "weight": 55
    }

    r = client.post("/register", json=payload)
    assert r.status_code == 201
    assert r.json()["user_id"] == "mock_user"


def test_login_user(monkeypatch):
    from userrepository import user_repository
    monkeypatch.setattr(user_repository, "find_by_email",
                        lambda email: {"_id": VALID_ID, "email": email, "password": "secret", "name": "A"})

    monkeypatch.setattr("app.SECRET_KEY", os.getenv("JWT_SECRET_KEY"))

    r = client.post("/login", json={"email": "x@test.com", "password": "secret"})
    assert r.status_code == 200
    assert "token" in r.json()


def test_update_profile(monkeypatch):
    from userrepository import user_repository
    monkeypatch.setattr(user_repository, "find_by_email",
                        lambda e: {"_id": VALID_ID, "email": e})
    monkeypatch.setattr(user_repository, "update", lambda id, d: id)

    payload = {
        "email": "test@example.com",
        "name": "Updated",
        "password": "secret",
        "pregnancyMonth": 4,
        "working": True,
        "workHours": 8,
        "wakeTime": "06:00",
        "sleepTime": "22:00",
        "mealTime": "12:00",
        "emergencyContact": "123",
        "dueDate": "2025-12-01",
        "height": 160,
        "weight": 55
    }

    r = client.put("/updateprofile", json=payload)
    assert r.status_code == 200


# ===========================================================
#                     TASKS TESTS
# ===========================================================

def test_create_task(patch_collections):
    patch_collections.find_one_result = None
    r = client.post("/tasks", json={
        "userId": "u1",
        "date": "d1",
        "emoji": "🙂",
        "title": "Test",
        "time": "10:00",
        "completed": False,
        "isPreset": False
    })
    assert r.status_code == 200


def test_get_tasks(patch_collections):
    patch_collections.find_one_result = {"tasks": [{"title": "X"}]}
    r = client.get("/tasks?userId=u1&date=d1")
    assert r.status_code == 200


def test_update_task(patch_collections):
    patch_collections.find_one_result = {"tasks": [{"id": "t1", "completed": False}]}
    r = client.patch("/tasks/t1?userId=u1&date=d1", json={"completed": True})
    assert r.status_code == 200


def test_delete_task(patch_collections):
    patch_collections.update_result = True
    r = client.delete("/tasks/t1?userId=u1&date=d1")
    assert r.status_code == 200


def test_mark_all_complete(patch_collections):
    patch_collections.update_result = True
    r = client.post("/tasks/mark-all-complete?userId=u1&date=d1")
    assert r.status_code == 200


# ===========================================================
#                     FORUM TESTS
# ===========================================================

def test_create_forum_post(patch_collections):
    r = client.post("/forum", json={"userId": "u1", "title": "Hello", "content": "World"})
    assert r.status_code == 201


def test_get_forum_post(patch_collections):
    patch_collections.find_one_result = {"_id": VALID_ID, "title": "Post"}
    r = client.get(f"/forum/{VALID_ID}")
    assert r.status_code == 200


def test_add_reply(patch_collections):
    patch_collections.update_result = True
    r = client.post(f"/forum/{VALID_ID}/replies", json={"userId": "u1", "content": "Hi"})
    assert r.status_code == 201


# ===========================================================
#                     GUIDE TESTS
# ===========================================================

def test_get_guides(patch_collections):
    patch_collections.find_result = [{"_id": VALID_ID, "title": "Guide"}]
    r = client.get("/guide")
    assert r.status_code == 200
    assert "Guide" in r.json()["documents"][0]["title"]


# ===========================================================
#                   REMINDER TESTS
# ===========================================================

def test_create_reminder(patch_collections):
    patch_collections.find_one_result = None
    r = client.post("/createreminder", json={
        "userId": "u1",
        "title": "A",
        "description": "B",
        "date": "2025-12-01",
        "time": "10:00",
        "category": "Health",
        "repeat": "None"
    })
    assert r.status_code == 200


def test_get_reminder(patch_collections):
    patch_collections.find_one_result = {"reminders": [{"title": "X"}]}
    r = client.get("/getreminder?userId=u1")
    assert r.status_code == 200


def test_delete_reminder(patch_collections):
    patch_collections.update_result = True
    r = client.delete("/deletereminder/r1?userId=u1")
    assert r.status_code == 200


def test_update_reminder(patch_collections):
    patch_collections.find_one_result = {"reminders": [{"id": "r1"}]}
    r = client.put("/updatereminder/r1?userId=u1", json={
        "userId": "u1",
        "title": "Updated",
        "description": "Test",
        "date": "2025-12-01",
        "time": "09:00",
        "category": "Health",
        "repeat": "None"
    })
    assert r.status_code == 200



# ===========================================================
#              MORE TESTS FOR HIGHER COVERAGE
# ===========================================================

def test_jwt_create_and_verify(monkeypatch):
    monkeypatch.setattr("app.SECRET_KEY", os.getenv("JWT_SECRET_KEY"))

    token = create_access_token("user1")
    decoded = verify_token(token)

    assert decoded["user_id"] == "user1"


def test_jwt_invalid_token():
    assert verify_token("invalidtoken123") is None


def test_jwt_expired(monkeypatch):
    monkeypatch.setattr("app.SECRET_KEY", os.getenv("JWT_SECRET_KEY"))

    expired = jwt.encode(
        {"user_id": "u1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        os.getenv("JWT_SECRET_KEY"), 
        algorithm="HS256",
    )

    assert verify_token(expired) is None


# ===========================================================
#                     GUIDE TESTS
# ===========================================================

def test_get_guide_not_found(monkeypatch):
    fake = MockCollection()
    fake.find_one_result = None
    monkeypatch.setattr("app.guide_collection", fake)

    valid = str(ObjectId())
    r = client.get(f"/guide/{valid}")
    assert r.status_code == 404


# ===========================================================
#                     FORUM EXTRA TESTS
# ===========================================================

def test_get_replies_not_found(monkeypatch):
    fake = MockCollection()
    fake.find_one_result = None
    monkeypatch.setattr("app.forum_collection", fake)

    valid = str(ObjectId())
    r = client.get(f"/forum/{valid}/replies")
    assert r.status_code == 404


def test_get_posts_filter(monkeypatch):
    fake = MockCollection()
    fake.find_result = [{"_id": VALID_ID, "userId": "u1"}]
    monkeypatch.setattr("app.forum_collection", fake)
    
    r = client.get("/forum?userId=u1")
    assert r.status_code == 200


def test_get_posts_empty(monkeypatch):
    fake = MockCollection()
    fake.find_result = []
    monkeypatch.setattr("app.forum_collection", fake)

    r = client.get("/forum")
    assert r.status_code == 200
    assert r.json() == []


# ===========================================================
#                     WATER INTAKE TESTS
# ===========================================================

def test_waterintake_new_day(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = None
    fake_repo.find_latest_goal.return_value = 2500
    fake_repo.create.return_value = "abc"

    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.get("/waterintake?userId=u1&date=d1")
    assert r.status_code == 200
    assert r.json()["data"]["goalIntake"] == 2500


def test_waterintake_existing(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = {"goalIntake": 2000}
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.get("/waterintake?userId=u1&date=d1")
    assert r.status_code == 200


def test_waterintake_create_duplicate(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = {"id": "1"}
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.post("/waterintake", json={
        "userId": "u1", "date": "d1", "goalIntake": 2000
    })
    assert r.status_code == 400


def test_add_waterintake_create_new(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = None
    fake_repo.create.return_value = "abc"
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.patch("/waterintake/add?userId=u1&date=d1", json={"amount": 300})
    assert r.status_code == 200


def test_add_waterintake_existing(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = {"currentIntake": 0}
    fake_repo.increment_intake.return_value = True
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.patch("/waterintake/add?userId=u1&date=d1", json={"amount": 300})
    assert r.status_code == 200


def test_water_goal_create(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = None
    fake_repo.create.return_value = "abc"

    monkeypatch.setattr("app.waterintake_repository", fake_repo)
    monkeypatch.setattr("app.waterintake_collection", MockCollection())

    r = client.put("/waterintake/goal?userId=u1&date=d1&goalIntake=2500")
    assert r.status_code == 200


def test_water_goal_update(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = {"goalIntake": 2000}

    monkeypatch.setattr("app.waterintake_repository", fake_repo)
    monkeypatch.setattr("app.waterintake_collection", MockCollection())

    r = client.put("/waterintake/goal?userId=u1&date=d1&goalIntake=2500")
    assert r.status_code == 200


def test_water_reset_not_found(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = None
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.put("/waterintake/reset?userId=u1&date=d1")
    assert r.status_code == 404


def test_water_reset_success(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.find_by_user_and_date.return_value = {"currentIntake": 100}
    fake_repo.update_intake.return_value = True

    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.put("/waterintake/reset?userId=u1&date=d1")
    assert r.status_code == 200


def test_water_delete(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.delete.return_value = True
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.delete("/waterintake?userId=u1&date=d1")
    assert r.status_code == 200


def test_water_delete_not_found(monkeypatch):
    fake_repo = MagicMock()
    fake_repo.delete.return_value = False
    monkeypatch.setattr("app.waterintake_repository", fake_repo)

    r = client.delete("/waterintake?userId=u1&date=d1")
    assert r.status_code == 404


# ===========================================================
#                REMINDER EXTRA TESTS
# ===========================================================

def test_update_reminder_not_found(patch_collections):
    patch_collections.update_result = False
    r = client.put("/updatereminder/r1?userId=u1", json={
        "userId": "u1",
        "title": "Updated",
        "description": "X",
        "date": "2025-12-01",
        "time": "09:00",
        "category": "Health",
        "repeat": "None"
    })
    assert r.status_code == 404


def test_delete_reminder_not_found(monkeypatch):
    fake = MockCollection()
    fake.update_result = False
    monkeypatch.setattr("app.reminder_collection", fake)

    r = client.delete("/deletereminder/x?userId=u1")
    assert r.status_code == 404


# ===========================================================
#                TASKS EXTRA TESTS
# ===========================================================

def test_update_task_no_field():
    r = client.patch("/tasks/t1?userId=u1&date=d1", json={})
    assert r.status_code == 400


def test_delete_task_not_found(patch_collections):
    patch_collections.update_result = False
    r = client.delete("/tasks/t1?userId=u1&date=d1")
    assert r.status_code == 404
