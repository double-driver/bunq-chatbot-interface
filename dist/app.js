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
                contentUrl: bunqLogoUri
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