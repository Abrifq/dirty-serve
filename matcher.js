
const matcherSymbol = Symbol(".matcher");

class Matcher {
    /**@param {MatcherTypes} matcher*/
    constructor(matcher) {
        matcher = matcher.valueOf(); //Converting objects to primitives, if possible.
        if (!(typeof matcher === "string" || matcher instanceof RegExp)) {
            throw "You need to use either a RegExp object or a string to create a matcher.";
        }
        this[matcherSymbol] = matcher;
    }
    /**
     * @param {string} string - The string to test the matcher on.
     * @returns {boolean} - Returns if matcher matches something on the given string.
     */
    testOn(string) {
        if (!(this instanceof Matcher)) {
            throw "Do not use Matcher functions on another object.";
        }
        const matcher = this[matcherSymbol];
        return typeof matcher === "string" ?
            string.indexOf(matcher) > -1 :
            matcher.test(string);
    }
}
exports = module.exports = Matcher;
/**@typedef {string|RegExp} MatcherTypes */
