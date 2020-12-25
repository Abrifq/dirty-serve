//@ts-check
const { waitATick } = require("./commonUtils");
/**
 * @template ItemType 
 * @name Pool<ItemType> 
 */
class Pool {
    constructor() {
        /**@type {Map<symbol,ItemType>} */
        this.pool = new Map();
    }
    /**@param {ItemType} item */
    add(item) {
        const itemID = Symbol();
        this.pool.set(itemID, item);
        return itemID;
    }
    /**@param {symbol} itemID */
    remove(itemID) {
        this.pool.delete(itemID);
        return;
    }
    /**
     * @param {(item:ItemType)=>boolean} matcherFunction 
     * @returns {ItemType | void}
     */
    find(matcherFunction) {
        for (let item of this.pool.values()) {
            if (matcherFunction(item)) return item;
        }
    }
    /**
     * @param {(item:ItemType)=>(Promise<boolean>|boolean)} asyncMatcherFunction 
     * @returns {Promise<ItemType | void>}
     */
    async asyncFind(asyncMatcherFunction) {
        for (let item of this.pool.values()) {
            if (await asyncMatcherFunction(item)) return item;
            await waitATick();
        }
    }
}
exports = module.exports = Pool;
