exports.general = {
    hasServerStarted: false,
    port: require("process").env["PORT"] || 3000
};

exports.static = require("./staticFileHandler").config;
exports.websocket = require("./websocketHandlerPool").config;
exports.apiPages = require("./apiHandlerPool").config;
