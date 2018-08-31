// NPM packages
const restify = require('restify');
const builder = require('botbuilder');

// API classes
const oauth = require('./src/oauth');


// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users
server.post('/api/oauth/login', oauth.generateLoginUri);
server.post('/api/oauth/redirect', oauth.generateLoginUri);
server.post('/api/messages', connector.listen());

const inMemoryStorage = new builder.MemoryBotStorage();

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector, (session: any) => {
    session.send("You said: %s", session.message.text);
}).set('storage', inMemoryStorage);

// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
    recognize: (context: any, done: any) => {
        let intent = {score: 0.0};

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'send':
                    // @ts-ignore
                    intent = {score: 1.0, intent: 'Send'};
                    break;
                case 'request':
                    // @ts-ignore
                    intent = {score: 1.0, intent: 'Request'};
                    break;
                case 'balance':
                    // @ts-ignore
                    intent = {score: 1.0, intent: 'Balance'};
                    break;
            }
        }
        done(null, intent);
    }
});

// Add first run dialog
bot.dialog('firstRun', (session: any) => {
    session.userData.firstRun = true;
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?").endDialog();
}).triggerAction({
    onFindAction: (context: any, callback: any) => {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});

bot.dialog('sendDialog', (session: any) => {
    session.endDialog("So you want to send money. That's great I can help in that!");
}).triggerAction({matches: 'Send'});

bot.dialog('requestDialog', (session: any) => {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({matches: 'Request'});

bot.dialog('balanceDialog', (session: any) => {
    session.endDialog("Your balance is...");
}).triggerAction({matches: 'Balance'});
