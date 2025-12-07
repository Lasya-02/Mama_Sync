from database import mongo_db
from datetime import datetime, timezone
from typing import Optional

class MoodRepository:
    def __init__(self):
        self.collection = mongo_db.get_collection("mood_tracking")

    def create(self, mood_data: dict) -> str:
        """Create a new mood entry."""
        mood_data["created_at"] = datetime.now(timezone.utc).isoformat(timespec="milliseconds")
        result = self.collection.insert_one(mood_data)
        return str(result.inserted_id)

    def find_by_user_and_date(self, user_id: str, date: str) -> Optional[dict]:
        """Find mood entry for a specific user and date."""
        mood = self.collection.find_one({"userId": user_id, "date": date})
        if mood:
            mood["_id"] = str(mood["_id"])
        return mood

    def find_by_user(self, user_id: str, limit: int = 30) -> list:
        """Find all mood entries for a user, sorted by date (most recent first)."""
        moods = list(
            self.collection.find({"userId": user_id})
            .sort("date", -1)
            .limit(limit)
        )
        for mood in moods:
            mood["_id"] = str(mood["_id"])
        return moods

    def update(self, user_id: str, date: str, mood_value: str) -> bool:
        """Update mood value for a specific user and date."""
        result = self.collection.update_one(
            {"userId": user_id, "date": date},
            {"$set": {
                "mood": mood_value,
                "updated_at": datetime.now(timezone.utc).isoformat(timespec="milliseconds")
            }}
        )
        return result.modified_count > 0

    def delete(self, user_id: str, date: str) -> bool:
        """Delete a mood entry."""
        result = self.collection.delete_one({"userId": user_id, "date": date})
        return result.deleted_count > 0

    def find_all(self) -> list:
        """Find all mood entries (for testing/admin purposes)."""
        moods = list(self.collection.find({}))
        for mood in moods:
            mood["_id"] = str(mood["_id"])
        return moods

# Create a singleton instance
mood_repository = MoodRepository()
