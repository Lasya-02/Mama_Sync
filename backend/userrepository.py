from bson.objectid import ObjectId
from database import mongo_db

class UserRepository:
    def __init__(self):
        self.collection = mongo_db.get_collection('users')

    def find_all(self):
        return [self.serialize_object_id(p) for p in self.collection.find()]

    def find_by_id(self, user_id):
        userdata = self.collection.find_one({"_id": ObjectId(user_id)})
        return self.serialize_object_id(userdata) if userdata else None

    def find_by_email(self, user_name):
        user_in_db = self.collection.find_one({"email": user_name})
        return self.serialize_object_id(user_in_db) if user_in_db else None

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
user_repository = UserRepository()
