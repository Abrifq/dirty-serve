const { port, startServer, stopServer } = require("../server-interface");

async function runTests() {
    startServer();
    const tests = [
        require("./blacklistTester").test,
        require("./staticWebsiteTester").test,
        require("./apiWebsiteTester").test,
        require("./webSocketTester").test
    ];
    for (const test of tests) await test(port);
    stopServer();
    return;
}
runTests();
