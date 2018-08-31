"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const restify = require('restify');
const builder = require('botbuilder');
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
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
database_1.database.addUser("mick", "tokenhere");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlDQUFzQztBQUV0QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3RDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRSxHQUFHLEVBQUU7SUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQztBQUdILE1BQU0sU0FBUyxHQUFHLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUN4QyxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjO0lBQ2pDLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQjtDQUNoRCxDQUFDLENBQUM7QUFHSCxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUVqRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBR3ZELE1BQU0sR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFZLEVBQUUsRUFBRTtJQUM3RCxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxT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