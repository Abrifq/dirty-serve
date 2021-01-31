//@ts-check
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
    findSync(matcherFunction) {
        const allItems = this.pool.values();
        for (let item of allItems) {
            if (matcherFunction(item)) return item;
        }
    }

    /**
     * @param {(item:ItemType)=>Promise<boolean>} asyncMatcherFunction
     * @returns {Promise<void | ItemType>} - Resolves `void` if no item matches. 
     */
    async find(asyncMatcherFunction) {
        const allItems = this.pool.values();
        for (let item of allItems) {
            if (await asyncMatcherFunction(item))
                return item;
        }
    }

}
exports = module.exports = Pool;
