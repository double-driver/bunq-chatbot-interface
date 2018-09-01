"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const restify = require('restify');
const builder = require('botbuilder');
const oauth = require('./oauth');
const actions = require('./actions');
const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
server.get('/api/oauth/login', oauth.generateLoginUriEndpoint);
server.get('/api/oauth/redirect', oauth.retrieveToken);
server.post('/api/messages', connector.listen());
const inMemoryStorage = new builder.MemoryBotStorage();
const bot = new builder.UniversalBot(connector, (session) => {
    session.send("You said: %s", session.message.text);
}).set('storage', inMemoryStorage);
bot.recognizer({
    recognize: (context, done) => {
        let intent = { score: 0.0 };
        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'login':
                    intent = { score: 1.0, intent: 'Login' };
                    break;
                case 'send':
                    intent = { score: 1.0, intent: 'Send' };
                    break;
                case 'request':
                    intent = { score: 1.0, intent: 'Request' };
                    break;
                case 'balance':
                    intent = { score: 1.0, intent: 'Balance' };
                    break;
            }
        }
        done(null, intent);
    }
});
bot.dialog('firstRun', (session) => {
    session.userData.firstRun = true;
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?").endDialog();
}).triggerAction({
    onFindAction: (context, callback) => {
        if (!context.userData.firstRun) {
            callback(null, 1.1);
        }
        else {
            callback(null, 0.0);
        }
    }
});
bot.dialog('loginDialog', (session) => {
    let signinCard = new builder.SigninCard(session)
        .text('Time to connect our intelligent bot')
        .button('Connect to bunq', oauth.generateLoginUri());
    let msg = new builder.Message(session).addAttachment(signinCard);
    session.send(msg);
    session.endDialog();
}).triggerAction({ matches: 'Login' });
bot.dialog('sendDialog', (session) => {
    session.endDialog("So you want to send money. That's great I can help in that!");
}).triggerAction({ matches: 'Send' });
bot.dialog('requestDialog', (session) => {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({ matches: 'Request' });
bot.dialog('balanceDialog', async (session) => {
    const balance = await actions.getBalance();
    session.endDialog(`Your balance is €${balance}`);
}).triggerAction({ matches: 'Balance' });
database_1.database.startWeb();
database_1.database.addUser(123456789, "user", "is", "now", "added");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlDQUFvQztBQUdwQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3RDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFJckMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9ELENBQUMsQ0FBQyxDQUFDO0FBR0gsTUFBTSxTQUFTLEdBQUcsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3hDLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7SUFDakMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CO0NBQ2hELENBQUMsQ0FBQztBQUdILE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDL0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdkQsTUFBTSxD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