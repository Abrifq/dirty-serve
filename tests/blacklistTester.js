const blacklistPool = require("../blacklistURLPool");

exports.test = async function () {
    const ASCII_CODE_A = "a".charCodeAt(0);
    const triggerText = Array(10).fill(0).map(() => Math.floor(Math.random() * 26))
        .map(alphabetIndex => String.fromCharCode(alphabetIndex + ASCII_CODE_A)).join(""); //randomly generated 10 character long text.
    const filterID = blacklistPool.add(triggerText);
    if (!(await blacklistPool.isForbidden(triggerText))) throw "Newly added blacklist filter is not triggered.";
    blacklistPool.remove(filterID);
    if (await blacklistPool.isForbidden(triggerText)) throw "Deleted blacklist filter is triggered.";
    return;
};
