const oauth: any = require('./oauth');


class Actions {
    static async getBalance(req: any, res: any, next: any) {
        await oauth.requestUser();
        const balance = await oauth.getBalance();
        res.send(balance);
    }
}

module.exports = Actions;
