from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB Connection Details
# In production, these should come from environment variables
MONGO_USER = os.getenv("MONGO_USER", "admin")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "password123")
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")

# Connection String
MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}"

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(MONGO_URI)
            # Ping the database to verify connection
            # Note: In async context, we'd await this, but for setup we just initialize the client
            print(f"Connected to MongoDB at {MONGO_URI}")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")

    def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

    def get_db(self, db_name="admo_ai"):
        """Get database instance"""
        if self.client:
            return self.client[db_name]
        return None

# Global Database Instance
db = Database()
