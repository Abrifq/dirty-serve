/**@returns {Promise<void>} - A promise that will resolve in the next tick. */
exports.waitATick = () => new Promise(resolve => require("process").nextTick(resolve, undefined));