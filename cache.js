/**
 * Object representing the configuration for a Banana application.
 * @typedef Config
 * @type {object}
 * @property {string} id - The unique identifier for the configuration.
 * @property {boolean} isCurrent - Indicates whether this configuration is the current one.
 * @property {string} version - The version of the configuration.
 * @property {Object} config - The config values for the Banana application.
 */

/**
 * Object representing a function in the Banana application.
 * @typedef Function
 * @type {object}
 * @property {number} id - The unique identifier for the function.
 * @property {string} name - The name of the function.
 * @property {string} comment - A brief description of what the function does.
 * @property {string[]} parameters - An array of parameter names that the function accepts.
 * @property {string} code - The actual code of the function as a string.
 * @property {string} returnType - The type of value that the function returns.
 * @property {string[]} constants - Array of constants used in the function.
 * @property {boolean} public - Indicates whether the function is public or private.
 * @property {string} version - The version of the function.
 * @property {Function} calls - Object containing child function
 */

/**
 * Object representing the settings for functions in a Banana application.
 * @typedef FunctionSetting
 * @type {object}
 * @property {string} id - The name of the function setting.
 * @property {number} maxExecutionDurationMs - The maximum execution duration for the function setting in milliseconds.
 * @property {string} allowedExternalApiDomains - A comma-separated list of allowed external API domains for the function setting.
 * @property {string} allowedExternalApiMethods - A comma-separated list of allowed HTTP methods for external API calls in the function setting.
 * @property {string} maxFetchCount - The maximum number of fetch calls allowed in the function setting.
 * @property {string} bannedKeywords - An array of keywords that are not allowed in the function setting.
 */

/**
 * Cache object for storing Banana application configurations.
 * @typedef ResyncCache
 * @type {object}
 * @property {Map<string, Config>} configs - A map of configuration IDs to their respective configurations.
 * @property {Map<string, Function>} functions - A map of function names to their respective function objects.
 * @property {Map<string, FunctionSetting>} functionSettings - A map of function setting IDs to their respective function settings.
 */


const STORAGE_KEY = "resyncConfigCache";


/**
 * @type {ResyncCache}
 */
export default class ResyncCache {
//   constructor(storage) {
//     ResyncCache.storage = storage;
//     /**
//      * @type {Config}
//      */
//     this.configs = {};
//     /**
//      * @type {Function[]}
//      */
//     this.functions = [];
//     /**
//      * @type {FunctionSetting[]}
//      */
//     this.functionSettings = {};
//     /**
//      * @type {null | Date}
//      */
//     this.lastFetchTimestamp = null;
//   }

  static storage;
  static cache = {};

  static userVariants = new Map();

  static init(storage) {
    ResyncCache.cache = new ResyncCache();
    if (storage) {
      ResyncCache.storage = storage;
      ResyncCache.loadFromStorage();
    }
  }

  static getCache() {
    if (!ResyncCache.cache) {
      ResyncCache.cache = new ResyncCache();
    }
    return ResyncCache.cache;
  }

  static getKeyValue(key) {
    if (ResyncCache.storage) {
      const cache = ResyncCache.getCache();
      return cache[key] || null;
    } else {
      console.warn("No storage available to get key-value pair.");
      return ResyncCache.cache[key] || null; // Fallback to in-memory cache
    }
  }

  static saveToStorage() {
    if (ResyncCache.storage) {
      ResyncCache.storage.setItem(
        STORAGE_KEY,
        JSON.stringify(ResyncCache.getCache())
      );
    } else {
      console.warn("No storage available to save cache.");
    }
  }

  static saveKeyValue(key, value) {
    if (ResyncCache.storage) {
      const cache = ResyncCache.getCache();
      cache[key] = value;
      ResyncCache.storage.setItem(STORAGE_KEY, JSON.stringify(cache));
      ResyncCache.cache = cache; // Update the static cache
    } else {
      // console.log("Saving to in-memory cache instead:", ResyncCache.cache);
      if (!ResyncCache.cache) {
        ResyncCache.cache = new ResyncCache();
      }
      ResyncCache.cache[key] = value; // Update the in-memory cache
    }
  }

  static loadFromStorage() {
    if (ResyncCache.storage) {
      const data = ResyncCache.storage.getItem(STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        // Restore the cache state from the parsed data
        ResyncCache.cache = Object.assign(
          ResyncCache.getCache(),
          parsedData
        );
      }
    } else {
      console.warn("No storage available to load cache.");
      // ResyncCache.cache = new ResyncCache(); // Initialize a new cache if no storage is available
    }
    // console.warn("No storage available to load cache.", ResyncCache);
  }
}
