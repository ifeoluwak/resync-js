import AbTest from "../services/AbTest.js";
import ResyncCache from "./ResyncCache.js";
import ConfigFetch from "../services/ConfigFetch.js";
import { configService } from "./ConfigService.js";
import {
  API_CONFIG,
  ERROR_MESSAGES,
  STORAGE_CONFIG,
} from "../utils/constants.js";
import AppLogger from "../services/AppLogger.js";


/**
 * Main Resync class for configuration management and A/B testing.
 * Provides functionality for fetching app configurations, executing functions,
 * and managing A/B test experiments.
 *
 * @class Resync
 * @example
 * // Initialize Resync
 * Resync.init({
 *   key: 'your-api-key',
 *   appId: 'your-app-id',
 *   callback: (config) => console.log('Config loaded:', config)
 * });
 *
 * // Get configuration value
 * const value = Resync.getConfig('feature-flag');
 *
 * // Get A/B test variant
 * const variant = await Resync.getVariant('experiment-name', payload);
 */
class Resync {
  /**
   * Creates a new Resync instance.
   * @constructor
   * @throws {Error} If initialization fails
   */
  constructor() {}

  /** @type {Array<{method: Function, args: Array, resolve: Function, reject: Function}>} */
  pendingOperations = [];

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
   * Initializes the Resync class.
   * Api key is required to use the Resync API.
   * @param {InitOptions} options - Initialization options
   * @throws {Error} - Throws an error if the API key is not provided.
   * @throws {Error} - Throws an error if the callback is not a function.
   * @throws {Error} - Throws an error if the storage is not a valid Storage object.
   * @description This method initializes the Resync class with the provided API key and optional parameters.
   * It sets the API key, time-to-live for the cache, and subscribes to updates if a callback is provided.
   * It also creates an instance of Resync if it does not already exist.
   * @returns {Promise<Resync>} - Returns the instance of Resync.
   * @example
   * Resync.init({
   *   key: 'your-api-key',
   *   appId: 'your-app-id',
   *   ttl: 1800000, // 30 minutes
   *   callback: (config) => console.log('Config loaded'),
   *   storage: localStorage
   * });
   */
  async init({ key, appId, ttl = 60 * 60 * 1000, callback, storage }) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    if (!appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_REQUIRED);
    }

    // enforce storage
    if (!storage) {
      throw new Error(ERROR_MESSAGES.STORAGE_REQUIRED);
    }

    // Update configuration service
    configService.setApiKey(key);
    configService.setAppId(appId);
    configService.setTtl(ttl);

    this.#apiKey = key;
    this.#appId = `${appId}`;
    this.#ttl = ttl;

    this.subscribers = new Set();

    /**
     * @type {Set<Function>}
     */
    if (callback && typeof callback === "function") {
      this.subscribe(callback);
    }

    // storage must have a getItem, setItem, removeItem and clear methods
    // wait for the storage to be initialized
    if (
      storage &&
      STORAGE_CONFIG.REQUIRED_METHODS.every(
        (method) => typeof storage[method] === "function"
      )
    ) {
      await ResyncCache.init(storage);
    } else {
      throw new Error(ERROR_MESSAGES.STORAGE_REQUIRED);
    }
    // fetch data from api
    await this.#loadAppConfig()
      .then(() => {
        this.ready = true;
      })
      .catch((error) => {
        console.error("Error initializing Resync:", error);
      });
    // return this;
  }

  // async reset() {
  //   this.userId = null;
  //   this.sessionId = null;
  //   this.userVariants = new Map();
  //   this.ready = false;
  //   await ResyncCache.clearCache();
  //   // we need to reload the app config
  //   await this.#loadAppConfig();
  // }

  /**
   * Sets the user ID for tracking and variant assignment.
   * @param {string|number} userId - The user ID to set
   * @param {{ email: string, name: string, phone: string, language: string }} metadata - The metadata to set
   * @returns {Promise<boolean>} - Returns true if the user ID is set successfully, false otherwise.
   * @example
   * Resync.setUserId('user123');
   * Resync.setUserId('12345', { email: 'test@test.com', name: 'Test User', phone: '1234567890', language: 'en' });
   */
  setUserId(userId, metadata = null) {
    return this.#queueMethod(this.#setUserId, userId, metadata);
  }
  #setUserId(userId, metadata = null) {
    if (ResyncCache) {
      const existingUserId = ResyncCache.getKeyValue("userId");
      if (existingUserId) {
        // check if userId is same as existing userId
        if (existingUserId === `${userId}`) {
          return true;
        } else {
          // reset the cache
          this.userId = `${userId}`;
          this.sessionId = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          ResyncCache.saveKeyValue("userId", `${userId}`);
          ResyncCache.saveKeyValue("sessionId", this.sessionId);
        }
      } else {
        this.userId = `${userId}`;
        ResyncCache.saveKeyValue("userId", `${userId}`);
      }
    }
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.DEFAULT_URL}${this.#appId}${API_CONFIG.ENDPOINTS.CUSTOMER}`, {
          method: "POST",
          headers: {
            "x-api-key": this.#apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body: JSON.stringify({
            userId,
            appId: Number(this.#appId),
            ...metadata,
          }),
        });

        if (!response.ok) {
          return false;
        }
        return true;
      } catch (error) {
        return false;
      }
    }
    if (this.#apiKey && this.#appId) {
      return fetchData();
    }
    return Promise.resolve(false);
    // // this.getUserVariants();
  }

  /**
   * Sets the client identifier for tracking.
   * @param {string} client - The client identifier
   * @throws {Error} If client is not a string
   * @example
   * Resync.setClient('web-app');
   */
  setClient(client) {
    return this.#queueMethod(this.#setClient, client);
  }
  #setClient(client) {
    if (typeof client !== "string") {
      throw new Error(ERROR_MESSAGES.CLIENT_MUST_BE_STRING);
    }
    this.client = client;
  }

  /**
   * Sets user attributes for tracking and targeting.
   * @param {{ email: string, name: string, phone: string, language: string, attributes: Object }} attributes - User attributes object
   * @returns {Promise<boolean>} - Returns true if the attributes are set successfully, false otherwise.
   * @example
   * Resync.setUserAttributes({
   *   email: 'test@test.com',
   *   name: 'Test User',
   *   phone: '1234567890',
   *   language: 'en',
   *   attributes: {
   *     country: 'US',
   *     plan: 'premium',
   *     age: 25
   *   }
   * });
   */
  setUserAttributes({ email, name, phone, language, attributes }) {
    return this.#queueMethod(this.#setUserAttributes, { email, name, phone, language, attributes });
  }
  #setUserAttributes({ email, name, phone, language, attributes }) {
    // if (typeof attributes !== "object") {
    //   throw new Error(ERROR_MESSAGES.ATTRIBUTES_MUST_BE_OBJECT);
    // }
    if (!this.userId) {
      throw new Error(ERROR_MESSAGES.USER_ID_NOT_SET);
    }
    this.attributes = JSON.stringify(attributes);
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.DEFAULT_URL}${this.#appId}${API_CONFIG.ENDPOINTS.CUSTOMER}`, {
          method: "PATCH",
          headers: {
            "x-api-key": this.#apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body: JSON.stringify({
            userId: this.userId,
            appId: Number(this.#appId),
            email,
            name,
            phone,
            language,
            attributes,
          }),
        });

        if (!response.ok) {
          return false;
        }
        // update local user
        const oldUser = ResyncCache.getKeyValue("user");
        if (oldUser) {
          ResyncCache.saveKeyValue("user", {
            ...oldUser,
            attributes: {
              ...oldUser.attributes,
              ...attributes,
            }
          });
        }
        return true;
      } catch (error) {
        return false;
      }
    }
    if (this.#apiKey && this.#appId) {
      return fetchData();
    }
    return Promise.resolve(false);
  }

  /**
   * Gets a variant for an A/B test campaign.
   * @param {string} experimentName - The campaign name
   * @returns {Promise<number|null>} The variant content view id or null if not found
   * @throws {Error} If AbTest is not initialized
   * @example
   * const variant = await Resync.getVariant('pricing-experiment');
   */
  async getVariant(experimentName) {
    return this.#queueMethod(this.#getVariant, experimentName);
  }
  async #getVariant(experimentName) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!AbTest) {
      throw new Error(ERROR_MESSAGES.ABTEST_NOT_INITIALIZED);
    }
    return await AbTest.getVariant(experimentName);
  }

  /**
   * Gets a configuration value by key.
   * @param {string} key - The configuration key
   * @returns {*} The configuration value
   * @throws {Error} If App ID is not set or configuration not found
   * @example
   * const featureFlag = Resync.getConfig('new-feature');
   */
  getConfig(key) {
    return this.#queueMethod(this.#getConfig, key);
  }
  #getConfig(key) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    const configs = ResyncCache.getKeyValue("configs");
    if (configs && key in configs) {
      return configs[key];
    }
    return null;
    // throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND(key));
  }

  getContent() {
    return this.#queueMethod(this.#getContent);
  }
  #getContent() {
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
   * Logs an event.
   * @param {{eventId: string, logId?: string, metadata?: Record<string, unknown>}} event - The event object
   * @throws {Error} If App ID is not set or AppLogger is not initialized
   * @example
   * Resync.logEvent({
   *   eventId: 'evt-cta-click-234r56',
   *   logId: 'click-001',
   *   metadata: { name: 'John Doe', email: 'john.doe@example.com' }
   * });
   */
  logEvent(event) {
    return this.#queueMethod(this.#logEvent, event);
  }
  #logEvent(event) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!AppLogger) {
      throw new Error(ERROR_MESSAGES.CONTENT_LOGGER_NOT_INITIALIZED);
    }
    AppLogger.logEvent(event);
  }

  /**
   * Submits a form to the backend API.
   * @param {{contentViewId: number, data: Record<string, unknown>}} formData - The form data to submit.
   * @returns {Promise<boolean | Error>} - Returns true if the form is submitted successfully, false otherwise.
   * @description This method sends a form data to the backend API for storage.
   */
  async submitForm(formData) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!AppLogger) {
      throw new Error(ERROR_MESSAGES.CONTENT_LOGGER_NOT_INITIALIZED);
    }
    return AppLogger.submitForm(formData);
  }

  /**
   * Records a conversion for an A/B test experiment.
   * @param {string} experimentName - The experiment name
   * @param {Object} [metadata={}] - Additional metadata for the conversion
   * @returns {*} The result of recording the conversion
   * @throws {Error} If experiment ID is not provided
   * @example
   * Resync.recordConversion('pricing-experiment', {
   *   revenue: 99.99,
   *   currency: 'USD'
   * });
   */
  recordConversion(experimentName, metadata = {}) {
    // if (!experimentName) {
    //   throw new Error(ERROR_MESSAGES.EXPERIMENT_ID_REQUIRED);
    // }
    // // Record the conversion event
    // return AbTest.recordConversion(experimentName, metadata);
  }

  /**
   * Fetches the app configuration from the Resync API.
   * This method retrieves the configuration settings for the Resync application.
   * @returns {Promise<void>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig() {
    if (!this.#apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    }

    const cache = ResyncCache.getCache();

    const sessionId = cache?.sessionId || `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;

    ResyncCache.saveKeyValue("sessionId", sessionId);
    this.sessionId = sessionId;

    if (
      cache?.lastFetchTimestamp &&
      Date.now() - new Date(cache.lastFetchTimestamp).getTime() <
        this.#ttl
    ) {
      // Create AppConfig-like object from cache
      const appConfig = {
        configs: cache.configs || {},
        experiments: cache.experiments || [],
        content: cache.content || [],
      };
      AbTest.setExperiments(appConfig.experiments);
      this.#notifySubscribers(appConfig);
      return true;
    }

    const config = await ConfigFetch.fetchAppConfig();
    const lastFetchTimestamp = new Date().toISOString();

    if (config) {
      Promise.all([
        ResyncCache.saveKeyValue("configs", config.appConfig || {}),
        ResyncCache.saveKeyValue("content", config.content),
        ResyncCache.saveKeyValue("experiments", config.experiments || []),
        ResyncCache.saveKeyValue("lastFetchTimestamp", lastFetchTimestamp),
      ]);
      if (config.user) {
        ResyncCache.saveKeyValue("user", config.user);
      }
      if (config.userEvents) {
        this.setUserVariants(config.userEvents);
      }
      
      AbTest.setExperiments(config.experiments);
      this.#notifySubscribers({
        configs: config.appConfig || {},
        experiments: config.experiments || [],
        content: config.content || [],
      });
      return true;
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
    if (this.subscribers.size > 0) {
      this.subscribers.forEach((callback) => callback(data));
    }
  }

  /**
   * Gets user variants from the cache or fetches them from the API.
   * @param {UserVariantResponse} variants - The user variants to set
   * @returns {Promise<void>} - Returns a promise that resolves when the user variants are set
   */
  async setUserVariants(variants) {
    const userVariants = new Map();
    // const variants = await ConfigFetch.fetchUserVariants();
    if (variants && Array.isArray(variants)) {
      variants.forEach((variant) => {
        userVariants.set(variant.id, variant);
      });
      ResyncCache.saveKeyValue("userVariants", userVariants);
    }
  }

    // Generic method queuer
    #queueMethod(method, ...args) {
      if (this.ready) {
        // If ready, execute immediately
        return method.apply(this, args);
      }
  
      // If not ready, queue the method call
      return new Promise((resolve, reject) => {
        this.pendingOperations.push({
          method,
          args,
          resolve,
          reject
        });
      });
    }
}

// Export the class as default
export default Resync;

// Also export an instance for convenience
export const ResyncAPI = new Resync();
