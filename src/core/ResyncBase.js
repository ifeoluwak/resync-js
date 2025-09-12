import { AbTest } from "../services/AbTest.js";
import ResyncCache from "./ResyncCache.js";
import { ConfigFetch } from "../services/ConfigFetch.js";
import { ContentLogger } from "../services/ContentLogger.js";
import { configService } from "./ConfigService.js";
import { API_CONFIG, ERROR_MESSAGES, STORAGE_CONFIG } from "../utils/constants.js";

/**
 * @typedef {Object} InitOptions
 * @property {string} key - The API key for Banana API
 * @property {number} appId - The application ID
 * @property {number} [ttl=3600000] - Time-to-live for cache in milliseconds
 * @property {Function} [callback] - Optional callback function when config is loaded
 * @property {Storage} [storage] - Optional storage object for caching
 */

/**
 * @typedef {Object} Storage
 * @property {function(string): string|null} getItem - Get item from storage
 * @property {function(string, string): void} setItem - Set item in storage
 * @property {function(string): void} removeItem - Remove item from storage
 * @property {function(): void} clear - Clear all items from storage
 */

/**
 * @typedef {Object} AppConfig
 * @property {Object} appConfig - Application configuration
 * @property {Array} experiments - A/B test experiments
 * @property {Array} [content] - Content views
 */

/**
 * @typedef {Object} UserVariant
 * @property {string} experimentId - The experiment ID
 * @property {Object} variant - The assigned variant
 * @property {string} sessionId - The session ID
 * @property {string} userId - The user ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} client - The client identifier
 * @property {Object} metadata - Additional metadata
 */

/**
 * Main ResyncBase class for configuration management and A/B testing.
 * Provides functionality for fetching app configurations, executing functions,
 * and managing A/B test experiments.
 * 
 * @class ResyncBase
 * @example
 * // Initialize ResyncBase
 * ResyncBase.init({
 *   key: 'your-api-key',
 *   appId: 'your-app-id',
 *   callback: (config) => console.log('Config loaded:', config)
 * });
 * 
 * // Get configuration value
 * const value = ResyncBase.getConfig('feature-flag');
 * 
 * // Get A/B test variant
 * const variant = await ResyncBase.getVariant('experiment-name', payload);
 */
class ResyncBase {
  /**
   * Creates a new ResyncBase instance.
   * @constructor
   * @throws {Error} If initialization fails
   */
  constructor() {
    /**
     * @type {ConfigFetch}
     * @private
     */
    ResyncBase.#fetcher = new ConfigFetch();
    this.#loadAppConfig()
      .then((data) => {
        ResyncBase.ready = true;
      })
      .catch((error) => {
        console.error("Error initializing ResyncBase:", error);
      });
    /**
     * @type {Set<Function>}
     */
    this.subscribers = new Set();
  }

  /** @type {ConfigFetch|null} */
  static #fetcher = null;

  /** @type {string|null} */
  static #apiKey = null;

  /** @type {string} */
  static #apiUrl = API_CONFIG.DEFAULT_URL;

  /** @type {number} */
  static #ttl = 60 * 60 * 1000; // 60 minutes in milliseconds

  /** @type {ResyncBase|null} */
  static instance = null;

  /** @type {AbTest|null} */
  static abTest = null;

  /** @type {ContentLogger|null} */
  static contentLogger = null;

  /** @type {boolean} */
  static ready = false;

  /** @type {string|null} */
  static #appId = null;

  /** @type {string|null} */
  static userId = null;

  /** @type {string|null} */
  static sessionId = null;

  /** @type {string|null} */
  static client = null;

  /** @type {string|null} */
  static attributes = null;

  /** @type {Map<string, UserVariant>} */
  static userVariants = new Map();

