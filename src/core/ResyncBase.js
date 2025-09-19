import AbTest from "../services/AbTest.js";
import ResyncCache from "./ResyncCache.js";
import ConfigFetch from "../services/ConfigFetch.js";
import { configService } from "./ConfigService.js";
import {
  API_CONFIG,
  ERROR_MESSAGES,
  STORAGE_CONFIG,
} from "../utils/constants.js";
import ContentLogger from "../services/ContentLogger.js";

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
  constructor() {}

  /** @type {string|null} */
  #apiKey = null;

  /** @type {number} */
  #ttl = 60 * 60 * 1000; // 60 minutes in milliseconds

  /** @type {boolean} */
  ready = false;

  /** @type {string|null} */
  #appId = null;

  /** @type {string|null} */
  userId = null;

  /** @type {string|null} */
  sessionId = null;

  /** @type {string|null} */
  client = null;

  /** @type {string|null} */
  attributes = null;

  /** @type {Map<string, UserVariant>} */
  userVariants = new Map();

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
  init({ key, appId, ttl = 60 * 60 * 1000, callback, storage }) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    if (!appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_REQUIRED);
    }

    if (this.ready) {
      return this;
    }

    // Update configuration service
    configService.setApiKey(key);
    configService.setAppId(appId);
    configService.setTtl(ttl);

    this.#apiKey = key;
    this.#appId = `${appId}`;
    this.#ttl = ttl;

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
      // this = new ResyncBase();
      this.#loadAppConfig()
        .then((data) => {
          this.ready = true;
        })
        .catch((error) => {
          console.error("Error initializing ResyncBase:", error);
        });
      /**
       * @type {Set<Function>}
       */
      this.subscribers = new Set();
    }
    if (callback && typeof callback === "function") {
      this.subscribe(callback);
    }
    return this;
  }

  /**
   * Sets the user ID for tracking and variant assignment.
   * @param {string|number} userId - The user ID to set
   * @example
   * ResyncBase.setUserId('user123');
   * ResyncBase.setUserId(12345);
   */
  setUserId(userId) {
    this.userId = `${userId}`;
    if (ResyncCache) {
      ResyncCache.saveKeyValue("userId", `${userId}`);
    }
    // // this.getUserVariants();
  }

  /**
   * Sets the client identifier for tracking.
   * @param {string} client - The client identifier
   * @throws {Error} If client is not a string
   * @example
   * ResyncBase.setClient('web-app');
   */
  setClient(client) {
    if (typeof client !== "string") {
      throw new Error(ERROR_MESSAGES.CLIENT_MUST_BE_STRING);
    }
    this.client = client;
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
  setAttributes(attributes) {
    if (typeof attributes !== "object") {
      throw new Error(ERROR_MESSAGES.ATTRIBUTES_MUST_BE_OBJECT);
    }
    this.attributes = JSON.stringify(attributes);
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
  async getVariant(experimentId, payload) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!AbTest) {
      throw new Error(ERROR_MESSAGES.ABTEST_NOT_INITIALIZED);
    }
    return await AbTest.getVariant(experimentId, payload);
  }

  /**
   * Gets a configuration value by key.
   * @param {string} key - The configuration key
   * @returns {*} The configuration value
   * @throws {Error} If App ID is not set or configuration not found
   * @example
   * const featureFlag = ResyncBase.getConfig('new-feature');
   */
  getConfig(key) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    const config = ResyncCache.getKeyValue("configs");
    if (config && key in config) {
      return config[key];
    }
    throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND(key));
  }

  getContent() {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    const content = ResyncCache.getKeyValue("content");
    if (content) {
      return content;
    }
    throw new Error(ERROR_MESSAGES.NO_CONTENT_AVAILABLE);
  }

  /**
   * Logs a content event.
   * @param {Object} event - The content event object
   * @throws {Error} If App ID is not set or ContentLogger is not initialized
   * @example
   * ResyncBase.logContentEvent({
   *   contentViewId: 8,
   *   itemId: 'hero-banner',
   *   logId: 'click-001',
   *   action: 'click',
   *   type: 'IMPRESSION',
   *   metadata: { position: 'top', element: 'cta-button' }
   * });
   */
  logContentEvent(event) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!ContentLogger) {
      throw new Error(ERROR_MESSAGES.CONTENT_LOGGER_NOT_INITIALIZED);
    }
    console.log("===================Trying to log content event", event);
    ContentLogger.logContentEvent(event);
  }

  /**
   * Submits a form to the backend API.
   * @param {{itemId: string, contentViewId: number, data: Record<string, unknown>}} formData - The form data to submit.
   * @returns {boolean | Error} - Returns true if the form is submitted successfully, false otherwise.
   * @description This method sends a form data to the backend API for storage.
   */
  submitForm(formData) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!ContentLogger) {
      throw new Error(ERROR_MESSAGES.CONTENT_LOGGER_NOT_INITIALIZED);
    }
    return ContentLogger.submitForm(formData);
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
  recordConversion(experimentId, metadata = {}) {
    if (!experimentId) {
      throw new Error(ERROR_MESSAGES.EXPERIMENT_ID_REQUIRED);
    }
    // Record the conversion event
    return AbTest.recordConversion(experimentId, metadata);
  }

  /**
   * Fetches the app configuration from the Banana API.
   * This method retrieves the configuration settings for the Banana application.
   * @returns {Promise<AppConfig>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig() {
    if (!this.#apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    }

    const cache = ResyncCache.getCache();

    const sessionId = "3amhexwa89r-1752095355810";
    // ResyncCache.getKeyValue("sessionId") ||
    // `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    ResyncCache.saveKeyValue("sessionId", sessionId);
    this.sessionId = sessionId;
    if (this.userId) {
      ResyncCache.saveKeyValue("userId", this.userId);
    }

    if (
      cache?.lastFetchTimestamp &&
      Date.now() - new Date(cache.lastFetchTimestamp).getTime() <
        this.#ttl
    ) {
      // Create AppConfig-like object from cache
      const appConfig = {
        appConfig: cache.configs || {},
        experiments: cache.experiments || [],
        content: cache.content || [],
      };
      this.#notifySubscribers(appConfig);
      this.sessionId = cache.sessionId;
      // Always fetch user variants
      await this.getUserVariants();
      return appConfig;
    }

    const config = await ConfigFetch.fetchAppConfig();
    const lastFetchTimestamp = new Date().toISOString();

    if (config) {
      ResyncCache.saveKeyValue("configs", config.appConfig || {});
      ResyncCache.saveKeyValue("content", config.content);
      ResyncCache.saveKeyValue("experiments", config.experiments || []);
      ResyncCache.saveKeyValue("lastFetchTimestamp", lastFetchTimestamp);
      // Always fetch user variants
      await this.getUserVariants();
      AbTest.setExperiments(config.experiments);
      this.#notifySubscribers(config);
      return config;
    }
  }

  /**
   * Subscribes a callback function to configuration updates.
   * @param {Function} callback - The callback function to subscribe
   * @throws {Error} If callback is not a function
   * @example
   * this.subscribe((config) => {
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
   * this.unsubscribe(myCallback);
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
    const variants = await ConfigFetch.fetchUserVariants();
    if (variants && Array.isArray(variants)) {
      variants.forEach((variant) => {
        userVariants.set(variant.experiment.id, variant);
      });
      ResyncCache.saveKeyValue("userVariants", userVariants);
    }
  }
}

// /**
//  * Initializes the ResyncBase class.
//  * @param {InitOptions} options - Initialization options
//  * @returns {ResyncBase} - Returns the instance of ResyncBase.
//  * @example
//  * ResyncBaseInit({
//  *   key: 'your-api-key',
//  *   appId: 'your-app-id',
//  *   callback: (config) => console.log('Config loaded')
//  * });
//  */
// export const ResyncBaseInit = (options) => {
//   return ResyncBase.init(options);
// };

// Export the class as default
export default ResyncBase;

// Also export an instance for convenience
export const ResyncBaseAPI = new ResyncBase();
