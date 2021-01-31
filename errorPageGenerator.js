const httpErrorCodes = require("http").STATUS_CODES,
    templatePage = '<!DOCTYPE html><html lang="en-US"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>$ErrorCode$, $ErrorMessage$</title></head><body style="text-align:center;"><h1>$ErrorMessage$</h1><hr><p>This error may have occured due to a user or server issue.<br>Please try again later.</p></body></html>',
    errorCodeRegexp = /\$ErrorCode\$/g,
    errorMessageRegexp = /\$ErrorMessage\$/g;

/**
 * @param {number|string} errorCode - The numeric code for the error.
 * @param {string} errorMessage - The name of the error or a short message about the error.
 * @returns {string} - The html page created for the error.
 */
function errorPageGenerator(errorCode, errorMessage) {
    return templatePage
        .replace(errorCodeRegexp, errorCode)
        .replace(errorMessageRegexp, errorMessage);
}

/**
 * @param {import('http').ServerResponse} response - The Server's ServerResponse class to deliver the http page.
 * @param {number} errorNo - The error's status code.
 */
exports.returnErrorPage = function (response, errorNo) {
    const errorMessage = httpErrorCodes[errorNo];
    response.writeHead(errorNo, errorMessage, { "Content-Type": "text/html; charset=UTF-8" });
    response.write(errorPageGenerator(errorNo, errorMessage));
    response.end();
};
