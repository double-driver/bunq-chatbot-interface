const config: any = require('./config');

const oauthEndpoint = 'https://oauth.bunq.com/auth';
const responseType = 'code';
const state = 'doubledriver';

class Oauth {
    static generateLoginUri(req: any, res: any, next: any) {
        // TODO: Get this shit somehow into a proper multiline string
        const oauthUri = `${oauthEndpoint}?response_type=${responseType}&client_id=${config.retrieveConfigVariable('clientId')}&redirect_uri=${config.retrieveConfigVariable('redirectUri')}&state=${state}`;

        res.send(oauthUri);
        return next();
    }
}

module.exports = Oauth;
