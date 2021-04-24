//I don't know what to test, I will just make a basic echo tester.

const { client: websocketClient } = require("websocket"),
    { add: addRoute, findFirstEligibleHandler, remove: removeRoute } = require("../websocketHandlerPool"),
    { websocket: websocketConfig } = require("../config"),
    { waitATick } = require("../commonUtils");



/**@type {Set<import('websocket').connection>} */
const chatUsers = new Set();

/**
 * @type {import('../websocketHandlerPool').WebSocketConnectionRegisterCallback}
 * @desc A very basic chat api that sends every received message to every listener.
 */
const registerUser = function (connection) {
    chatUsers.add(
        connection.on("message", msg => chatUsers.forEach(user => user.send(msg)))
            .on("close", () => chatUsers.delete(connection))
            .on("error", () => chatUsers.delete(connection))
    );
};

/**
 * @constructor 
 * @param {string} websocketUrl
 */
const testableClient = function (websocketUrl) {

    /**@type {string[]} */
    const messageQueue = [];
    let hasFailed = false;
    /**@type {import('websocket').connection } */
    let connection;



    /**@returns {AsyncGenerator<string,never,void>} */
    const getNextMessageGenerator = async function* () {
        while (1) {
            while (!messageQueue.length) {
                if (hasFailed)
                    throw "Websocket connection is closed. Please check the logs.";
                await waitATick(); //wait a message to come but don't block event loop
            }

            yield messageQueue.shift();
        }
    };

    const getMessageGenerator = getNextMessageGenerator(messageQueue);
    this.getNextMessage = () => getMessageGenerator.next();

    /**
     * @param {string} msg 
     * @returns {Promise<void>} 
     * @throws {PromiseLike<string>} - If the message cannot be send, the connection will fail. Upon failing the connection, an error will be thrown and all of this class' methods will also throw an error.
     */
    this.sendMessage = msg => new Promise((resolve, reject) => {
        if (hasFailed) reject("Websocket connection is closed. Please check the logs.");
        connection.sendUTF(msg, err => {
            if (err) {
                hasFailed = true;
                connection.drop();
                console.error("Failed at sending the message.");
                console.error(err);
                reject("Websocket connection is closed. Please check the logs.");
            }
            resolve();
        });
    });

    new websocketClient().on("connect", conn => {
        connection = conn.on("message", msg => messageQueue.push(msg.utf8Data))
            .on("error", e => { hasFailed = true; console.error(e); })
            .on("close", (errCode, errMsg) => { hasFailed = true; console.log(`Websocket connection closed with code ${errCode}.\n"${errMsg}" `); });
    }).connect(websocketUrl);
};

/**@param {number} port */
exports.test = async function (port) {

    const apiURL = "/api/ws/chat";
    try {
        console.group();

        console.log("config.shouldServe should return false as there is no APIs registered yet.");
        if (websocketConfig.shouldServe)
            throw "There is either an API already registered or the getter is freaking out.";

        console.log("No API should be listening for this url");
        if (await findFirstEligibleHandler(apiURL).then(api => !!api))
            throw "API already registered on this path? But how?";

        console.log("Adding websocket API.");
        const apiID = addRoute(apiURL, registerUser);

        console.log("API should show up in finder.");
        if (await findFirstEligibleHandler(apiURL).then(api => !api))
            throw "Registered API does not show up in pool!";

        console.log("config.shouldServe should be true now");
        if (!websocketConfig.shouldServe)
            throw "The getter has freaked up and returned false";

        console.log("Starting to test the chat API.");
        const
            client1 = new testableClient("localhost:" + port + apiURL),
            client2 = new testableClient("localhost:" + port + apiURL);

        console.log("When an user sends a message, every user should receive it");
        const sentMsg = "Hello there!";
        await Promise.all([
            client1.getNextMessage(),
            client2.getNextMessage()
        ]).then(
            results => results.every(result => result.value === sentMsg)
        ).then(testStatus => {
            if (!testStatus)
                throw "Not every user received the same message!";
        });

        console.log("Removing chat API.");
        removeRoute(apiID);
        console.log("API should not show up in finder after it has been removed.");
        if (await findFirstEligibleHandler(apiURL).then(api => !!api))
            throw "Removed API still shows up in pool!";

        console.log("config.shouldServe should be false as we removed the only API in the pool");
        if (websocketConfig.shouldServe)
            throw "The getter has freaked up and returned true";

    } finally {
        console.groupEnd();
    }
};
