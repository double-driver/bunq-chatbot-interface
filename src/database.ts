import * as db from 'quick.db';
import { bunqUser, IBunqUser } from './models/bunquser';

export class database {

    static addUser(username: string, token: string): boolean {
        let UID = `bunquser${username}`;
        let user: IBunqUser = new bunqUser(username, token);
        
        db.fetch(UID)
            // Succeeds
            .then((data?:IBunqUser) => {
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


}

