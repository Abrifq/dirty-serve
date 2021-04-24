const { add: addAPI, findFirstMatchingAPI, remove: removeAPI } = require("../apiHandlerPool"),
    { asyncHTTPRequest } = require("./common"), { lookup: lookupType } = require("mimetype");

const helloApiResponse = "Hello world!";
/**@type {import("../apiHandlerPool").APICallback} */
const helloAPI = (_req, res) => {
    res.writeHead(200, "OK", { "Content-Type": "text/plain; charset=utf8" });
    res.write(helloApiResponse);
    res.end();
    return;
};

const blankApiJsonResponse = "{}";
const blankApiHtmlResponse = "<!doctype html><html lang=\"en-us\"><head><title>Blank Page</title></head><body></body></html>";
const jsonMimeType = lookupType(".json");
const htmlMimeType = lookupType(".html");
const plainTextMimeType = lookupType(".txt");
/**@type {import("../apiHandlerPool").APICallback} */
const blankAPI = (req, res) => {
    const acceptType = "accept" in req.headers ?
        req.headers.accept.split(",")[0] :
        undefined;
    res.writeHead(200, "OK");
    switch (acceptType) {
        case htmlMimeType:
            res.setHeader("Content-Type", htmlMimeType);
            res.write(blankApiHtmlResponse);
            break;
        case jsonMimeType:
            res.setHeader("Content-Type", jsonMimeType);
            res.write(blankApiJsonResponse);
            break;
        default: //also "text/plain"
            res.setHeader("Content-Type", plainTextMimeType);
            res.write("");
            break;
    }
    res.end();
};

/**@type {import("../apiHandlerPool").APICallback} */
const echoAPI = (req, res) => {
    if (req.method !== "POST") {
        res.writeHead(405);
        res.end();
        throw "forceMethod didn't apply!";
    }
    res.writeHead(200);
    req.pipe(res, { end: true });
};


exports.test = async function (port) {


    //API name: hello
    //Use get on an API request that will always give 200, if doesn't get 200, throw error.

    {
        console.group();
        console.log("Testing Hello World API.");
        const apiPath = "/api/hello";
        const apiID = addAPI(apiPath, helloAPI);

        try {
            if (helloAPI !== (await findFirstMatchingAPI(apiPath)).handler)
                throw "Api couldn't be properly registered.";
            const response = await asyncHTTPRequest({ port, path: apiPath, method: "GET" });

            if (response.statusCode !== 200)
                throw "Expected status code 200 but got " + response.statusCode + " instead!";

            if (response.content !== helloApiResponse)
                throw "Expected text \"" + helloApiResponse + "\" but got \"" + response.content + "\" instead!";

        } finally {
            removeAPI(apiID);
        }
        console.groupEnd();
    }

    //API name: blank
    //Use Accept header to get a blank JSON response on correct header, and blank text on text responses.

    {
        console.group();
        console.log("Testing blank API.");
        const apiID = addAPI("/api/null", blankAPI);
        try {
            if (blankAPI !== (await findFirstMatchingAPI(apiPath)).handler)
                throw "Api couldn't be properly registered.";

            const jsonResponse = await asyncHTTPRequest({ port, path: "/api/null", method: "GET", headers: { accept: "application/json" } });
            if (jsonResponse.statusCode !== 200)
                throw "[json type] " + `Expected 200, got ${jsonResponse.statusCode} instead.`;
            if (jsonResponse.headers["content-type"] !== jsonMimeType)
                throw "[json type] " + `Expected Content-Type header to be "${jsonMimeType}" but it was "${jsonResponse.headers["content-type"]}" instead.`;
            if (jsonResponse.content !== blankApiJsonResponse)
                throw "[json type] " + `Expected to get \n\t"${blankApiJsonResponse}"\n but got \n\t"${jsonResponse.content}"\n instead.`;

            const textResponse = await asyncHTTPRequest({ port, path: "/api/null", method: "GET", headers: { accept: "text/plain" } });
            if (textResponse.statusCode !== 200)
                throw "[plain text] " + `Expected 200, got ${textResponse.statusCode} instead.`;
            if (textResponse.headers["content-type"] !== plainTextMimeType)
                throw "[plain text] " + `Expected Content-Type header to be "${plainTextMimeType}" but it was "${textResponse.headers["content-type"]}" instead.`;
            if (textResponse.content !== "")
                throw "[plain text] " + `Expected to get \n\t""\n but got \n\t"${textResponse.content}"\n instead.`;

            const htmlResponse = await asyncHTTPRequest({ port, path: "/api/null", method: "GET", headers: { accept: "text/html" } });
            if (htmlResponse.statusCode !== 200)
                throw "[html type] " + `Expected 200, got ${htmlResponse.statusCode} instead.`;
            if (htmlResponse.headers["content-type"] !== htmlMimeType)
                throw "[plain text] " + `Expected Content-Type header to be "${htmlMimeType}" but it was "${htmlResponse.headers["content-type"]}" instead.`;
            if (htmlResponse.content !== blankApiHtmlResponse)
                throw "[plain text] " + `Expected to get \n\t"${blankApiHtmlResponse}"\n but got \n\t"${htmlResponse.content}"\n instead.`;

        } finally {
            removeAPI(apiID);
        }
        console.groupEnd();
    }

    //API name: echo
    //Use get on an strict API that responds only to POST requests, if gets 200, throw error.
    //when gets data, responds with the same data.

    {
        console.group();
        const apiPath = "/api/mountain";
        const apiID = addAPI(apiPath, echoAPI, "POST");
        console.log("Testing echo api.");
        try {
            if (echoAPI !== (await findFirstMatchingAPI(apiPath)).handler)
                throw "Api couldn't be properly registered.";

            const echoText = "aaayo!";

            const invalidResponse = await asyncHTTPRequest({ port, path: apiPath, method: "GET" });
            if (invalidResponse.statusCode !== 405)
                throw "Invalid request passed through the filter(s)";

            const validResponse = await asyncHTTPRequest({ port, path: apiPath, method: "POST" }, echoText);
            if (validResponse.statusCode === 405)
                throw "Valid response got status code 405.";
            if (validResponse.content !== echoText)
                throw `Sent "${echoText}" to API, got "${validResponse.content}" instead.`;

        }
        finally { removeAPI(apiID); }
        console.groupEnd();
    }
    return;
};
