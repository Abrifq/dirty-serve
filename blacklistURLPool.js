const Matcher = require("./matcher"), Pool = require("./pool");
/**@type {Pool<Matcher>} */
const filterPool = new Pool();
const { waitATick } = require("./commonUtils");

/**@param {import("./matcher").MatcherTypes} matcher */
module.exports.add = matcher => filterPool.add(new Matcher(matcher));
/**@param {symbol} matcherID */
module.exports.remove = matcherID => filterPool.remove(matcherID);

/**@param {string} */
module.exports.isForbidden = path => filterPool.find(filter => waitATick().then(() => filter.testOn(path)))
    .then(function (filter) {
        return !!filter;
    });
