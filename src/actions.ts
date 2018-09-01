const oauth: any = require('./oauth');


class Actions {
    static async getBalance() {
        await oauth.requestUser();
        return await oauth.getBalance();
    }
}

module.exports = Actions;
