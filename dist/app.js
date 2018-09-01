"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const restify = require('restify');
const builder = require('botbuilder');
const oauth = require('./oauth');
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
bot.dialog('sendDialog', (session) => {
    session.endDialog("So you want to send money. That's great I can help in that!");
}).triggerAction({ matches: 'Send' });
bot.dialog('requestDialog', (session) => {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({ matches: 'Request' });
bot.dialog('balanceDialog', (session) => {
    session.endDialog("Your balance is...");
}).triggerAction({ matches: 'Balance' });
database_1.database.startWeb();
database_1.database.addUser(123456789, "user", "is", "now", "added");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlDQUFzQztBQUd0QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3RDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUlqQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDMUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0QsQ0FBQyxDQUFDLENBQUM7QUFHSCxNQUFNLFNBQVMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDeEMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztJQUNqQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7Q0FDaEQsQ0FBQyxDQUFDO0FBR0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUUvRCxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUVqRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FB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