// NPM packages
const restify = require('restify');
const builder = require('botbuilder');

// API classes
const oauth = require('./oauth');
const actions = require('./actions');


// Constants
const bunqLogoUri = 'https://together.bunq.com/public/attachments/4479669e0a509b26a4d22c98e2972c51.png';

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
                case 'transactions':
                    // @ts-ignore
                    intent = {score: 1.0, intent: 'Transactions'};
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
    session.send({
        attachments: [
            {
                contentType: 'image/png',
                contentUrl: bunqLogoUri,
                name: 'bunq Logo'
            }
        ]
    });
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?");
    session.send('These are the available commands: <br/><br/>- "balance" <br/> - "send" <br/> - "request" <br/> - "transactions" <br/> - "login"');
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
        builder.Prompts.text(session, "What's the recipient's name?");
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
        const msg = new builder.Message(session).addAttachment(
            actions.createReceiptCard(
                'Transaction',
                String(session.dialogData.amount),
                session.dialogData.recipientIban,
                session.dialogData.recipientName,
                session.dialogData.description,
                session
            )
        );
        session.send(msg);
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

bot.dialog('requestDialog', [
    async function (session, results) {
        session.send("So you wanna receive money? We can help you with that!");
        builder.Prompts.number(session, "How much money do you want to receive? (in €)");
    },
    async function (session, results) {
        session.dialogData.amount = results.response;
        const bunqMeLink = await actions.retrieveBunqMeLink(session.userData.id);

        session.send(`Please share this link with the other person: <br/><br/>${bunqMeLink + '/' + session.dialogData.amount + '/'}`);
    },
    async function (session, results) {
        session.dialogData.selectedAccount = {
            description: results.response.entity,
            id: session.dialogData.accountChoices[results.response.entity].id
        };

        try {
            const result = await actions.pastTransactions(
                session.userData.id,
                session.dialogData.selectedAccount.id
            );

            const transactions = {};
            for (let transaction of result['Response']) {
                transactions[transaction['Payment'].id] = {
                    amount: `€${transaction['Payment']['amount']['value']}`,
                };
            }

            session.send(`Your recent transactions: <br/><br/>${JSON.stringify(transactions)}`);
        } catch (e) {
            const errorMessage = JSON.parse(e.error);
            session.send(`Request failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
        }

        session.endDialog();
    }
]).triggerAction({matches: 'Request'});

bot.dialog('transactionsDialog', [
    async function (session, results) {
        session.send("So you wanna see your latest transactions? We can help you with that!");
        session.dialogData.accountChoices = await actions.generateAccountChoices(session.userData.id);
        builder.Prompts.choice(session, "From which account do you want to send?", session.dialogData.accountChoices);
    },
    async function (session, results) {
        session.dialogData.selectedAccount = {
            description: results.response.entity,
            id: session.dialogData.accountChoices[results.response.entity].id
        };

        try {
            const result = await actions.pastTransactions(
                session.userData.id,
                session.dialogData.selectedAccount.id
            );

            const transactions = {};
            for (let transaction of result['Response']) {
                transactions[transaction['Payment'].id] = {
                    amount: `€${transaction['Payment']['amount']['value']}`,
                };
            }

            session.send(`Your recent transactions: <br/><br/>${JSON.stringify(transactions)}`);
        } catch (e) {
            const errorMessage = JSON.parse(e.error);
            session.send(`Request failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
        }

        session.endDialog();
    }
]).triggerAction({matches: 'Transactions'});

bot.dialog('balanceDialog', async (session: any) => {
    const balance = await actions.getBalance(session.userData.id);
    session.endDialog(`Your balance is €${balance}`);
}).triggerAction({matches: 'Balance'});
