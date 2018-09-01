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
            database.createUser({
                userId,
                token,
                keypair,
                installationToken,
                deviceServer,
                session
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
    static generateLoginUri(userId) {
        return `${oauthLinkEndpoint}?response_type=${responseType}&client_id=${configHandler.retrieveConfigVariable('clientId')}&redirect_uri=${configHandler.retrieveConfigVariable('redirectUri')}&state=${userId}`;
    }
}
module.exports = Oauth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2F1dGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvb2F1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxNQUFNLEtBQUssR0FBUSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLDJDQU0wQjtBQUUxQixNQUFNLGFBQWEsR0FBUSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3ZDLE1BQU0saUJBQWlCLEdBQUcsNkJBQTZCLENBQUM7QUFDeEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUd0QixNQUFNLDBCQUEwQixHQUFHLHFDQUFxQyxDQUFDO0FBQ3pFLE1BQU0sU0FBUyxHQUFHLG9CQUFvQixDQUFDO0FBQ3ZDLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQztBQUduQyxNQUFNLE1BQU0sR0FBa0IsSUFBSSxvQkFBYSxDQUFDLFNBQVMsR0FBRyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztBQUN6RixNQUFNLFdBQVcsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLFNBQVMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDOUQsTUFBTSxxQkFBcUIsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7QUFDbEYsTUFBTSxjQUFjLEdBQUcsU0FBUyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNwRSxNQUFNLGVBQWUsR0FBRyxTQUFTLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO0FBQ3RFLE1BQU0sc0JBQXNCLEdBQUcsU0FBUyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDO0FBR3BGO0lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxHQUFRLEVBQUUsR0FBUSxFQUFFLElBQVM7UUFDL0QsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNsRCxPQUFPLElBQUksRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFRLEVBQUUsR0FBUSxFQUFFLElBQVM7UUFDcEQsSUFBSTtZQUVBLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFHaEMsTUFBTSxRQUFRLEdBQVEsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUN0QyxHQUFHLEVBQUUsMEJBQTBCO2dCQUMvQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxNQUFNLEVBQUU7b0JBQ0osWUFBWSxFQUFFLFNBQVM7b0JBQ3ZCLE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztvQkFDL0IsY0FBYyxFQUFFLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhLENBQUM7b0JBQ25FLFdBQVcsRUFBRSxhQUFhLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDO29CQUM3RCxlQUFlLEVBQUUsYUFBYSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQztpQkFDeEU7YUFDSixDQUFDLENBQUM7WUFHSCxNQUFNLEtBQUssR0FBRztnQkFDVixNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ2xDLFdBQVcsRUFBRSx3QkFBd0I7YUFDeEMsQ0FBQztZQUdGLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBR3pDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRzlELE1BQU0sWUFBWSxHQUFHLE1BQU0sS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUcxRixNQUFNLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUV4RixRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNoQixNQUFNO2dCQUNOLEtBQUs7Z0JBQ0wsT0FBTztnQkFDUCxpQkFBaUI7Z0JBQ2pCLFlBQVk7Z0JBQ1osT0FBTzthQUNWLENBQUMsQ0FBQztZQUVILEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDM0I7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN0QjtJQUNMLENBQUM7SUFFRCxNQUFNLENBQUMsVUFBVTtRQUNiLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsSUFBSTtnQkFDQSxJQUFJLE9BQU8sR0FBWSxjQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFFOUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7YUFDcEM7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDYjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVTtRQUN6QixPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDekMsTUFBTSxHQUFHLEdBQVksSUFBSSxjQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0MsTUFBTSxLQUFLLEdBQWlCLElBQUksbUJBQVksQ0FBQyxJQUFJLHFCQUFjLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWhGLElBQUk7Z0JBQ0EsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzFDLElBQUksSUFBSSxHQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2I7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxNQUFNLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxxQkFBcUI7UUFDOUQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLEdBQUcsR0FBWSxJQUFJLGNBQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QyxNQUFNLGlCQUFpQixHQUFXLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ2hGLE1BQU0sS0FBSyxHQUFpQixJQUFJLG1CQUFZLENBQUMsSUFBSSxxQkFBYyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUV6RyxLQUFLLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtnQkFDbEUsSUFBSSxJQUFJLEdBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQWEsRUFBRSxFQUFFO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxxQkFBcUI7UUFDakUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLEdBQUcsR0FBWSxJQUFJLGNBQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QyxNQUFNLGlCQUFpQixHQUFXLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ2hGLE1BQU0sS0FBSyxHQUFpQixJQUFJLG1CQUFZLENBQUMsSUFBSSxxQkFBYyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUV6RyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFnQixFQUFFLEVBQUU7Z0JBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RCLEVBQUUsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLEdBQUcsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3hGLEVBQUUsQ0FBQyxhQUFhLENBQUMsZUFBZSxHQUFHLE1BQU0sR0FBRyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQy9ELElBQUksSUFBSSxHQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFhLEVBQUUsRUFBRTtnQkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25ELE1BQU0sRUFBRSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtRQUUxQixPQUFPLEdBQUcsaUJBQWlCLGtCQUFrQixZQUFZLGNBQWMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsYUFBYSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxVQUFVLE1BQU0sRUFBRSxDQUFDO0lBQ2xOLENBQUM7Q0FDSjtBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDIn0=