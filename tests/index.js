const { port, startServer, stopServer, staticServer: staticConfig } = require("../server-interface");

async function runTests() {
    staticConfig.searchPath = "./tests/www";
    startServer();
    const tests = [
        require("./blacklistTester").test,
        require("./staticWebsiteTester").test,
        require("./apiWebsiteTester").test,
        require("./webSocketTester").test
    ];
    for (const test of tests) await test(port);
    console.log("all tests done!");
    stopServer();
    console.log("stopped server");
    return;
}
runTests();
