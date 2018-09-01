"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("quick.db");
const bunquser_1 = require("./models/bunquser");
class database {
    static addUser(username, token) {
        let UID = `bunquser${username}`;
        let user = new bunquser_1.bunqUser(username, token);
        db.fetch(UID)
            .then((data) => {
            if (data == null) {
                db.set(UID, user);
            }
            console.log(data);
        })
            .catch(err => {
            console.error(err);
        });
        return false;
    }
}
exports.database = database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsZ0RBQXdEO0FBRXhELE1BQWEsUUFBUTtJQUVqQixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsS0FBYTtRQUMxQyxJQUFJLEdBQUcsR0FBRyxXQUFXLFFBQVEsRUFBRSxDQUFDO1FBQ2hDLElBQUksSUFBSSxHQUFjLElBQUksbUJBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFcEQsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFFUixJQUFJLENBQUMsQ0FBQyxJQUFlLEVBQUUsRUFBRTtZQUV0QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBRWQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDckI7WUFHRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFUCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0NBR0o7QUExQkQsNEJBMEJDIn0=