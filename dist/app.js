"use strict";
const fs = require('fs');
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
    fs.writeFileSync(__dirname + '/../session-test' + '.json', JSON.stringify(session.message));
    session.userData.firstRun = true;
    session.userData.id = session.message.user.id;
    session.send("Hi there! I am DoubleDriver your very own Bunq bot. You can send money, request money, or check your balance. Sounds great?");
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
        session.send(`Transaction details: <br/><br/>Amount: €${session.dialogData.amount} <br/>Recipient's IBAN: ${session.dialogData.recipientIban} <br/>Recipient's name: ${session.dialogData.recipientName} <br/>Description: ${session.dialogData.description} <br/><br/>Selected account: ${session.dialogData.selectedAccount.description}`);
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
bot.dialog('transactionsDialog', [
    async function (session, results) {
        session.send("So you wanna send money? We can help you with that!");
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
bot.dialog('askAmount', [(session) => {
        builder.Prompts.number(session, 'Which amount?');
    }, (session, results) => {
        session.endDialogWithResult(results);
    }]);
bot.dialog('askRecipient', [(session) => {
        builder.Prompts.text(session, 'To which IBAN do you want to send it?');
    }, (session, results) => {
        session.endDialogWithResult(results);
    }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFHdEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUlyQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDMUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0QsQ0FBQyxDQUFDLENBQUM7QUFHSCxNQUFNLFNBQVMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDeEMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztJQUNqQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7Q0FDaEQsQ0FBQyxDQUFDO0FBR0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUMvRCxNQUFNLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLEtBQUss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