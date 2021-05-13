exports.static = require("./staticFileHandler").config;
exports.websocket = require("./websocketHandlerPool").config;
exports.apiPages = require("./apiHandlerPool").config;
exports.general = require("./server").config;
