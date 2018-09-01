import { IBunqUser, bunqUser } from "./models/bunquser";
import * as request from "request";

const conf = require("./config");

class Api {

    static createUser(
        user_id: Number,
        user_public_key: string,
        user_private_key: string,
        server_public_key: string,
        token: string) {

        let user: IBunqUser = new bunqUser();

        user.user_id = user_id;
        user.token = token;
        user.server_public_key = server_public_key;
        user.user_private_key = user_private_key;
        user.user_public_key = user_public_key;

        const headers = {
            'User-Agent': 'DoubleDrive/0.0.1',
            'Content-Type': 'application/json'
        }

        var options = {
            url: conf.retrieveConfigVariable("apiBaseUrl") + "user",
            method: "POST",
            headers: headers,
            json: user
        }

        request(options, (error: any, response: any, body: any) => {
            if (error) {
                console.error(error);
            }

            console.log(response);
            console.log(body);
        });
    }

    static getUser(id:Number):IBunqUser {
        let user:IBunqUser = new bunqUser();

        const headers = {
            'User-Agent': 'DoubleDrive/0.0.1',
            'Content-Type': 'application/json'
        }

        var options = {
            url: conf.retrieveConfigVariable("apiBaseUrl") + `/user/${id}`,
            method: "GET",
            headers: headers
        }

        request(options, (error: any, response: any, body: any) => {
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