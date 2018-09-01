"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bunq-js-api/dist");
const oauth = require('./oauth');
const database = require('./database');
const config = new dist_1.BunqApiConfig(__dirname + '/..' + '/bunq-config.json');
class Actions {
    static getBalance(userId) {
        return new Promise(async (resolve, reject) => {
            const userData = await Actions.requestUser(userId);
            const bunqSessionFile = __dirname + '/' + config.json.bunqSessionFile + userId + '.json';
            const bunqSessionHistoryPath = __dirname + '/' + config.json.bunqSessionHistoryPath + '/bunqSession_' + userId + '.json';
            const userApiKeyId = userData.session.Response[2].UserApiKey.id;
            const token = userData.token;
            const key = new dist_1.BunqKey(userData.keypair[1]);
            const installationToken = userData.installationToken.Response[1].Token.token;
            const connect = new dist_1.BunqConnection();
            const setup = new dist_1.BunqApiSetup(connect, key, token.secret, installationToken);
            const bunqApi = new dist_1.BunqApi(connect, key, token.secret, setup, bunqSessionFile, bunqSessionHistoryPath);
            bunqApi.setPubBunqKeyPem(userData.installationToken.Response[2].ServerPublicKey.server_public_key);
            bunqApi.requestMonetaryAccountBank(userApiKeyId, '').then((response) => {
                let resp = JSON.parse(response);
                resolve(resp.Response[0].MonetaryAccountBank.balance.value);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });
        });
    }
    static async requestUser(userId) {
        return await database.retrieveUser(userId);
    }
}
module.exports = Actions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBSzBCO0FBRTFCLE1BQU0sS0FBSyxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0QyxNQUFNLFFBQVEsR0FBUSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFNUMsTUFBTSxNQUFNLEdBQWtCLElBQUksb0JBQWEsQ0FBQyxTQUFTLEdBQUcsS0FBSyxHQUFHLG1CQUFtQixDQUFDLENBQUM7QUFHekY7SUFDSSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07UUFDcEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVuRCxNQUFNLGVBQWUsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFDekYsTUFBTSxzQkFBc0IsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFDekgsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNoRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQzdCLE1BQU0sR0FBRyxHQUFZLElBQUksY0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxNQUFNLGlCQUFpQixHQUFXLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUNyRixNQUFNLE9BQU8sR0FBbUIsSUFBSSxxQkFBYyxFQUFFLENBQUM7WUFDckQsTUFBTSxLQUFLLEdBQWlCLElBQUksbUJBQVksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM1RixNQUFNLE9BQU8sR0FBWSxJQUFJLGNBQU8sQ0FDaEMsT0FBTyxFQUNQLEdBQUcsRUFDSCxLQUFLLENBQUMsTUFBTSxFQUNaLEtBQUssRUFDTCxlQUFlLEVBQ2Ysc0JBQXNCLENBQ3pCLENBQUM7WUFDRixPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUVuRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQWEsRUFBRSxFQUFFO2dCQUN4RSxJQUFJLElBQUksR0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUU7Z0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQW9CRCxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNO1FBQzNCLE9BQU8sTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDSjtBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIn0=