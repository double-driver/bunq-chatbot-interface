import * as db from 'quick.db';
import { bunqUser, IBunqUser } from './models/bunquser';

export class database {

    static addUser(user_id:Number, user_public_key: string,user_private_key: string,server_public_key: string,token: string): boolean {
        let UID = `bunquser${user_id}`;
        let user: IBunqUser = new bunqUser();

        user.server_public_key = server_public_key;
        user.token = token;
        user.user_id = user_id;
        user.user_private_key = user_private_key;
        user.user_public_key = user_public_key;

        db.fetch(UID)
            // Succeeds
            .then((data?: IBunqUser) => {
                // Check if user isn't found
                if (data == null) {
                    // User not found -> add to db
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

