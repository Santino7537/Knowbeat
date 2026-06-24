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