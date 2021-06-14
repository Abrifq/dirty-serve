const { readFile } = require("fs").promises;
const { asyncHTTPRequest } = require("./common");

exports.test = async function (port) {
    console.log("Testing static file server.");
    console.group();
    const fileContents = await readFile("./tests/www/index.html", { encoding: "utf8" });
    const serverResponse = (await asyncHTTPRequest({ path: "/", port })).content;
    if (fileContents !== serverResponse) throw "Content from server and file didn't match." + "\n---\nFile contents:\n" + fileContents + "\nServer Response:\n" + serverResponse + "\n---";
    console.groupEnd();
};
