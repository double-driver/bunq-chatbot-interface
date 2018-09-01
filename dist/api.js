"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bunquser_1 = require("./models/bunquser");
const request = require("request");
const conf = require("./config");
class Api {
    static createUser(user_id, user_public_key, user_private_key, server_public_key, token) {
        let user = new bunquser_1.bunqUser();
        user.user_id = user_id;
        user.token = token;
        user.server_public_key = server_public_key;
        user.user_private_key = user_private_key;
        user.user_public_key = user_public_key;
        const headers = {
            'User-Agent': 'DoubleDrive/0.0.1',
            'Content-Type': 'application/json'
        };
        var options = {
            url: conf.retrieveConfigVariable("apiBaseUrl") + "user",
            method: "POST",
            headers: headers,
            json: user
        };
        request(options, (error, response, body) => {
            if (error) {
                console.error(error);
            }
            console.log(response);
            console.log(body);
        });
    }
    static getUser(id) {
        let user = new bunquser_1.bunqUser();
        const headers = {
            'User-Agent': 'DoubleDrive/0.0.1',
            'Content-Type': 'application/json'
        };
        var options = {
            url: conf.retrieveConfigVariable("apiBaseUrl") + `/user/${id}`,
            method: "GET",
            headers: headers
        };
        request(options, (error, response, body) => {
            if (error) {
                console.error(error);
            }
            console.log(response);
            console.log(body);
        });
        return user;
    }
}
module.exports = Api;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdEQUF3RDtBQUN4RCxtQ0FBbUM7QUFFbkMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRWpDO0lBRUksTUFBTSxDQUFDLFVBQVUsQ0FDYixPQUFlLEVBQ2YsZUFBdUIsRUFDdkIsZ0JBQXdCLEVBQ3hCLGlCQUF5QixFQUN6QixLQUFhO1FBRWIsSUFBSSxJQUFJLEdBQWMsSUFBSSxtQkFBUSxFQUFFLENBQUM7UUFFckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO1FBQzNDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUV2QyxNQUFNLE9BQU8sR0FBRztZQUNaLFlBQVksRUFBRSxtQkFBbUI7WUFDakMsY0FBYyxFQUFFLGtCQUFrQjtTQUNyQyxDQUFBO1FBRUQsSUFBSSxPQUFPLEdBQUc7WUFDVixHQUFHLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU07WUFDdkQsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsT0FBTztZQUNoQixJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUE7UUFFRCxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBVSxFQUFFLFFBQWEsRUFBRSxJQUFTLEVBQUUsRUFBRTtZQUN0RCxJQUFJLEtBQUssRUFBRTtnQkFDUCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3hCO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBUztRQUNwQixJQUFJLElBQUksR0FBYSxJQUFJLG1CQUFRLEVBQUUsQ0FBQztRQUVwQyxNQUFNLE9BQU8sR0FBRztZQUNaLFlBQVksRUFBRSxtQkFBbUI7WUFDakMsY0FBYyxFQUFFLGtCQUFrQjtTQUNyQyxDQUFBO1FBRUQsSUFBSSxPQUFPLEdBQUc7WUFDVixHQUFHLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxHQUFHLFNBQVMsRUFBRSxFQUFFO1lBQzlELE1BQU0sRUFBRSxLQUFLO1lBQ2IsT0FBTyxFQUFFLE9BQU87U0FDbkIsQ0FBQTtRQUVELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFVLEVBQUUsUUFBYSxFQUFFLElBQVMsRUFBRSxFQUFFO1lBQ3RELElBQUksS0FBSyxFQUFFO2dCQUNQLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDeEI7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyJ9