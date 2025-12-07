from unittest.mock import MagicMock, patch
from waterintakerepository import WaterIntakeRepository


@patch("waterintakerepository.mongo_db")
def test_find_by_user_and_date(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.find_one.return_value = {
        "_id": "123",
        "userId": "user123",
        "date": "2025-12-02",
        "currentIntake": 500
    }

    repo = WaterIntakeRepository()
    result = repo.find_by_user_and_date("user123", "2025-12-02")

    assert result["userId"] == "user123"
    assert result["_id"] == "123"
    mock_collection.find_one.assert_called_once_with(
        {"userId": "user123", "date": "2025-12-02"}
    )


@patch("waterintakerepository.mongo_db")
def test_find_latest_goal(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.find_one.return_value = {"goalIntake": 2500}

    repo = WaterIntakeRepository()
    result = repo.find_latest_goal("user123")

    assert result == 2500
    mock_collection.find_one.assert_called_once()


@patch("waterintakerepository.mongo_db")
def test_create(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.insert_one.return_value.inserted_id = "abc123"

    repo = WaterIntakeRepository()
    result = repo.create({"userId": "user123"})

    assert result == "abc123"


@patch("waterintakerepository.mongo_db")
def test_update_intake(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.update_one.return_value.modified_count = 1

    repo = WaterIntakeRepository()
    result = repo.update_intake("user123", "2025-12-02", 700)

    assert result is True


@patch("waterintakerepository.mongo_db")
def test_increment_intake(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.update_one.return_value.modified_count = 1

    repo = WaterIntakeRepository()
    result = repo.increment_intake("user123", "2025-12-02", 300)

    assert result is True


@patch("waterintakerepository.mongo_db")
def test_delete(mock_mongo):
    mock_collection = MagicMock()
    mock_mongo.get_collection.return_value = mock_collection

    mock_collection.delete_one.return_value.deleted_count = 1

    repo = WaterIntakeRepository()
    result = repo.delete("user123", "2025-12-02")

    assert result is True
