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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsZ0RBQXdEO0FBRXhEO0lBRUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLEtBQWE7UUFDMUMsSUFBSSxHQUFHLEdBQUcsV0FBVyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxJQUFJLElBQUksR0FBYyxJQUFJLG1CQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXBELEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO2FBRVIsSUFBSSxDQUFDLENBQUMsSUFBZSxFQUFFLEVBQUU7WUFFdEIsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO2dCQUVkLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3JCO1lBR0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRVAsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztDQUdKO0FBMUJELDRCQTBCQyJ9