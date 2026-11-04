const { MongoClient } = require("mongodb");

const mongoURI = `mongodb://${process.env.MONGO_BACKEND_USER}:${process.env.MONGO_BACKEND_PASSWORD}@${process.env.MONGO_DATABASE_HOST}:${process.env.MONGO_DATABASE_PORT}/${process.env.MONGO_DATABASE_NAME}`

const client = new MongoClient(mongoURI,
    {
        maxPoolSize: 20
    });

let db;

const connectMongo = async () => {
    await client.connect();

    db = client.db(process.env.MONGO_DATABASE_NAME);
    await Promise.all([
        db.collection("Folder").createIndex({ author_id: 1, name: 1 }),
        db.collection("Folder").createIndex({ public: 1, name: 1 }),
        db.collection("FolderPermission").createIndex({ user_id: 1, folder_id: 1 }),
        db.collection("FileRelation").createIndex({ collection: 1, collection_id: 1, file_id: 1 })
    ]);
};

const getDb = () => {
    if (!db) {
        throw new Error("MongoDB not initialized");
    }

    return db;
};

module.exports = {
    connectMongo,
    getDb
};