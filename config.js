module.exports.general = {
    hasServerStarted: false,
    port: require("process").env["PORT"] || 3000
};

module.exports.static = require("./staticFileHandler").config;
module.exports.websocket = require("./websocketHandlerPool").config;
module.exports.apiPages = require("./apiHandlerPool").config;
