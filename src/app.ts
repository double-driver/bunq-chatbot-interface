

// NPM packages
const restify = require('restify');
const builder = require('botbuilder');

// API classes
const database = require('./database');
const oauth = require('./oauth');
const actions = require('./actions');


// Setup Restify Server
const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users
server.get('/api/oauth/login', oauth.generateLoginUriEndpoint);
server.get('/api/oauth/redirect', oauth.retrieveToken);
server.post('/api/messages', connector.listen());

const inMemoryStorage = new builder.MemoryBotStorage();

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);

// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
    recognize: (context: any, done: any) => {
        let intent = {score: 0.0};

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'login':
                    // @ts-ignore
                    intent = {score: 1.0, intent: 'Login'};
                    break;
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
    session.userData.id = session.message.user.id;
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?");
    session.beginDialog("loginDialog");
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

bot.dialog('loginDialog', (session: any) => {
    let signinCard = new builder.SigninCard(session)
        .text('Time to connect our intelligent bot')
        .button('Connect to bunq', oauth.generateLoginUri(session.userData.id));

    let msg = new builder.Message(session).addAttachment(signinCard);

    session.send(msg);
    session.endDialog();
}).triggerAction({matches: 'Login'});

bot.dialog('sendDialog', [(session: any) => {
    session.beginDialog('askAmount');
}, (session: any, results: any) => {
    session.dialog(`Who do you want to send €${results.response}?`);
}]).triggerAction({matches: 'Send'});

bot.dialog('requestDialog', (session: any) => {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({matches: 'Request'});

bot.dialog('balanceDialog', async (session: any) => {
    const balance = await actions.getBalance(session.userData.id);
    session.endDialog(`Your balance is €${balance}`);
}).triggerAction({matches: 'Balance'});

bot.dialog('askAmount', [(session: any) => {
    session.send("So you want to send money. That's great I can help in that!");
    builder.Prompts.number(session, 'Which amount?')
}, (session: any, results: any) => {
    session.endDialogWithResult(results);
}]);