  /**
   * Initializes the ResyncBase class.
   * Api key is required to use the Banana API.
   * @param {InitOptions} options - Initialization options
   * @throws {Error} - Throws an error if the API key is not provided.
   * @throws {Error} - Throws an error if the callback is not a function.
   * @throws {Error} - Throws an error if the storage is not a valid Storage object.
   * @description This method initializes the ResyncBase class with the provided API key and optional parameters.
   * It sets the API key, time-to-live for the cache, and subscribes to updates if a callback is provided.
   * It also creates an instance of ResyncBase if it does not already exist.
   * @returns {ResyncBase} - Returns the instance of ResyncBase.
   * @example
   * ResyncBase.init({
   *   key: 'your-api-key',
   *   appId: 'your-app-id',
   *   ttl: 1800000, // 30 minutes
   *   callback: (config) => console.log('Config loaded'),
   *   storage: localStorage
   * });
   */
  static init({ key, appId, ttl = 60 * 60 * 1000, callback, storage }) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    if (!appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_REQUIRED);
    }
    
    // Update configuration service
    configService.setApiKey(key);
    configService.setAppId(appId);
    configService.setTtl(ttl);
    
    ResyncBase.#apiKey = key;
    ResyncBase.#appId = `${appId}`;
    ResyncBase.#ttl = ttl;
    
    // storage must have a getItem, setItem, removeItem and clear methods
    if (
      storage &&
      STORAGE_CONFIG.REQUIRED_METHODS.every(
        (method) => typeof storage[method] === "function"
      )
    ) {
      ResyncCache.init(storage);
      console.log("ResyncBase using custom storage", storage);
    } else {
      ResyncCache.init();
    }
    if (!ResyncBase.instance) {
      ResyncBase.instance = new ResyncBase();
    }
    if (callback && typeof callback === "function") {
      ResyncBase.instance.subscribe(callback);
    }
    return ResyncBase.instance;
  }

  /**
   * Gets the current API key.
   * @returns {string|null} The API key or null if not set
   */
  static getApiKey() {
    return ResyncBase.#apiKey;
  }

  /**
   * Gets the current App ID.
   * @returns {string|null} The App ID or null if not set
   */
  static getAppId() {
    return ResyncBase.#appId;
  }

  /**
   * Gets the current API URL.
   * @returns {string} The API URL
   */
  static getApiUrl() {
    return ResyncBase.#apiUrl;
  }

  /**
   * Sets the user ID for tracking and variant assignment.
   * @param {string|number} userId - The user ID to set
   * @example
   * ResyncBase.setUserId('user123');
   * ResyncBase.setUserId(12345);
   */
  static setUserId(userId) {
    ResyncBase.userId = `${userId}`;
    if (ResyncCache.cache) {
      ResyncCache.saveKeyValue("userId", `${userId}`);
    }
    // // ResyncBase.instance.getUserVariants();
  }

  /**
   * Sets the client identifier for tracking.
   * @param {string} client - The client identifier
   * @throws {Error} If client is not a string
   * @example
   * ResyncBase.setClient('web-app');
   */
  static setClient(client) {
    if (typeof client !== "string") {
      throw new Error(ERROR_MESSAGES.CLIENT_MUST_BE_STRING);
    }
    ResyncBase.client = client;
  }

  /**
   * Sets user attributes for tracking and targeting.
   * @param {Object} attributes - User attributes object
   * @throws {Error} If attributes is not an object
   * @example
   * ResyncBase.setAttributes({
   *   country: 'US',
   *   plan: 'premium',
   *   age: 25
   * });
   */
  static setAttributes(attributes) {
    if (typeof attributes !== "object") {
      throw new Error(ERROR_MESSAGES.ATTRIBUTES_MUST_BE_OBJECT);
    }
    ResyncBase.attributes = JSON.stringify(attributes);
  }

  /**
   * Gets a variant for an A/B test experiment.
   * @param {string} experimentId - The experiment ID
   * @param {*} payload - Additional payload for variant assignment
   * @returns {Promise<string|null>} The variant value or null if not found
   * @throws {Error} If AbTest is not initialized
   * @example
   * const variant = await ResyncBase.getVariant('pricing-experiment', { userId: '123' });
   */
  static async getVariant(experimentId, payload) {
    if (!ResyncBase.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!ResyncBase.abTest) {
      throw new Error(ERROR_MESSAGES.ABTEST_NOT_INITIALIZED);
    }
    return await ResyncBase.abTest.getVariant(experimentId, payload);
  }

  /**
   * Gets a configuration value by key.
   * @param {string} key - The configuration key
   * @returns {*} The configuration value
   * @throws {Error} If App ID is not set or configuration not found
   * @example
   * const featureFlag = ResyncBase.getConfig('new-feature');
   */
  static getConfig(key) {
    if (!ResyncBase.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    const config = ResyncCache.getKeyValue("configs");
    if (config && key in config) {
      return config[key];
    }
    throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND(key));
  }

  static getContent() {
    if (!ResyncBase.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    const content = ResyncCache.getKeyValue("content");
    if (content) {
      return content;
    }
    throw new Error(ERROR_MESSAGES.NO_CONTENT_AVAILABLE);
  }

  static logContentEvent(event) {
    if (!ResyncBase.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!ResyncBase.contentLogger) {
      throw new Error(ERROR_MESSAGES.CONTENT_LOGGER_NOT_INITIALIZED);
    }
    ResyncBase.contentLogger.logContentEvent(event);
  }

  /**
   * Records a conversion for an A/B test experiment.
   * @param {string} experimentId - The experiment ID
   * @param {Object} [metadata={}] - Additional metadata for the conversion
   * @returns {*} The result of recording the conversion
   * @throws {Error} If experiment ID is not provided
   * @example
   * ResyncBase.recordConversion('pricing-experiment', { 
   *   revenue: 99.99,
   *   currency: 'USD'
   * });
   */
  static recordConversion(experimentId, metadata = {}) {
    if (!experimentId) {
      throw new Error(ERROR_MESSAGES.EXPERIMENT_ID_REQUIRED);
    }
    // Record the conversion event
    return ResyncBase.abTest.recordConversion(experimentId, metadata);
  }

  /**
   * Fetches the app configuration from the Banana API.
   * This method retrieves the configuration settings for the Banana application.
   * @returns {Promise<AppConfig>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig() {
    if (!ResyncBase.#apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    }

    const cache = ResyncCache.getCache();

    const sessionId = '3amhexwa89r-1752095355810'
    // ResyncCache.getKeyValue("sessionId") ||
    // `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    ResyncCache.saveKeyValue("sessionId", sessionId);
    ResyncBase.sessionId = sessionId;
    if (ResyncBase.userId) {
      ResyncCache.saveKeyValue("userId", ResyncBase.userId);
    }

    if (
      cache?.lastFetchTimestamp &&
      Date.now() - new Date(cache.lastFetchTimestamp).getTime() < ResyncBase.#ttl
    ) {
      // Create AppConfig-like object from cache
      const appConfig = {
        appConfig: cache.configs || {},
        experiments: cache.experiments || [],
        content: cache.content || []
      };
      this.#notifySubscribers(appConfig);
      ResyncBase.#appId = cache.configs?.appId;
      ResyncBase.sessionId = cache.sessionId;
      // Always fetch user variants
      await this.getUserVariants();
      return appConfig;
    }

    const config = await ResyncBase.#fetcher.fetchAppConfig();
    const lastFetchTimestamp = new Date().toISOString();

    if (config) {
      ResyncCache.saveKeyValue("configs", config.appConfig || {});
      ResyncCache.saveKeyValue("content", config.content);
      ResyncCache.saveKeyValue("experiments", config.experiments || []);
      // Always fetch user variants
      await this.getUserVariants();

      ResyncCache.saveKeyValue(
        "lastFetchTimestamp",
        lastFetchTimestamp
      );

      ResyncBase.abTest = new AbTest(config.experiments);
      ResyncBase.contentLogger = new ContentLogger();
      this.#notifySubscribers(config);
      return config;
    }
  }

  /**
   * Subscribes a callback function to configuration updates.
   * @param {Function} callback - The callback function to subscribe
   * @throws {Error} If callback is not a function
   * @example
   * ResyncBase.instance.subscribe((config) => {
   *   console.log('Configuration updated:', config);
   * });
   */
  subscribe(callback) {
    if (typeof callback === "function") {
      this.subscribers.add(callback);
    } else {
      throw new Error(ERROR_MESSAGES.CALLBACK_MUST_BE_FUNCTION);
    }
  }

  /**
   * Unsubscribes a callback function from configuration updates.
   * @param {Function} callback - The callback function to unsubscribe
   * @throws {Error} If callback is not found in subscribers
   * @example
   * ResyncBase.instance.unsubscribe(myCallback);
   */
  unsubscribe(callback) {
    if (this.subscribers.has(callback)) {
      this.subscribers.delete(callback);
    } else {
      throw new Error(ERROR_MESSAGES.CALLBACK_NOT_FOUND);
    }
  }

  /**
   * Notifies all subscribers with the provided data.
   * @param {AppConfig} data - The data to notify subscribers with
   */
  #notifySubscribers(data) {
    console.log("subscribers are", this.subscribers);
    this.subscribers.forEach((callback) => callback(data));
  }

  async getUserVariants() {
    const userVariants = new Map();
    const variants = await ResyncBase.#fetcher.fetchUserVariants();
    if (variants && Array.isArray(variants)) {
      variants.forEach((variant) => {
        userVariants.set(variant.experiment.id, variant);
      });
      ResyncBase.userVariants = userVariants;
      ResyncCache.saveKeyValue("userVariants", userVariants);
    }
  }
}

/**
 * Initializes the ResyncBase class.
 * @param {InitOptions} options - Initialization options
 * @returns {ResyncBase} - Returns the instance of ResyncBase.
 * @example
 * ResyncBaseInit({
 *   key: 'your-api-key',
 *   appId: 'your-app-id',
 *   callback: (config) => console.log('Config loaded')
 * });
 */
export const ResyncBaseInit = (options) => {
  return ResyncBase.init(options);
};

export { ResyncBase }
