// Imports
const axios: any = require('axios');
const fs = require('fs');
import {
    BunqKey,
    BunqApi,
    BunqApiConfig,
    BunqApiSetup,
    BunqConnection,
} from 'bunq-js-api/dist';

const configHandler: any = require('./config');
const database = require('./database');

// Link generation
const oauthLinkEndpoint = 'https://oauth.bunq.com/auth';
const responseType = 'code';
const state = 'state';

// Token exchange
const oauthTokenExchangeEndpoint = 'https://api.oauth.bunq.com/v1/token';
const grantType = 'authorization_code';
const accessToken = 'access_token';

// Bunq API config
const config: BunqApiConfig = new BunqApiConfig(__dirname + '/..' + '/bunq-config.json');
const secretsPath = __dirname + '/' + config.json.secretsPath;
const secretsFile = __dirname + '/' + config.json.secretsFile;
const installationTokenFile = __dirname + '/' + config.json.installationTokenFile;
const privateKeyFile = __dirname + '/' + config.json.privateKeyFile;
const bunqSessionFile = __dirname + '/' + config.json.bunqSessionFile;
const bunqSessionHistoryPath = __dirname + '/' + config.json.bunqSessionHistoryPath;


class Oauth {
    static async generateLoginUriEndpoint(req: any, res: any, next: any) {
        res.send(Oauth.generateLoginUri('double-driver'));
        return next();
    }

    static async retrieveToken(req: any, res: any, next: any) {
        try {
            // Set current user
            const userId = req.query[state];

            // Retrieve token
            const response: any = await axios.request({
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

            // Save token
            const token = {
                secret: response.data[accessToken],
                description: 'bunq-chatbot-interface'
            };

            // Create new public/private key pair
            const keypair = await Oauth.createKeys();

            // Install the new key pair with the bunq API
            const installationToken = await Oauth.installKeys(keypair[1]);

            // Create device server
            const deviceServer = await Oauth.createDeviceServer(token, keypair[1], installationToken);

            // Create session
            const session = await Oauth.createSession(userId, token, keypair[1], installationToken);

            database.createUser({
                userId,
                token,
                keypair,
                installationToken,
                deviceServer,
                session
            });

            res.send('Successful!');
        } catch (e) {
            console.error(e, 'retrieveToken()');
            res.send('Error!');
        }
    }

    static createKeys() {
        return new Promise((resolve, reject) => {
            try {
                let bunqKey: BunqKey = BunqKey.createNew();
                let publicPem = bunqKey.toPublicKeyString();
                let privatePem = bunqKey.toPrivateKeyString();

                resolve([publicPem, privatePem]);
            } catch (e) {
                reject(e);
            }
        });
    }

    static installKeys(privateKey) {
        return new Promise(async (resolve, reject) => {
            const key: BunqKey = new BunqKey(privateKey);
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, "", "");

            try {
                const response = await setup.installKey();
                let resp: any = JSON.parse(response);
                resolve(resp);
            } catch (e) {
                console.log("error : " + e, 'installKeys()');
                reject(e);
            }
        });
    }

    static createDeviceServer(token, privateKey, installationTokenData) {
        return new Promise((resolve, reject) => {
            const key: BunqKey = new BunqKey(privateKey);
            const installationToken: string = installationTokenData.Response[1].Token.token;
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, token.secret, installationToken);

            setup.createDeviceServer(token.description).then((response: string) => {
                let resp: any = JSON.parse(response);
                resolve(resp);
            }).catch((error: string) => {
                console.log('error : ' + error, 'createDeviceServer()');
                reject(error);
            });
        });
    }

    static createSession(userId, token, privateKey, installationTokenData) {
        return new Promise((resolve, reject) => {
            const key: BunqKey = new BunqKey(privateKey);
            const installationToken: string = installationTokenData.Response[1].Token.token;
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, token.secret, installationToken);

            setup.createSessionServer().then((response: string) => {
                console.log(response);
                fs.writeFileSync(bunqSessionHistoryPath + '/bunqSession_' + userId + '.json', response);
                fs.writeFileSync(bunqSessionFile + userId + '.json', response);
                let resp: any = JSON.parse(response);
                resolve(resp);
            }).catch((error: string) => {
                console.log("error : " + error, 'createSession()');
                reject();
            });
        });
    }

    static generateLoginUri(userId) {
        // TODO: Get this shit into a proper multiline string somehow
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${configHandler.retrieveConfigVariable('clientId')}&redirect_uri=${configHandler.retrieveConfigVariable('redirectUri')}&state=${userId}`;
    }
}

module.exports = Oauth;
