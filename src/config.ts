const configFile = require('../config.json');

class Config {
    static retrieveConfigVariable(key: any) {
        return configFile[key];
    }
}

module.exports = Config;
