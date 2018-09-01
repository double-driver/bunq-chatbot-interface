"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
const fs = require('fs');
const dist_1 = require("bunq-js-api/dist");
const configHandler = require('./config');
const database = require('./database');
const oauthLinkEndpoint = 'https://oauth.bunq.com/auth';
const responseType = 'code';
const state = 'state';
const oauthTokenExchangeEndpoint = 'https://api.oauth.bunq.com/v1/token';
const grantType = 'authorization_code';
const accessToken = 'access_token';
const config = new dist_1.BunqApiConfig(__dirname + '/..' + '/bunq-config.json');
const secretsPath = __dirname + '/' + config.json.secretsPath;
const secretsFile = __dirname + '/' + config.json.secretsFile;
const installationTokenFile = __dirname + '/' + config.json.installationTokenFile;
const privateKeyFile = __dirname + '/' + config.json.privateKeyFile;
const bunqSessionFile = __dirname + '/' + config.json.bunqSessionFile;
const bunqSessionHistoryPath = __dirname + '/' + config.json.bunqSessionHistoryPath;
class Oauth {
    static async generateLoginUriEndpoint(req, res, next) {
        res.send(Oauth.generateLoginUri('double-driver'));
        return next();
    }
    static async retrieveToken(req, res, next) {
        try {
            const userId = req.query[state];
            const response = await axios.request({
                url: oauthTokenExchangeEndpoint,
                method: 'post',
                params: {
                    'grant_type': grantType,
                    'code': req.query[responseType],
                    'redirect_uri': configHandler.retrieveConfigVariable('redirectUri'),
                    'client_id': configHandler.retrieveConfigVariable('clientId'),
                    'client_secret': configHandler.retrieveConfigVariable('clientSecret'),
                }
            });
            const token = {
                secret: response.data[accessToken],
                description: 'bunq-chatbot-interface'
            };
            const keypair = await Oauth.createKeys();
            const installationToken = await Oauth.installKeys(keypair[1]);
            const deviceServer = await Oauth.createDeviceServer(token, keypair[1], installationToken);
            const session = await Oauth.createSession(userId, token, keypair[1], installationToken);
            const accountInfo = await Oauth.retrieveAccountInfo(userId, {
                userId,
                token,
                keypair,
                installationToken,
                deviceServer,
                session
            });
            await database.createUser({
                userId,
                token,
                keypair,
                installationToken,
                deviceServer,
                session,
                accountInfo
            });
            res.send('Successful!');
        }
        catch (e) {
            console.error(e, 'retrieveToken()');
            res.send('Error!');
        }
    }
    static createKeys() {
        return new Promise((resolve, reject) => {
            try {
                let bunqKey = dist_1.BunqKey.createNew();
                let publicPem = bunqKey.toPublicKeyString();
                let privatePem = bunqKey.toPrivateKeyString();
                resolve([publicPem, privatePem]);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static installKeys(privateKey) {
        return new Promise(async (resolve, reject) => {
            const key = new dist_1.BunqKey(privateKey);
            const setup = new dist_1.BunqApiSetup(new dist_1.BunqConnection(), key, "", "");
            try {
                const response = await setup.installKey();
                let resp = JSON.parse(response);
                resolve(resp);
            }
            catch (e) {
                console.log("error : " + e, 'installKeys()');
                reject(e);
            }
        });
    }
    static createDeviceServer(token, privateKey, installationTokenData) {
        return new Promise((resolve, reject) => {
            const key = new dist_1.BunqKey(privateKey);
            const installationToken = installationTokenData.Response[1].Token.token;
            const setup = new dist_1.BunqApiSetup(new dist_1.BunqConnection(), key, token.secret, installationToken);
            setup.createDeviceServer(token.description).then((response) => {
                let resp = JSON.parse(response);
                resolve(resp);
            }).catch((error) => {
                console.log('error : ' + error, 'createDeviceServer()');
                reject(error);
            });
        });
    }
    static createSession(userId, token, privateKey, installationTokenData) {
        return new Promise((resolve, reject) => {
            const key = new dist_1.BunqKey(privateKey);
            const installationToken = installationTokenData.Response[1].Token.token;
            const setup = new dist_1.BunqApiSetup(new dist_1.BunqConnection(), key, token.secret, installationToken);
            setup.createSessionServer().then((response) => {
                console.log(response);
                fs.writeFileSync(bunqSessionHistoryPath + '/bunqSession_' + userId + '.json', response);
                fs.writeFileSync(bunqSessionFile + userId + '.json', response);
                let resp = JSON.parse(response);
                resolve(resp);
            }).catch((error) => {
                console.log("error : " + error, 'createSession()');
                reject();
            });
        });
    }
    static retrieveAccountInfo(userId, userData) {
        return new Promise((resolve, reject) => {
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
                resolve(resp);
            }).catch((error) => {
                console.log(error);
                reject(error);
            });
        });
    }
    static generateLoginUri(userId) {
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${configHandler.retrieveConfigVariable('clientId')}&redirect_uri=${configHandler.retrieveConfigVariable('redirectUri')}&state=${userId}`;
    }
}
module.exports = Oauth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2F1dGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvb2F1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxNQUFNLEtBQUssR0FBUSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLDJDQU0wQjtBQUUxQixNQUFNLGFBQWEsR0FBUSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3ZDLE1BQU0saUJBQWlCLEdBQUcsNkJBQTZCLENBQUM7QUFDeEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUd0QixNQUFNLDBCQUEwQixHQUFHLHFDQUFxQyxDQUFDO0FBQ3pFLE1BQU0sU0FBUyxHQUFHLG9CQUFvQixDQUFDO0FBQ3ZDLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQztBQUduQyxNQUFNLE1BQU0sR0FBa0IsSUFBSSxvQkFBYSxDQUFDLFNBQVMsR0FBRyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztBQUN6RixNQUFNLFdBQVcsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLFNBQVMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDOUQsTUFBTSxxQkFBcUIsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7QUFDbEYsTUFBTSxjQUFjLEdBQUcsU0FBUyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNwRSxNQUFNLGVBQWUsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1B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