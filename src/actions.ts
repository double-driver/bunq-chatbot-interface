import {
    BunqApi, BunqApiConfig,
    BunqApiSetup,
    BunqConnection,
    BunqKey
} from 'bunq-js-api/dist';

const oauth: any = require('./oauth');
const database: any = require('./database');

const config: BunqApiConfig = new BunqApiConfig(__dirname + '/..' + '/bunq-config.json');


class Actions {
    static getBalance(userId) {
        return new Promise(async (resolve, reject) => {
            const userData = await Actions.requestUser(userId);

            const bunqSessionFile = __dirname + '/' + config.json.bunqSessionFile + userId + '.json';
            const bunqSessionHistoryPath = __dirname + '/' + config.json.bunqSessionHistoryPath + '/bunqSession_' + userId + '.json';
            const userApiKeyId = userData.session.Response[2].UserApiKey.id;
            const token = userData.token;
            const key: BunqKey = new BunqKey(userData.keypair[1]);
            const installationToken: string = userData.installationToken.Response[1].Token.token;
            const connect: BunqConnection = new BunqConnection();
            const setup: BunqApiSetup = new BunqApiSetup(connect, key, token.secret, installationToken);
            const bunqApi: BunqApi = new BunqApi(
                connect,
                key,
                token.secret,
                setup,
                bunqSessionFile,
                bunqSessionHistoryPath
            );
            bunqApi.setPubBunqKeyPem(userData.installationToken.Response[2].ServerPublicKey.server_public_key);

            bunqApi.requestMonetaryAccountBank(userApiKeyId, '').then((response: any) => {
                let resp: any = JSON.parse(response);
                resolve(resp.Response[0].MonetaryAccountBank.balance.value);
            }).catch((error: string) => {
                console.log(error);
                reject(error);
            });
        });
    }

    // static sendPayment(amount, iban, name, description) {
    //     bunqApi.sendPayment(
    //         deviceServerConfig.userId,
    //         deviceServerConfig.accountId,
    //         amount,
    //         iban,
    //         name,
    //         description
    //     )
    //         .then((response: string) => {
    //             const resp: any = JSON.parse(response);
    //             console.log("balance: " + resp.Response[0].MonetaryAccountBank.balance.value);
    //             return resp;
    //         }).catch((error: string) => {
    //             console.log("error:" + error);
    //         });
    // }

    static async requestUser(userId) {
        return await database.retrieveUser(userId);
    }
}

module.exports = Actions;
