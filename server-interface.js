const config = require("./config");
module.exports.websocket = config.websocket;
module.exports.pathFilter = { add, remove } = require("./blacklistURLPool");
module.exports.apiPageHandlers = { add, remove } = require("./apiHandlerPool").interface;
module.exports.staticServer = { searchPath, shouldServe } = config.static;

Object.defineProperty(module.exports, "port", {
    get: () => config.general.port,
    set: (val) => config.general.port = val
});

module.exports.startServer = require("./server").start;
module.exports.stopServer = require("./server").stop;
