//refactor this module to be like ./apiHandlerPool and export the pool itself, move config to ./config.
/**@type {import('./pool')<WebsocketAPIInterface>}*/
const websocketHandlersPool = new (require("./pool"))();
const { waitATick } = require('./commonUtils');
const Matcher = require("./matcher");
const { websocket: config } = require("./config");

class WebsocketAPIInterface extends Matcher {
    /**
     * @param {string|RegExp} matcher
     * @param {WebSocketConnectionRegisterCallback} registerCallback
     */
    constructor(matcher, registerCallback) {
        super(matcher);
        if (typeof registerCallback !== "function" || registerCallback.length === 0) {
            throw "Connection registering callback must be a function with at least one valid parameter.";
        }
        this.registerConnection = registerCallback;
    }
}

/**
 * @param {import('./matcher').MatcherTypes} matcher
 * @param {WebSocketConnectionRegisterCallback} registerCallback
 */
const addHandler = (matcher, registerCallback) => {
    const newWSApiInterface = new WebsocketAPIInterface(matcher, registerCallback);
    return websocketHandlersPool.add(newWSApiInterface);
};

/**@param {Symbol} symbol */
const removeHandler = symbol => {
    websocketHandlersPool.remove(symbol);
};

let useNagleAlgorithm = false;
Object.defineProperties(config, {
    shouldServe: {
        configurable: false,
        enumerable: true,
        get: () => websocketHandlersPool.pool.size > 0
    },
    useNagle: {
        configurable: false,
        enumerable: true,
        get: () => useNagleAlgorithm,
        set: value => { useNagleAlgorithm = !!value; }
    }
});


exports.findFirstEligibleHandler = path => websocketHandlersPool.find(ws => waitATick().then(() => ws.testOn(path)));
exports.add = addHandler;
exports.remove = removeHandler;

/**
 * @callback WebSocketConnectionRegisterCallback
 * @param {import('websocket').connection} wsConnection - The accepted WebSocket connection. Consumer of this api MUST set their own `close` and `message` event handlers.
 * @returns {void}
 */
/**
 * @typedef {Matcher} WebsocketAPIInterface
 * @prop {WebSocketConnectionRegisterCallback} registerConnection - This function will be used when the request is accepted. One may use this to add a connection to their Set.
 */
