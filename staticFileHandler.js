const
    { returnErrorPage } = require("./errorPageGenerator"),
    StatusCodeMessages = require("http").STATUS_CODES,
    fileSystem = require("fs"),
    { pathToFileURL, URL, fileURLToPath } = require('url'),
    serverConfig = require("./config").general,
    mimeTypes = require("mimetype");

let isStaticPathSet = false,
    isStaticServerEnabled = true,
    staticFileSearchPath = pathToFileURL("./").pathname;

const config = {
    get shouldServe() { return isStaticPathSet && isStaticServerEnabled; },
    set shouldServe(newVal) { isStaticServerEnabled = !!newVal; },
    get searchPath() { return staticFileSearchPath; },
    set searchPath(path) {
        if (serverConfig.hasServerStarted) return;
        //Do not change directory after launching the server.
        const isString = typeof path === "string",
            isURL = typeof path === "object" && path instanceof URL;
        if (!(isString || isURL)) {
            throw "Path must be an string or an URL pointing to the desired folder.";
        }

        if (isString) {
            path = pathToFileURL(path[path.length - 1] === "/" ? path + "/" : path);
        } else {
            if (path.protocol !== "file:") throw "Only file URLs are supported.";
        }

        isStaticPathSet = true;
        staticFileSearchPath = fileURLToPath(path);
    }
};

/**
 * @class FileHandler
 * @param {string} filePath 
 */
function FileHandler(filePath) {
    const stats = fileSystem.statSync(filePath, { bigint: false, throwIfNoEntry: false }),
        mimetype = mimeTypes.lookup(filePath, "utf-8");
    this.getReadStream = () => fileSystem.createReadStream(filePath, { autoClose: true });
    this.exists = !!stats;
    this.mimetype = mimetype;

    if (stats) {
        this.mtime = stats.mtime.toUTCString();
        this.length = stats.size;
    }
}

/**
 * @param {import('http').IncomingMessage} request 
 * @param {import('http').ServerResponse} response 
 * @param {string} sanitizedURL
 */
async function respondStatically({ method = "", headers = {} }, response, sanitizedURL) {
    const
        isMethodGET = method === "GET",
        isMethodHEAD = method === "HEAD";

    if (!(isMethodHEAD || isMethodGET)) {
        response.writeHead(405, StatusCodeMessages[405]);
    }
    if (!isMethodGET) {
        response.setHeader("Allow", "GET, HEAD");
    }
    if (!(isMethodHEAD || isMethodGET)) {
        return response.end();
    }

    const fileHandler = new FileHandler(
        config.searchPath +
        sanitizedURL +
        (sanitizedURL.endsWith("/") ? "index.html" : "")
    );

    if (!fileHandler.exists) {
        response.writeHead(404, StatusCodeMessages[404]);
        returnErrorPage(response, 404);
        return;
    }

    if ("if-modified-since" in headers) {
        const requestModifyTime = Date.parse(headers["if-modified-since"]),
            fileModifyTime = Date.parse(fileHandler.mtime);
        if (requestModifyTime >= fileModifyTime) {
            response.writeHead(304, StatusCodeMessages[304]);
            response.end();
            return;
        }
    }
    response.writeHead(200, StatusCodeMessages[200], {
        "Content-Length": fileHandler.length,
        "Content-Type": fileHandler.mimetype,
        "Last-Modified": fileHandler.mtime,
        "Cache-Control": "public, must-revalidate, max-age=86400"
    });

    if (isMethodHEAD) {
        response.end();
        return;
    }

    fileHandler.getReadStream().pipe(response);

}

exports.interface = respondStatically;
exports.config = config;

/**
 * @typedef FileHandler
 * @prop {Date=} mtime
 * @prop {number=} length
 * @prop {boolean} exists
 * @prop {string} mimetype
 * @prop {()=>import('fs').ReadStream} createReadStream
 */
