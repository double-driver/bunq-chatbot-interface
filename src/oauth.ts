// Imports
const axios: any = require('axios');
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
    static generateLoginUri(req: any, res: any, next: any) {
        // TODO: Get this shit somehow into a proper multiline string
        const oauthUri = `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${config.retrieveConfigVariable('clientId')}&redirect_uri=${config.retrieveConfigVariable('redirectUri')}&state=${state}`;

        res.send(oauthUri);
        return next();
    }
}

module.exports = Oauth;
