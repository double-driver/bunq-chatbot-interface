"use strict";
// NPM packages
var restify = require('restify');
var builder = require('botbuilder');
// API classes
var oauth = require('./src/oauth');
// Setup Restify Server
var server = restify.createServer();
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
// Listen for messages from users
server.get('/api/oauth/login', oauth.generateLoginUri);
server.get('/api/oauth/redirect', oauth.retrieveToken);
server.post('/api/messages', connector.listen());
var inMemoryStorage = new builder.MemoryBotStorage();
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
}).set('storage', inMemoryStorage);
// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
    recognize: function (context, done) {
        var intent = { score: 0.0 };
        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'send':
                    // @ts-ignore
                    intent = { score: 1.0, intent: 'Send' };
                    break;
                case 'request':
                    // @ts-ignore
                    intent = { score: 1.0, intent: 'Request' };
                    break;
                case 'balance':
                    // @ts-ignore
                    intent = { score: 1.0, intent: 'Balance' };
                    break;
            }
        }
        done(null, intent);
    }
});
// Add first run dialog
bot.dialog('firstRun', function (session) {
    session.userData.firstRun = true;
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?").endDialog();
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        }
        else {
            callback(null, 0.0);
        }
    }
});
bot.dialog('sendDialog', function (session) {
    session.endDialog("So you want to send money. That's great I can help in that!");
}).triggerAction({ matches: 'Send' });
bot.dialog('requestDialog', function (session) {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({ matches: 'Request' });
bot.dialog('balanceDialog', function (session) {
    session.endDialog("Your balance is...");
}).triggerAction({ matches: 'Balance' });
