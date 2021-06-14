const { request } = require("http");
/**
 * @returns {Promise<{content:string,statusCode:number,headers:import('http').IncomingHttpHeaders}>}
 * @param {import('http').RequestOptions} requestOptions - Directly passed to `http.request`.
 * @param {string} postData - Data to be sent with the request.
 */
const asyncHTTPTester = (requestOptions, postData) => new Promise((resolve, reject) => {
    const sentRequest = request(requestOptions, res => {
        const bufferList = [];
        res.on("data", chunk => bufferList.push(chunk));
        res.on("error", reject);
        res.on("end", () => {
            const content = bufferList.map(buffer => buffer.toString()).join("");
            return resolve({ content, statusCode: res.statusCode, headers: res.headers });
        });
    });
    if (typeof postData !== "undefined") sentRequest.write(postData, "utf8");
    sentRequest.end();
});
exports.asyncHTTPRequest = asyncHTTPTester;
