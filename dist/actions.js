"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require('botbuilder');
const dist_1 = require("bunq-js-api/dist");
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
    static async sendPayment(userId, accountId, amount, iban, name, description) {
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
            bunqApi.sendPayment(userApiKeyId, accountId, amount, iban, name, description)
                .then((response) => {
                const resp = JSON.parse(response);
                resolve(resp);
            }).catch((error) => {
                console.log("error:" + error);
                reject(error);
            });
        });
    }
    static pastTransactions(userId, accountId) {
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
            bunqApi.requestPayments(userApiKeyId, accountId).then((response) => {
                let resp = JSON.parse(response);
                resolve(resp);
            }).catch((error) => {
                console.log("error : " + error);
                reject(error);
            });
        });
    }
    static generateAccountChoices(userId) {
        return new Promise(async (resolve, reject) => {
            const userData = await Actions.requestUser(userId);
            let choices = {};
            for (let account of userData.accountInfo['Response']) {
                const accountInfo = account['MonetaryAccountBank'];
                choices[accountInfo.description] = { id: accountInfo.id };
            }
            resolve(choices);
        });
    }
    static retrieveBunqMeLink(userId) {
        return new Promise(async (resolve, reject) => {
            const userData = await Actions.requestUser(userId);
            for (let account of userData.accountInfo['Response']) {
                for (let alias of account['MonetaryAccountBank']['alias']) {
                    if (alias.type === 'URL') {
                        resolve(alias.value);
                        return;
                    }
                }
            }
            reject(false);
        });
    }
    static createReceiptCard(title, amount, recipientIban, recipientName, description, session) {
        return new builder.ReceiptCard(session)
            .title(title)
            .facts([
            builder.Fact.create(session, recipientIban, 'Recpient\'s IBAN'),
            builder.Fact.create(session, recipientName, 'Recpient\'s Name'),
            builder.Fact.create(session, description, 'Description')
        ])
            .total('€' + amount);
    }
    static async requestUser(userId) {
        return await database.retrieveUser(userId);
    }
}
module.exports = Actions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3RDLDJDQUswQjtBQUUxQixNQUFNLFFBQVEsR0FBUSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFNUMsTUFBTSxNQUFNLEdBQWtCLElBQUksb0JBQWEsQ0FBQyxTQUFTLEdBQUcsS0FBSyxHQUFHLG1CQUFtQixDQUFDLENBQUM7QUFHekY7SUFDSSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07UUFDcEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVuRCxNQUFNLGVBQWUsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFDekYsTUFBTSxzQkFBc0IsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFDekgsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNoRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQzdCLE1BQU0sR0FBRyxHQUFZLElBQUksY0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxNQUFNLGlCQUFpQixHQUFXLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FB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