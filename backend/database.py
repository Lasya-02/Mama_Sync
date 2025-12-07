from pymongo import MongoClient
import os

#  Load production secrets from environment variables
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "mamasync")

if not MONGO_URI:
    raise ValueError(" MONGO_URI is not set. Add it to your environment variables.")

class MongoInstance:
    def __init__(self):
        #  Use the full MongoDB URI (Atlas-compatible)
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[MONGO_DB]
        print(f" Connected to MongoDB: {MONGO_URI}, Database: {MONGO_DB}")

    def get_collection(self, collection_name):
        return self.db[collection_name]

#  Create a single global instance
mongo_db = MongoInstance()
