const { pathToFileURL, URL } = require('url');

let isStaticPathSet = false, isStaticServerEnabled = true;
let staticFileSearchPath = pathToFileURL("./").pathname;


const config = {
    static: {
        get shouldServe() { return isStaticPathSet && isStaticServerEnabled; },
        set shouldServe(newVal) { isStaticServerEnabled = !!newVal; },
        get searchPath() { return staticFileSearchPath; },
        set searchPath(path) {
            if (config.general.hasServerStarted) return;
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
            staticFileSearchPath = path.pathname;
        }
    },
    websocket: {
        shouldServe: false, //Placeholder. Defined in "./websocketHandlerPool"
        useNagle: false //Placeholder. Defined in "./websocketHandlerPool"
    },
    apiPages: {
        shouldServe: false //Placeholder. Defined in "./apiHandlerPool"
    },
    general: {
        //jshint -W069 
        port: require("process").env["PORT"] || 3000,
        //jshint +W069
        hasServerStarted: false //Placeholder. Defined in "./server"
    }
};

exports = module.exports = Object.freeze(config);
