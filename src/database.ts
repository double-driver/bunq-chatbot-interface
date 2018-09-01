const MongoClient = require('mongodb').MongoClient;

const configHandler: any = require('./config');


class Database {
    static createUser(data) {
        MongoClient.connect(`mongodb://${configHandler.retrieveConfigVariable('mongoDb')}`, (err, client) => {
            if (err) {
                throw err;
            }

            const db = client.db('bunq');
            const collection = db.collection('users');

            collection.insert(data, (err, result) => {
                if (err) console.error(err);
                console.log(result);
            });

            client.close();
        });
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
