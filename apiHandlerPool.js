const Matcher = require("./matcher"),
    APICallbackSymbol = Symbol(),
    validMethods = [...require("http").METHODS],
    Pool = require("./pool"),
    { waitATick } = require("./commonUtils");

/**@type {Pool<API>} */
const APIList = new Pool();

class API extends Matcher {
    /**
     *
     * @param {import("./matcher").MatcherTypes} matcher - The matcher to trigger on paths.
     * @param {APICallback} handlerFunction - The handler function to redirect the http request and response to.
     * @param {string | string[]} [forcedMethod]
     */
    constructor(matcher, handlerFunction, forcedMethod) {
        super(matcher);
        if (typeof handlerFunction !== "function") throw "Handler function must be included.";
        this[APICallbackSymbol] = handlerFunction;
        if (forcedMethod) {
            forcedMethod = forcedMethod.valueOf();
            const isString = typeof forcedMethod === "string", isArray = Array.isArray(forcedMethod);

            if (!(isString || isArray)) {
                throw "Invalid forcedMethod variable. Please either leave it blank or make it a string or an Array with strings.";
            }

            if (isArray) {
                forcedMethod = forcedMethod.map(string => string.toUpperCase())
                    .filter(method => validMethods.includes(method));
            }

            if (isString) {
                forcedMethod = forcedMethod.toUpperCase();
                forcedMethod = validMethods.includes(forcedMethod) ? forcedMethod : "";
            }

            if (forcedMethod.length === 0) {
                throw "The forcedMethod is empty or there is no valid METHODs to filter on. Please leave it blank if you don't want to filter.";
            }
            this.forcedMethod = Object.freeze(typeof forcedMethod === "string" ? [forcedMethod] : forcedMethod);
        }
    }
    get handler() { return this[APICallbackSymbol]; }
}


/**
 * @returns {symbol} - A new unique symbol as an ID for this new API.
 * @param {import("./matcher").MatcherTypes} matcher - The matcher to trigger on paths.
 * @param {APICallback} handlerFunction - The handler function to redirect the http request and response to.
 * @param {string | string[]} [forcedMethod]
 */
function addAPI(matcher, handlerFunction, forcedMethod) {
    const api = new API(matcher, handlerFunction, forcedMethod);
    return APIList.add(api);
}

/**
 * @param {symbol} apiSymbol - The id of the API to be removed.
 * @returns {void}
 */
function removeAPI(apiSymbol) {
    return APIList.remove(apiSymbol);
}

/**
 * @param {string} path 
 */
async function searchAPI(path) {
    return APIList.find(api => waitATick().then(() => api.testOn(path)));
}

exports = module.exports = {
    get add() { return addAPI; },
    get remove() { return removeAPI; },
    get shouldServe() { return APIList.size > 0; },
    get findFirstMatchingAPI() { return searchAPI; }
};

/**
 * @callback APICallback
 * @param {import('http').IncomingMessage} request - The incoming request.
 * @param {import('http').ServerResponse} response - The outgoing response.
 * @returns {Promise<void>|void}
 */
