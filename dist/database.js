"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("quick.db");
const bunquser_1 = require("./models/bunquser");
class database {
    static addUser(user_id, user_public_key, user_private_key, server_public_key, token) {
        let UID = `bunquser${user_id}`;
        let user = new bunquser_1.bunqUser();
        user.server_public_key = server_public_key;
        user.token = token;
        user.user_id = user_id;
        user.user_private_key = user_private_key;
        user.user_public_key = user_public_key;
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
    static startWeb() {
        db.createWebview('password', 13508);
    }
}
exports.database = database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsZ0RBQXdEO0FBRXhEO0lBRUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFjLEVBQUUsZUFBdUIsRUFBQyxnQkFBd0IsRUFBQyxpQkFBeUIsRUFBQyxLQUFhO1FBQ25ILElBQUksR0FBRyxHQUFHLFdBQVcsT0FBTyxFQUFFLENBQUM7UUFDL0IsSUFBSSxJQUFJLEdBQWMsSUFBSSxtQkFBUSxFQUFFLENBQUM7UUFFckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO1FBQzNDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUV2QyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzthQUVSLElBQUksQ0FBQyxDQUFDLElBQWdCLEVBQUUsRUFBRTtZQUV2QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBRWQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDckI7WUFHRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFUCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsTUFBTSxDQUFDLFFBQVE7UUFDWCxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBR0o7QUFwQ0QsNEJBb0NDIn0=