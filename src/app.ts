// NPM packages
const fs = require('fs');
const restify = require('restify');
const builder = require('botbuilder');

// API classes
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
    fs.writeFileSync(__dirname + '/../session-test' + '.json', JSON.stringify(session.message));
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

bot.dialog('sendDialog', [
    function (session) {
        session.send("So you wanna send money? We can help you with that!");
        builder.Prompts.number(session, "How much money do you want to send? (in €)");
    },
    function (session, results) {
        session.dialogData.amount = results.response;
        builder.Prompts.text(session, "What's the IBAN of the recipient?");
    },
    function (session, results) {
        session.dialogData.recipientIban = results.response;
        builder.Prompts.text(session, "What's his or her name?");
    },
    function (session, results) {
        session.dialogData.recipientName = results.response;
        builder.Prompts.text(session, "What's the description of your transaction?");
    },
    async function (session, results) {
        session.dialogData.description = results.response;
        session.dialogData.accountChoices = await actions.generateAccountChoices(session.userData.id);
        builder.Prompts.choice(session, "From which account do you want to send?", session.dialogData.accountChoices);
    },
    function (session, results) {
        session.dialogData.selectedAccount = {
            description: results.response.entity,
            id: session.dialogData.accountChoices[results.response.entity].id
        };

        // Process request and confirm with the user
        session.send(`Transaction details: <br/><br/>Amount: €${session.dialogData.amount} <br/>Recipient's IBAN: ${session.dialogData.recipientIban} <br/>Recipient's name: ${session.dialogData.recipientName} <br/>Description: ${session.dialogData.description} <br/><br/>Selected account: ${session.dialogData.selectedAccount.description}`);
        builder.Prompts.confirm(session, 'Is everything correct?');
    },
    async function (session, results) {
        if (results.response) {
            try {
                const result = await actions.sendPayment(
                    session.userData.id,
                    session.dialogData.selectedAccount.id,
                    String(session.dialogData.amount),
                    session.dialogData.recipientIban,
                    session.dialogData.recipientName,
                    session.dialogData.description
                );
                session.send('Transaction successful!');
            } catch (e) {
                const errorMessage = JSON.parse(e.error);
                session.send(`Transaction failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
            }
        } else {
            session.send('Transaction cancelled!');
        }

        session.endDialog();
    }
]).triggerAction({matches: 'Send'});

bot.dialog('requestDialog', (session: any) => {
    session.endDialog("So you want to get money. That's great I can help in that!");
}).triggerAction({matches: 'Request'});

bot.dialog('balanceDialog', async (session: any) => {
    const balance = await actions.getBalance(session.userData.id);
    session.endDialog(`Your balance is €${balance}`);
}).triggerAction({matches: 'Balance'});

bot.dialog('askAmount', [(session: any) => {
    builder.Prompts.number(session, 'Which amount?');
}, (session: any, results: any) => {
    session.endDialogWithResult(results);
}]);

bot.dialog('askRecipient', [(session: any) => {
    builder.Prompts.text(session, 'To which IBAN do you want to send it?');
}, (session: any, results: any) => {
    session.endDialogWithResult(results);
}]);
