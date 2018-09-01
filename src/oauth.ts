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
    static generateLoginUriEndpoint(req: any, res: any, next: any) {
        res.send(Oauth.generateLoginUri);
        return next();
    }

    static generateLoginUri() {
        // TODO: Get this shit somehow into a proper multiline string
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${config.retrieveConfigVariable('clientId')}&redirect_uri=${config.retrieveConfigVariable('redirectUri')}&state=${state}`;
    }
}

module.exports = Oauth;
