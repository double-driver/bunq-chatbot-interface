"use strict";
const restify = require('restify');
const builder = require('botbuilder');
const oauth = require('./oauth');
const actions = require('./actions');
const bunqLogoUri = 'https://together.bunq.com/public/attachments/4479669e0a509b26a4d22c98e2972c51.png';
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
const bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
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
                case 'transactions':
                    intent = { score: 1.0, intent: 'Transactions' };
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
        .button('Connect to bunq', oauth.generateLoginUri(session.userData.id));
    let msg = new builder.Message(session).addAttachment(signinCard);
    session.send(msg);
    session.endDialog();
}).triggerAction({ matches: 'Login' });
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
        const msg = new builder.Message(session).addAttachment(actions.createReceiptCard('Transaction', String(session.dialogData.amount), session.dialogData.recipientIban, session.dialogData.recipientName, session.dialogData.description, session));
        session.send(msg);
        builder.Prompts.confirm(session, 'Is everything correct?');
    },
    async function (session, results) {
        if (results.response) {
            try {
                const result = await actions.sendPayment(session.userData.id, session.dialogData.selectedAccount.id, String(session.dialogData.amount), session.dialogData.recipientIban, session.dialogData.recipientName, session.dialogData.description);
                session.send('Transaction successful!');
            }
            catch (e) {
                const errorMessage = JSON.parse(e.error);
                session.send(`Transaction failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
            }
        }
        else {
            session.send('Transaction cancelled!');
        }
        session.endDialog();
    }
]).triggerAction({ matches: 'Send' });
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
            const result = await actions.pastTransactions(session.userData.id, session.dialogData.selectedAccount.id);
            const transactions = {};
            for (let transaction of result['Response']) {
                transactions[transaction['Payment'].id] = {
                    amount: `€${transaction['Payment']['amount']['value']}`,
                };
            }
            session.send(`Your recent transactions: <br/><br/>${JSON.stringify(transactions)}`);
        }
        catch (e) {
            const errorMessage = JSON.parse(e.error);
            session.send(`Request failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
        }
        session.endDialog();
    }
]).triggerAction({ matches: 'Request' });
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
            const result = await actions.pastTransactions(session.userData.id, session.dialogData.selectedAccount.id);
            const transactions = {};
            for (let transaction of result['Response']) {
                transactions[transaction['Payment'].id] = {
                    amount: `€${transaction['Payment']['amount']['value']}`,
                };
            }
            session.send(`Your recent transactions: <br/><br/>${JSON.stringify(transactions)}`);
        }
        catch (e) {
            const errorMessage = JSON.parse(e.error);
            session.send(`Request failed! <br/><br/>${errorMessage['Error'][0]['error_description_translated']}`);
        }
        session.endDialog();
    }
]).triggerAction({ matches: 'Transactions' });
bot.dialog('balanceDialog', async (session) => {
    const balance = await actions.getBalance(session.userData.id);
    session.endDialog(`Your balance is €${balance}`);
}).triggerAction({ matches: 'Balance' });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUd0QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBSXJDLE1BQU0sV0FBVyxHQUFHLG1GQUFtRixDQUFDO0FBR3hHLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0QyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUMxQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRSxHQUFHLEVBQUU7SUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQztBQUdILE1BQU0sU0FBUyxHQUFHLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUN4QyxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjO0lBQ2pDLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQjtDQUNoRCxDQUFDLENBQUM7QUFHSCxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FB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