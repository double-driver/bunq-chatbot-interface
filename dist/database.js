"use strict";
const MongoClient = require('mongodb').MongoClient;
const configHandler = require('./config');
class Database {
    static createUser(data) {
        MongoClient.connect(`mongodb://${configHandler.retrieveConfigVariable('mongoDb')}`, (err, client) => {
            if (err) {
                throw err;
            }
            const db = client.db('bunq');
            const collection = db.collection('users');
            collection.insert(data, (err, result) => {
                if (err)
                    console.error(err);
                console.log(result);
            });
            client.close();
        });
    }
    static async retrieveUser(userId) {
        const client = await MongoClient.connect(`mongodb://${configHandler.retrieveConfigVariable('mongoDb')}`);
        const db = client.db('bunq');
        const collection = db.collection('users');
        const result = await collection.findOne({ userId });
        client.close();
        return result;
    }
}
module.exports = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFFbkQsTUFBTSxhQUFhLEdBQVEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRy9DO0lBQ0ksTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJO1FBQ2xCLFdBQVcsQ0FBQyxPQUFPLENBQUMsYUFBYSxhQUFhLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNoRyxJQUFJLEdBQUcsRUFBRTtnQkFDTCxNQUFNLEdBQUcsQ0FBQzthQUNiO1lBRUQsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNwQyxJQUFJLEdBQUc7b0JBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNO1FBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxDQUFDLE9BQU8sQ0FBQyxhQUFhLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekcsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTFDLE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUM7UUFDbEQsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRWYsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztDQUNKO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMifQ==