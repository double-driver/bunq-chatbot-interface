// Imports
const axios: any = require('axios');
const fs = require('fs');
import {
    BunqKey,
    BunqApiConfig
} from 'bunq-js-api/dist';

const config: any = require('./config');

// Link generation
const oauthLinkEndpoint = 'https://oauth.bunq.com/auth';
const responseType = 'code';
const state = 'doubledriver';

// Token exchange
const oauthTokenExchangeEndpoint = 'https://api.oauth.bunq.com/v1/token';
const grantType = 'authorization_code';
const accessToken = 'access_token';

class Oauth {
    static generateLoginUriEndpoint(req: any, res: any, next: any) {
        Oauth.createKeys();
        res.send(Oauth.generateLoginUri());
        return next();
    }

    static createKeys() {
        const config: BunqApiConfig = new BunqApiConfig(__dirname + '/..' + '/bunq-config.json');
        const secretsPath = __dirname + '/' + config.json.secretsPath;

        let bunqKey: BunqKey = BunqKey.createNew();
        let publicPem = bunqKey.toPublicKeyString();
        let publicKeyName: string = secretsPath + "/publicKey" + ".pem";
        console.log(secretsPath);
        fs.writeFileSync(publicKeyName, publicPem);

        let privatePem = bunqKey.toPrivateKeyString();
        let privateKeyName: string = secretsPath + "/privateKey" + ".pem";
        fs.writeFileSync(privateKeyName, privatePem);
    }

    static generateLoginUri() {
        // TODO: Get this shit somehow into a proper multiline string
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${config.retrieveConfigVariable('clientId')}&redirect_uri=${config.retrieveConfigVariable('redirectUri')}&state=${state}`;
    }
}

module.exports = Oauth;
