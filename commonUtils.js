/**
 * @returns {Promise<void>}
 * This utility function is aimed for taking a breath in async functions, especially the ones with loops.
 */
module.exports.waitATick = () => new Promise(resolve => setTimeout(resolve, 0));
