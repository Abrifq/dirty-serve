const
    http = require('http'),
    { returnErrorPage } = require("./errorPageGenerator"),
    websocketServer = require("websocket").server,
    { interface: staticPageHandler } = require("./staticFileHandler"),
    { interface: websocketPool } = require("./websocketHandlerPool"),
    { interface: dynamicPageHandler } = require("./apiHandlerPool"),
    urlBlacklist = require("./blacklistURLPool"),
    {
        general: config,
        apiPages: apiConfig,
        websocket: websocketConfig,
        static: staticConfig
    } = require("./config");

const sanitizeURL = dirtyURL => //makes sure the path starts with `/` and doesn't go under
    new URL(dirtyURL, "ws://./").href.substr(6);//web directory with `/../` requests.
/**
 * @param {import('http').IncomingMessage} request
 * @param {import('http').ServerResponse} response
 * @returns {Promise<void>}
 */
async function respond(request, response) {
    if (request.headers.upgrade) {
        return;
        //It's (probably) a websocket connection,
        //and we should let the websocket library take care of it
    }

    const path = sanitizeURL(request.url),
        method = request.method,
        shouldServeAPI = apiConfig.shouldServe,
        shouldServeFile = staticConfig.shouldServe;
    if (await urlBlacklist.isForbidden(path)) return returnErrorPage(response, 403);
    if (shouldServeAPI) {
        const eligibleAPI = await dynamicPageHandler.findFirstMatchingAPI(path);
        if (eligibleAPI)
            if (
                !("forcedMethod" in eligibleAPI) ||
                "forcedMethod" in eligibleAPI &&
                eligibleAPI.forcedMethod.includes(method)
            )
                return eligibleAPI.handler(request, response, path);
            else
                return returnErrorPage(response, 405);
    }
    if (shouldServeFile)
        return staticPageHandler(request, response, path);
    //if we can't response with anything
    return returnErrorPage(response, 501);
}

const server = http.createServer(respond);
const wsServer = new websocketServer({
    httpServer: server,
    disableNagleAlgorithm: !websocketConfig.useNagle
});

wsServer.on("request", async function processWebSocketRequest(request) {
    if (!websocketConfig.shouldServe) return;
    const eligibleInterface = await websocketPool.findFirstEligibleHandler(request.resource);
    if (typeof eligibleInterface === "undefined") {
        request.reject(404, "Not Found");
        return;
    }
    eligibleInterface.registerConnection(request.accept());
});

module.exports.start = () => {
    return config.hasServerStarted ||
        server.listen(config.port, () => { config.hasServerStarted = true; server.ref(); });
};
module.exports.stop = () => {
    if (config.hasServerStarted) {
        wsServer.shutDown();
        server.close(() => { config.hasServerStarted = false; server.unref(); });
    }
};
