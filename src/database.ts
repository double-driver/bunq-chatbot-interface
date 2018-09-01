const MongoClient = require('mongodb').MongoClient;

const configHandler: any = require('./config');


class Database {
    static async createUser(data) {
        const client = await MongoClient.connect(`mongodb://${configHandler.retrieveConfigVariable('mongoDb')}`);
        const db = client.db('bunq');
        const collection = db.collection('users');

        const result = await collection.insert(data);
        client.close();

        return result;
    }

    static async retrieveUser(userId) {
        const client = await MongoClient.connect(`mongodb://${configHandler.retrieveConfigVariable('mongoDb')}`);
        const db = client.db('bunq');
        const collection = db.collection('users');

        const result = await collection.findOne({userId});
        client.close();

        return result;
    }
}

module.exports = Database;
