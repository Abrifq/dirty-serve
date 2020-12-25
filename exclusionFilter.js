const Matcher = require("./matcher"), Pool = require("./pool");
/**@type {Pool<Matcher>} */
const filterPool = new Pool();

/**@param {string | RegExp} matcher */
exports.add = matcher => filterPool.add(new Matcher(matcher));
/**@param {symbol} matcherID */
exports.remove = matcherID => filterPool.remove(matcherID);

exports.isForbidden = path => filterPool.asyncFind(filter => filter.testOn(path))
    .then(function (filter) {
        return !!filter;
    });
