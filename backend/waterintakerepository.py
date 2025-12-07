from bson.objectid import ObjectId
from database import mongo_db

class WaterIntakeRepository:
    def __init__(self):
        self.collection = mongo_db.get_collection('water_intake')

    def find_by_user_and_date(self, user_id, date):
        """Find water intake record for a specific user and date"""
        data = self.collection.find_one({"userId": user_id, "date": date})
        return self.serialize_object_id(data) if data else None

    def find_latest_goal(self, user_id):
        """Find the most recent goal for a user (from any previous date)"""
        data = self.collection.find_one(
            {"userId": user_id},
            sort=[("date", -1)]  # Sort by date descending
        )
        return data.get('goalIntake') if data else None

    def create(self, intake_data):
        """Create a new water intake record"""
        result = self.collection.insert_one(intake_data)
        return str(result.inserted_id)

    def update_intake(self, user_id, date, current_intake):
        """Update the current water intake for a user on a specific date"""
        result = self.collection.update_one(
            {"userId": user_id, "date": date}, 
            {"$set": {"currentIntake": current_intake}}
        )
        return result.modified_count > 0

    def increment_intake(self, user_id, date, amount):
        """Increment water intake by a specific amount"""
        result = self.collection.update_one(
            {"userId": user_id, "date": date},
            {"$inc": {"currentIntake": amount}}
        )
        return result.modified_count > 0

    def delete(self, user_id, date):
        """Delete water intake record for a specific date"""
        result = self.collection.delete_one({"userId": user_id, "date": date})
        return result.deleted_count > 0
    
    def serialize_object_id(self, document):
        if document and '_id' in document:
            document['_id'] = str(document['_id'])
        return document

# Create a single instance of the repository
waterintake_repository = WaterIntakeRepository()
