/**
 * Object representing the configuration for a Banana application.
 * @typedef {Object} Config
 * @property {string} id - The unique identifier for the configuration.
 * @property {boolean} isCurrent - Indicates whether this configuration is the current one.
 * @property {string} version - The version of the configuration.
 * @property {Object} config - The config values for the Banana application.
 */

/**
 * Object representing a function parameter in the Banana application.
 * @typedef {Object} FunctionParameter
 * @property {string} name - The name of the parameter
 * @property {string} type - The type of the parameter
 * @property {*} [defaultValue] - The default value of the parameter
 */

/**
 * Object representing a function in the Banana application.
 * @typedef {Object} Function
 * @property {number} id - The unique identifier for the function.
 * @property {string} name - The name of the function.
 * @property {string} comment - A brief description of what the function does.
 * @property {FunctionParameter[]} parameters - An array of parameter objects that the function accepts.
 * @property {string} code - The actual code of the function as a string.
 * @property {string} returnType - The type of value that the function returns.
 * @property {string[]} constants - Array of constants used in the function.
 * @property {boolean} public - Indicates whether the function is public or private.
 * @property {string} version - The version of the function.
 * @property {Function} [calls] - Object containing child function
 */

/**
 * Object representing the settings for functions in a Banana application.
 * @typedef {Object} FunctionSetting
 * @property {string} id - The name of the function setting.
 * @property {number} maxExecutionDurationMs - The maximum execution duration for the function setting in milliseconds.
 * @property {string[]} allowedExternalApiDomains - Array of allowed external API domains for the function setting.
 * @property {string[]} allowedExternalApiMethods - Array of allowed HTTP methods for external API calls in the function setting.
 * @property {number} maxFetchCount - The maximum number of fetch calls allowed in the function setting.
 * @property {string[]} bannedKeywords - An array of keywords that are not allowed in the function setting.
 * @property {string[]} bannedPatterns - An array of regex patterns that are not allowed in the function setting.
 * @property {boolean} allowFetch - Whether fetch calls are allowed
 */

/**
 * Object representing an experiment variant in A/B testing.
 * @typedef {Object} ExperimentVariant
 * @property {string} id - The unique identifier for the variant
 * @property {string} name - The name of the variant
 * @property {string} value - The value of the variant
 * @property {number} weight - The weight/percentage for this variant
 */

/**
 * Object representing an A/B test experiment.
 * @typedef {Object} Experiment
 * @property {string} id - The unique identifier for the experiment
 * @property {string} name - The name of the experiment
 * @property {string} type - The type of experiment (e.g., 'system', 'custom')
 * @property {ExperimentVariant[]} variants - Array of possible variants
 * @property {Function} [assignmentFunction] - Custom function for variant assignment
 * @property {string} [systemFunctionId] - ID of system function for variant assignment
 */

/**
 * Object representing an React Native Content Section.
 * @typedef {Object} CMS_Section
 * @property {string} id - The unique identifier for the content section
 * @property {string} name - The name of the section
 * @property {number} order - The order of the section
 * @property {Object} containerStyles - container styles
 * @property {*[]} elements - Array of possible elements
 */

/**
 * Object representing an React Native Content Section.
 * @typedef {Object} Content
 * @property {string} id - The unique identifier for the content
 * @property {string} name - The name of the content
 * @property {string} description - The description of the content
 * @property {string} version - The version of the content
 * @property {Object} metadata - The order of the content
 * @property {CMS_Section[]} sections - Array of sections
 */

/**
 * Cache object for storing Banana application configurations.
 * @typedef {Object} ResyncCacheData
 * @property {Object} configs - Application configuration object
 * @property {Function[]} functions - Array of available functions
 * @property {FunctionSetting} functionSettings - Function execution settings
 * @property {Experiment[]} experiments - Array of A/B test experiments
 * @property {string} [lastFetchTimestamp] - ISO timestamp of last fetch
 * @property {string} [sessionId] - Current session ID
 * @property {string} [userId] - Current user ID
 * @property {Map<string, Object>} [userVariants] - User variant assignments
 */

/**
 * Storage interface for cache persistence.
 * @typedef {Object} StorageInterface
 * @property {function(string): string|null} getItem - Get item from storage
 * @property {function(string, string): void} setItem - Set item in storage
 * @property {function(string): void} removeItem - Remove item from storage
 * @property {function(): void} clear - Clear all items from storage
 */

const STORAGE_KEY = "resyncbase_cache";

/**
 * ResyncCache class for managing application configuration caching.
 * Provides functionality for storing and retrieving configuration data,
 * functions, experiments, and user variants with optional persistence.
 * 
 * @class ResyncCache
 * @example
 * // Initialize with localStorage
 * ResyncCache.init(localStorage);
 * 
 * // Save a configuration value
 * ResyncCache.saveKeyValue('configs', { featureFlag: true });
 * 
 * // Retrieve a configuration value
 * const configs = ResyncCache.getKeyValue('configs');
 */
export default class ResyncCache {
  /** @type {StorageInterface|null} */
  static storage;

  /** @type {ResyncCacheData} */
  static cache = {};

  /** @type {Map<string, Object>} */
  static userVariants = new Map();

  /**
   * Initializes the ResyncCache with optional storage.
   * @param {StorageInterface} [storage] - Optional storage interface for persistence
   * @example
   * // Initialize with localStorage
   * ResyncCache.init(localStorage);
   * 
   * // Initialize with custom storage
   * ResyncCache.init({
   *   getItem: (key) => customStorage.get(key),
   *   setItem: (key, value) => customStorage.set(key, value),
   *   removeItem: (key) => customStorage.delete(key),
   *   clear: () => customStorage.clear()
   * });
   */
  static init(storage) {
    ResyncCache.cache = new ResyncCache();
    if (storage) {
      ResyncCache.storage = storage;
      ResyncCache.loadFromStorage();
    }
  }

  /**
   * Gets the current cache instance.
   * @returns {ResyncCacheData} The current cache data
   * @example
   * const cache = ResyncCache.getCache();
   * console.log('Current cache:', cache);
   */
  static getCache() {
    if (!ResyncCache.cache) {
      ResyncCache.cache = new ResyncCache();
    }
    return ResyncCache.cache;
  }

  /**
   * Retrieves a value from cache by key.
   * @param {string} key - The cache key to retrieve
   * @returns {*} The cached value or null if not found
   * @example
   * const configs = ResyncCache.getKeyValue('configs');
   * const functions = ResyncCache.getKeyValue('functions');
   */
  static getKeyValue(key) {
    if (ResyncCache.storage) {
      const cache = ResyncCache.getCache();
      return cache[key] || null;
    } else {
      console.warn("No storage available to get key-value pair.");
      return ResyncCache.cache[key] || null; // Fallback to in-memory cache
    }
  }

  /**
   * Saves the entire cache to storage.
   * @example
   * ResyncCache.saveToStorage();
   */
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

  /**
   * Saves a key-value pair to cache and optionally to storage.
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   * @example
   * ResyncCache.saveKeyValue('configs', { featureFlag: true });
   * ResyncCache.saveKeyValue('lastFetchTimestamp', new Date().toISOString());
   */
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

  /**
   * Loads cache data from storage.
   * @example
   * ResyncCache.loadFromStorage();
   */
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
    }
  }
}
