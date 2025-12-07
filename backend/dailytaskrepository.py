from bson.objectid import ObjectId
from database import mongo_db

class DailyTaskRepository:
    def __init__(self):
        self.collection = mongo_db.get_collection('daily_tasks')

    def find_all(self):
        return [self.serialize_object_id(p) for p in self.collection.find()]

    def find_by_id(self, user_id):
        data = self.collection.find_one({"_id": ObjectId(user_id)})
        return self.serialize_object_id(data) if data else None
    
    def find_by_id_date(self, user_id,date):
        data = self.collection.find_one({"name": user_id,"date":date})
        return self.serialize_object_id(data) if data else None

    def create(self, user_data):
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)

    def update(self, user_id, data):
        result = self.collection.update_one({"_id": ObjectId(user_id)}, {"$set": data})
        return result.modified_count > 0

    def delete(self, user_id):
        result = self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    def serialize_object_id(self, document):
        if document and '_id' in document:
            document['_id'] = str(document['_id'])
        return document

# Create a single instance of the repository
dailytask_repository = DailyTaskRepository()
