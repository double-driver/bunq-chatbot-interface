import {
    BunqApi,
    BunqApiConfig,
    BunqApiSetup,
    BunqConnection,
    BunqKey
} from 'bunq-js-api/dist';

const oauth: any = require('./oauth');

// Bunq API config
const config: BunqApiConfig = new BunqApiConfig(__dirname + '/..' + '/bunq-config.json');
const secretsPath = __dirname + '/' + config.json.secretsPath;
const secretsFile = __dirname + '/' + config.json.secretsFile;
const installationTokenFile = __dirname + '/' + config.json.installationTokenFile;
const privateKeyFile = __dirname + '/' + config.json.privateKeyFile;
const bunqSessionFile = __dirname + '/' + config.json.bunqSessionFile;
const bunqSessionHistoryPath = __dirname + '/' + config.json.bunqSessionHistoryPath;
const userDataFile = secretsPath + '/requestUserResponse.json';


class Actions {
    static getBalance() {
        return new Promise(async (resolve, reject) => {
            await oauth.requestUser();

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
                let resp: any = JSON.parse(response);
                resolve(resp.Response[0].MonetaryAccountBank.balance.value);
            }).catch((error: string) => {
                console.log(error);
                reject(error);
            });
        });
    }
}

module.exports = Actions;
