const config = require("./config");
exports.websocket = config.websocket;
exports.pathFilter = { add, remove } = require("./blacklistURLPool");
exports.apiPageHandlers = { add, remove } = require("./apiHandlerPool").interface;
exports.staticServer = { searchPath, shouldServe } = config.static;

Object.defineProperty(exports, "port", {
    get: () => config.general.port,
    set: (val) => config.general.port = val
});

exports.startServer = require("./server").start;
exports.stopServer = require("./server").stop;
