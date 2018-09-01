// Imports
const axios: any = require('axios');
const fs = require('fs');
import {
    BunqKey,
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
const keyPath = __dirname + '/' + config.json.privateKeyFile;

class Oauth {
    static generateLoginUriEndpoint(req: any, res: any, next: any) {
        res.send(Oauth.generateLoginUri());
        return next();
    }

    static retrieveToken(req: any, res: any, next: any) {
        axios.request({
            url: oauthTokenExchangeEndpoint,
            method: 'post',
            params: {
                'grant_type': grantType,
                'code': req.query[responseType],
                'redirect_uri': configHandler.retrieveConfigVariable('redirectUri'),
                'client_id': configHandler.retrieveConfigVariable('clientId'),
                'client_secret': configHandler.retrieveConfigVariable('clientSecret'),
            }
        })
            .then((response: any) => {
                // Write token into a file
                fs.writeFileSync(secretsFile, JSON.stringify({
                    secret: response.data[accessToken],
                    description: 'bunq-chatbot-interface'
                }));

                // Create new public/private key pair
                Oauth.createKeys();

                // Install the new key pair with the bunq API
                Oauth.installKeys();



                res.send('Successful!');
            })
            .catch((error: any) => {
                console.error(error);
                res.send('Error!');
            });
    }

    static createKeys() {
        let bunqKey: BunqKey = BunqKey.createNew();
        let publicPem = bunqKey.toPublicKeyString();
        let publicKeyName: string = secretsPath + "/clientPublicKey" + ".pem";
        fs.writeFileSync(publicKeyName, publicPem);

        let privatePem = bunqKey.toPrivateKeyString();
        let privateKeyName: string = secretsPath + "/clientPrivateKey" + ".pem";
        fs.writeFileSync(privateKeyName, privatePem);
    }

    static installKeys() {
        const key: BunqKey = BunqKey.createFromPrivateKeyFile(keyPath);
        const setup: BunqApiSetup = new BunqApiSetup(new BunqConnection(), key, "", "");

        setup.installKey().then((response: string) => {
            let resp: any = JSON.parse(response);
            fs.writeFileSync(secretsPath + '/bunqInstallationToken' + '.json', response);
            console.log("installation token: " + resp.Response[1].Token.token);
            console.log("Bunq server public key: " + resp.Response[2].ServerPublicKey.server_public_key);
        }).catch((error: string) => {
            console.log("error : " + error);
        });
    }

    static generateLoginUri() {
        // TODO: Get this shit somehow into a proper multiline string
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${configHandler.retrieveConfigVariable('clientId')}&redirect_uri=${configHandler.retrieveConfigVariable('redirectUri')}&state=${state}`;
    }
}

module.exports = Oauth;
