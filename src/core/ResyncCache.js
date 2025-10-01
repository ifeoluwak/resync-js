import { STORAGE_CONFIG } from "../utils/constants.js";

const STORAGE_KEY = STORAGE_CONFIG.CACHE_KEY;

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
class ResyncCache {
  /** @type {StorageInterface|null} */
  storage;

  /** @type {ResyncCacheData} */
  cache = {
    configs: {},
    experiments: [],
    content: [],
    lastFetchTimestamp: null,
    sessionId: null,
    userId: null,
    userVariants: new Map(),
    userEvents: {},
  };

  /** @type {Map<string, Object>} */
  userVariants = new Map();

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
  async init(storage) {
    if (storage) {
      this.storage = storage;
      await this.loadFromStorage();
    }
  }

  /**
   * Gets the current cache instance.
   * @returns {ResyncCacheData} The current cache data
   * @example
   * const cache = ResyncCache.getCache();
   * console.log('Current cache:', cache);
   */
  getCache() {
    return this.cache;
  }

  async clearCache() {
    this.cache = {
      configs: {},
      experiments: [],
      content: [],
      lastFetchTimestamp: null,
      sessionId: null,
      userId: null,
      userVariants: new Map(),
    };
    if (this.storage) {
      await this.storage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Retrieves a value from cache by key.
   * @param {string} key - The cache key to retrieve
   * @returns {*} The cached value or null if not found
   * @example
   * const configs = ResyncCache.getKeyValue('configs');
   * const content = ResyncCache.getKeyValue('content');
   */
  getKeyValue(key) {
    return this.cache[key] || null;
  }

  /**
   * Saves the entire cache to storage.
   * @example
   * ResyncCache.saveToStorage();
   */
  saveToStorage() {
    if (this.storage) {
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.cache)
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
  saveKeyValue(key, value) {
    this.cache[key] = value;
    if (this.storage) {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.cache)).catch((error) => {
        console.error("Error saving cache to storage:", error);
      });
    }
  }

  /**
   * Loads cache data from storage.
   * @example
   * ResyncCache.loadFromStorage();
   */
  async loadFromStorage() {
    if (this.storage) {
      console.log("Loading cache from storage ------:", this.storage);
       try {
        const data = await this.storage.getItem(STORAGE_KEY);
        if (data) {
          console.log("Storage Data ------:", data);
          const parsedData = JSON.parse(data);
          // Restore the cache state from the parsed data
          this.cache = parsedData;
        }
       } catch (error) {
        console.error("Error loading cache from storage:", error);
       }
    } else {
      console.warn("No storage available to load cache.");
    }
  }
}

export default new ResyncCache();