const config = require("./config");
exports.websocketHandlers = {
    add: require("./websocketHandlerPool").add,
    remove: require("./websocketHandlerPool").remove
};
exports.pathFilter = {
    add: require("./blacklistURLPool").add,
    remove: require("./blacklistURLPool").remove
};
exports.apiPageHandlers = {
    add: require("./apiHandlerPool").add,
    remove: require("./apiHandlerPool").remove
};

exports.staticServer = {
    get servePath() { return config.static.searchPath; },
    set servePath(newPath) { config.static.searchPath = newPath; },
    get enableServer() { return config.static.shouldServe; },
    set enableServer(bool) { config.static.shouldServe = bool; }
};

Object.defineProperty(exports, "port", {
    get: () => config.general.port,
    set: (val) => config.general.port = val
});
exports.startServer = require("./server").start;
