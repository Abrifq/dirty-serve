const http = require('http'), { returnErrorPage } = require("./errorPageGenerator"),
    config = require("./config"), staticPageHandler = require("./staticFileHandler"),
    websocketServer = require("websocket").server, websocketPool = require("./websocketHandlerPool"),
    dynamicPageHandler = require("./apiHandlerPool"), urlBlacklist = require("./blacklistURLPool");

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
        shouldServeAPI = config.apiPages.shouldServe,
        shouldServeFile = config.static.shouldServe;
    if (await urlBlacklist.isForbidden(path)) return returnErrorPage(response, 403);
    if (shouldServeAPI) {
        const eligibleAPI = await dynamicPageHandler.findFirstMatchingAPI(path);
        if (eligibleAPI)
            if (
                !eligibleAPI.forcedMethod ||
                eligibleAPI.forcedMethod && eligibleAPI.forcedMethod.includes(method)
            )
                return eligibleAPI.handler(request, response, path);
    }
    else if (shouldServeFile)
        return staticPageHandler(request, response, path);
    else
        return returnErrorPage(response, 501);
}

const server = http.createServer(respond);
const wsServer = new websocketServer({
    httpServer: server,
    disableNagleAlgorithm: !config.websocket.useNagle
});

wsServer.on("request", async function processWebSocketRequest(request) {
    if (!config.websocket.shouldServe) return;
    const eligibleInterface = await websocketPool.findFirstEligibleHandler(request.resource);
    if (typeof eligibleInterface === "undefined") {
        request.reject(404, "Not Found");
        return;
    }
    eligibleInterface.registerConnection(request.accept());
});

exports.start = () => { server.listen(config.general.port, () => { config.general.hasServerStarted = true; }); };
