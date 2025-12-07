import pytest
from unittest.mock import MagicMock, patch
from moodrepository import MoodRepository
from datetime import date

@pytest.fixture
def test_user_id():
    return "test_mood_user@example.com"

@pytest.fixture
def test_date():
    return date.today().isoformat()


@patch("moodrepository.mongo_db")
def test_create_mood(mock_mongo, test_user_id, test_date):
    """Test creating a new mood entry."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.insert_one.return_value.inserted_id = "123"
    
    repo = MoodRepository()
    mood_data = {
        "userId": test_user_id,
        "date": test_date,
        "mood": "happy"
    }
    
    mood_id = repo.create(mood_data)
    
    assert mood_id == "123"
    assert isinstance(mood_id, str)
    mock_collection.insert_one.assert_called_once()


@patch("moodrepository.mongo_db")
def test_find_by_user_and_date(mock_mongo, test_user_id, test_date):
    """Test finding a mood entry by user and date."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.find_one.return_value = {
        "_id": "123",
        "userId": test_user_id,
        "date": test_date,
        "mood": "calm",
        "created_at": "2024-01-01T00:00:00.000"
    }
    
    repo = MoodRepository()
    found_mood = repo.find_by_user_and_date(test_user_id, test_date)
    
    assert found_mood is not None
    assert found_mood["userId"] == test_user_id
    assert found_mood["date"] == test_date
    assert found_mood["mood"] == "calm"
    assert found_mood["_id"] == "123"
    mock_collection.find_one.assert_called_once_with({"userId": test_user_id, "date": test_date})


@patch("moodrepository.mongo_db")
def test_find_by_user_and_date_not_found(mock_mongo, test_user_id):
    """Test finding a mood entry that doesn't exist."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.find_one.return_value = None
    
    repo = MoodRepository()
    found_mood = repo.find_by_user_and_date(test_user_id, "2099-12-31")
    
    assert found_mood is None


@patch("moodrepository.mongo_db")
def test_find_by_user(mock_mongo, test_user_id):
    """Test finding all mood entries for a user."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = [
        {"_id": "3", "userId": test_user_id, "date": "2024-01-03", "mood": "anxious"},
        {"_id": "2", "userId": test_user_id, "date": "2024-01-02", "mood": "tired"},
        {"_id": "1", "userId": test_user_id, "date": "2024-01-01", "mood": "happy"}
    ]
    mock_collection.find.return_value = mock_cursor
    
    repo = MoodRepository()
    found_moods = repo.find_by_user(test_user_id)
    
    assert len(found_moods) == 3
    assert found_moods[0]["date"] == "2024-01-03"
    assert found_moods[1]["date"] == "2024-01-02"
    assert found_moods[2]["date"] == "2024-01-01"


@patch("moodrepository.mongo_db")
def test_update_mood(mock_mongo, test_user_id, test_date):
    """Test updating a mood entry."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.update_one.return_value.modified_count = 1
    
    repo = MoodRepository()
    success = repo.update(test_user_id, test_date, "unwell")
    
    assert success is True
    mock_collection.update_one.assert_called_once()


@patch("moodrepository.mongo_db")
def test_update_nonexistent_mood(mock_mongo, test_user_id):
    """Test updating a mood entry that doesn't exist."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.update_one.return_value.modified_count = 0
    
    repo = MoodRepository()
    success = repo.update(test_user_id, "2099-12-31", "happy")
    
    assert success is False


@patch("moodrepository.mongo_db")
def test_delete_mood(mock_mongo, test_user_id, test_date):
    """Test deleting a mood entry."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.delete_one.return_value.deleted_count = 1
    
    repo = MoodRepository()
    success = repo.delete(test_user_id, test_date)
    
    assert success is True
    mock_collection.delete_one.assert_called_once_with({"userId": test_user_id, "date": test_date})


@patch("moodrepository.mongo_db")
def test_delete_nonexistent_mood(mock_mongo, test_user_id):
    """Test deleting a mood entry that doesn't exist."""
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection
    mock_collection.delete_one.return_value.deleted_count = 0
    
    repo = MoodRepository()
    success = repo.delete(test_user_id, "2099-12-31")
    
    assert success is False
