const { readFile } = require("fs").promises;
const { asyncHTTPRequest } = require("./common");

exports.test = async function (port) {
    const fileContents = await readFile("./tests/www/index.html", { encoding: "utf8" });
    const serverResponse = (await asyncHTTPRequest({ path: "/", port })).content;
    if (fileContents !== serverResponse) throw "Content from server and file didn't match.";
};
