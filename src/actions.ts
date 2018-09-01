const builder = require('botbuilder');
import {
    BunqApi, BunqApiConfig,
    BunqApiSetup,
    BunqConnection,
    BunqKey
} from 'bunq-js-api/dist';

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

    static async sendPayment(userId, accountId, amount, iban, name, description) {
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

            bunqApi.sendPayment(
                userApiKeyId,
                accountId,
                amount,
                iban,
                name,
                description
            )
                .then((response: string) => {
                    const resp: any = JSON.parse(response);
                    resolve(resp);
                }).catch((error: string) => {
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

            bunqApi.requestPayments(userApiKeyId, accountId).then((response: string) => {
                let resp: any = JSON.parse(response);
                resolve(resp);
            }).catch((error: string) => {
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
                choices[accountInfo.description] = {id: accountInfo.id};
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
            // .items([
            //     builder.ReceiptItem.create(session, '', '')
            //         .quantity(368)
            //         .image(builder.CardImage.create(session, 'https://github.com/amido/azure-vector-icons/raw/master/renders/traffic-manager.png'))
            // ])
            .total('€' + amount);
    }

    static async requestUser(userId) {
        return await database.retrieveUser(userId);
    }
}

module.exports = Actions;
