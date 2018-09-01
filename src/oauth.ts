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

// Link generation
const oauthLinkEndpoint = 'https://oauth.bunq.com/auth';
const responseType = 'code';
const state = 'doubledriver';

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
const userDataFile = secretsPath + '/requestUserResponse.json';


class Oauth {
    static async generateLoginUriEndpoint(req: any, res: any, next: any) {
        res.send(Oauth.generateLoginUri());
        return next();
    }

    static async retrieveToken(req: any, res: any, next: any) {
        try {
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

            // Write token into a file
            fs.writeFileSync(secretsFile, JSON.stringify({
                secret: response.data[accessToken],
                description: 'bunq-chatbot-interface'
            }));

            // Create new public/private key pair
            await Oauth.createKeys();

            // Install the new key pair with the bunq API
            await Oauth.installKeys();

            // Create device server
            await Oauth.createDeviceServer();

            // Create session
            await Oauth.createSession();

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
                let publicKeyName: string = secretsPath + "/clientPublicKey" + ".pem";
                fs.writeFileSync(publicKeyName, publicPem);

                let privatePem = bunqKey.toPrivateKeyString();
                let privateKeyName: string = secretsPath + "/clientPrivateKey" + ".pem";
                fs.writeFileSync(privateKeyName, privatePem);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    static installKeys() {
        return new Promise(async (resolve, reject) => {
            const key: BunqKey = BunqKey.createFromPrivateKeyFile(privateKeyFile);
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, "", "");

            try {
                const response = await setup.installKey();
                fs.writeFileSync(secretsPath + '/bunqInstallationToken' + '.json', response);
                let resp: any = JSON.parse(response);
                console.log("installation token: " + resp.Response[1].Token.token);
                console.log("Bunq server public key: " + resp.Response[2].ServerPublicKey.server_public_key);
                resolve(resp.Response[1].Token.token);
            } catch (e) {
                console.log("error : " + e, 'installKeys()');
                reject(e);
            }
        });
    }

    static createDeviceServer() {
        return new Promise((resolve, reject) => {
            const deviceServerConfig = BunqApiConfig.readJson(secretsFile);
            const key: BunqKey = BunqKey.createFromPrivateKeyFile(privateKeyFile);
            const installationTokenConfig = BunqApiConfig.readJson(installationTokenFile);
            const installationToken: string = installationTokenConfig.Response[1].Token.token;
            console.log(installationToken);
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, deviceServerConfig.secret, installationToken);

            setup.createDeviceServer(deviceServerConfig.description).then((response: string) => {
                fs.writeFileSync(secretsPath + '/bunqDeviceServerResponse' + '.json', response);
                let resp: any = JSON.parse(response);
                console.log('created device server id: ' + resp.Response[0].Id.id);
                resolve(resp.Response[0].Id.id);
            }).catch((error: string) => {
                console.log('error : ' + error, 'createDeviceServer()');
                reject(error);
            });
        });
    }

    static createSession() {
        return new Promise((resolve, reject) => {
            const deviceServerConfig = BunqApiConfig.readJson(secretsFile);
            const privateKeyPem: string = BunqApiConfig.read(privateKeyFile);
            const key: BunqKey = new BunqKey(privateKeyPem);
            const installationTokenConfig = BunqApiConfig.readJson(installationTokenFile);
            const installationToken: string = installationTokenConfig.Response[1].Token.token;
            const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, deviceServerConfig.secret, installationToken);

            setup.createSessionServer().then((response: string) => {
                console.log(response);
                fs.writeFileSync(bunqSessionHistoryPath + "/bunqSession_" + ".json", response);
                fs.writeFileSync(bunqSessionFile, response);
                let resp: any = JSON.parse(response);
                console.log("created session server id: " + resp.Response[1].Token.id);
                console.log("created session server token: " + resp.Response[1].Token.token);
                resolve();
            }).catch((error: string) => {
                console.log("error : " + error, 'createSession()');
                reject();
            });
        });
    }

    static requestUser() {
        return new Promise((resolve, reject) => {
            const deviceServerConfig = BunqApiConfig.readJson(secretsFile);
            const privateKeyPem: string = BunqApiConfig.read(privateKeyFile);
            const key: BunqKey = new BunqKey(privateKeyPem);
            const installationTokenConfig = BunqApiConfig.readJson(installationTokenFile);
            const installationToken: string = installationTokenConfig.Response[1].Token.token;
            const connect: BunqConnection = new BunqConnection();
            const setup: BunqApiSetup = new BunqApiSetup(connect, key, deviceServerConfig.secret, installationToken);
            const bunqApi: BunqApi = new BunqApi(
                connect,
                key,
                deviceServerConfig.secret,
                setup,
                bunqSessionFile,
                bunqSessionHistoryPath
            );

            bunqApi.setPubBunqKeyPem(installationTokenConfig.Response[2].ServerPublicKey.server_public_key);

            bunqApi.requestUser().then((response: string) => {
                console.log(response);
                fs.writeFileSync(secretsPath + "/requestUserResponse.json", response);
                resolve();
            }).catch(function (error: string) {
                console.log("error : " + error);
                reject();
            });
        });
    }

    static getBalance() {
        return new Promise((resolve, reject) => {
            const userData = BunqApiConfig.readJson(userDataFile);
            const deviceServerConfig = BunqApiConfig.readJson(secretsFile);
            const privateKeyPem: string = BunqApiConfig.read(privateKeyFile);
            const key: BunqKey = new BunqKey(privateKeyPem);
            const installationTokenConfig = BunqApiConfig.readJson(installationTokenFile);
            const installationToken: string = installationTokenConfig.Response[1].Token.token;
            const connect: BunqConnection = new BunqConnection();
            const setup: BunqApiSetup = new BunqApiSetup(connect, key, deviceServerConfig.secret, installationToken);
            const bunqApi: BunqApi = new BunqApi(
                connect,
                key,
                deviceServerConfig.secret,
                setup,
                bunqSessionFile,
                bunqSessionHistoryPath
            );

            bunqApi.setPubBunqKeyPem(installationTokenConfig.Response[2].ServerPublicKey.server_public_key);

            bunqApi.requestMonetaryAccountBank(userData.Response[0].UserApiKey.id, deviceServerConfig.accountId).then((response: any) => {
                console.log(response);
                fs.writeFileSync(secretsPath + "/requestMABResponse.json", response);
                let resp: any = JSON.parse(response);
                console.log("balance: " + resp.Response[0].MonetaryAccountBank.balance.value);
                resolve(resp.Response[0].MonetaryAccountBank.balance.value);
            }).catch(function (error: string) {
                console.log(error);
                reject(error);
            });
        });
    }

    static generateLoginUri() {
        // TODO: Get this shit into a proper multiline string somehow
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${configHandler.retrieveConfigVariable('clientId')}&redirect_uri=${configHandler.retrieveConfigVariable('redirectUri')}&state=${state}`;
    }
}

module.exports = Oauth;
