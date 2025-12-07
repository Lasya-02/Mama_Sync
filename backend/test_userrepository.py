import pytest
from unittest.mock import MagicMock
from bson import ObjectId

from userrepository import UserRepository


# ------------------------------------------------
# Sample Mongo Collection for Isolated Testing
# ------------------------------------------------
class MockCollection:
    def __init__(self):
        self.find_result = []
        self.find_one_result = None
        self.insert_result = MagicMock(inserted_id=ObjectId("6568f0f0f0f0f0f0f0f0f0f0"))
        self.update_result = MagicMock(modified_count=1)
        self.delete_result = MagicMock(deleted_count=1)

    def find(self):
        return self.find_result

    def find_one(self, query):
        return self.find_one_result

    def insert_one(self, data):
        return self.insert_result

    def update_one(self, q, u):
        return self.update_result

    def delete_one(self, q):
        return self.delete_result


# ------------------------------------------------
# Fixture to inject MockCollection
# ------------------------------------------------
@pytest.fixture
def repo(monkeypatch):
    fake = MockCollection()
    monkeypatch.setattr(
        "database.mongo_db.get_collection",
        lambda name: fake
    )
    return UserRepository(), fake


# ------------------------------------------------
# TESTS
# ------------------------------------------------

def test_find_all(repo):
    repo_obj, fake = repo
    fake.find_result = [
        {"_id": ObjectId("6568f0f0f0f0f0f0f0f0f0f0"), "email": "a@b.com"}
    ]

    result = repo_obj.find_all()
    assert len(result) == 1
    assert result[0]["_id"] == "6568f0f0f0f0f0f0f0f0f0f0"
    assert result[0]["email"] == "a@b.com"


def test_find_by_id(repo):
    repo_obj, fake = repo
    fake.find_one_result = {"_id": ObjectId("6568f0f0f0f0f0f0f0f0f0f0"), "name": "Test"}

    result = repo_obj.find_by_id("6568f0f0f0f0f0f0f0f0f0f0")
    assert result["name"] == "Test"
    assert result["_id"] == "6568f0f0f0f0f0f0f0f0f0f0"


def test_find_by_email(repo):
    repo_obj, fake = repo
    fake.find_one_result = {"_id": ObjectId("6568f0f0f0f0f0f0f0f0f0f0"), "email": "x@y.com"}

    result = repo_obj.find_by_email("x@y.com")
    assert result["email"] == "x@y.com"
    assert result["_id"] == "6568f0f0f0f0f0f0f0f0f0f0"


def test_create(repo):
    repo_obj, fake = repo
    result = repo_obj.create({"name": "A"})

    assert result == "6568f0f0f0f0f0f0f0f0f0f0"


def test_update(repo):
    repo_obj, fake = repo
    fake.update_result.modified_count = 1

    result = repo_obj.update("6568f0f0f0f0f0f0f0f0f0f0", {"name": "New"})
    assert result is True


def test_delete(repo):
    repo_obj, fake = repo
    fake.delete_result.deleted_count = 1

    result = repo_obj.delete("6568f0f0f0f0f0f0f0f0f0f0")
    assert result is True


def test_serialize_object_id(repo):
    repo_obj, _ = repo

    doc = {"_id": ObjectId("6568f0f0f0f0f0f0f0f0f0f0"), "x": 1}
    result = repo_obj.serialize_object_id(doc)

    assert result["_id"] == "6568f0f0f0f0f0f0f0f0f0f0"
    assert result["x"] == 1
