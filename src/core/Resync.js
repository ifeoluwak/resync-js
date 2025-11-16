import AbTest from "../services/AbTest.js";
import ResyncCache from "./ResyncCache.js";
import ConfigFetch from "../services/ConfigFetch.js";
import { configService } from "./ConfigService.js";
import {
  API_CONFIG,
  ERROR_MESSAGES,
  STORAGE_CONFIG,
  TIMING_CONFIG,
} from "../utils/constants.js";
import AppLogger from "../services/AppLogger.js";


/**
 * Main Resync class.
 *
 * @class Resync
 * @example
 * // Initialize Resync
 * Resync.init({
 *   key: 'your-api-key',
 *   appId: 'your-app-id',
 *   callback: () => console.log('Config loaded:')
 *   storage: localStorage
 *   environment: 'production'
 * });
 *
 * // Get configuration value
 * const value = Resync.getConfig('feature-flag');
 *
 * // Get campaign variant
 * const variant = await Resync.getVariant('campaign-name', payload);
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

  /** @type {Array<{method: Function, args: Array, resolve: Function, reject: Function}>} */
  pendingUserOperations = [];

  /** @type {string|null} */
  #apiKey = null;

  /** @type {number} */
  #ttl = TIMING_CONFIG.DEFAULT_TTL; // 6 hours in milliseconds

  /** @type {boolean} */
  ready = false;

  /** @type {boolean} */
  isLoading = false;

  /** @type {boolean} */
  loadFailed = false;

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
   * @returns {Promise<void>} - Returns the instance of Resync.
   * @example
   * Resync.init({
   *   key: 'your-api-key',
   *   appId: 'your-app-id',
   *   callback: () => console.log('Config loaded'),
   *   storage: localStorage
   *   environment: 'sandbox'
   * });
   */
  async init({ key, appId, callback, storage, environment }) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    if (!appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_REQUIRED);
    }

    if (!environment || (environment !== 'sandbox' && environment !== 'production')) {
      throw new Error(ERROR_MESSAGES.ENVIRONMENT_REQUIRED);
    }

    // enforce storage on production
    if (!storage && environment === 'production') {
      throw new Error(ERROR_MESSAGES.STORAGE_REQUIRED);
    }

    const ttl = environment === 'sandbox' ? TIMING_CONFIG.DEVELOPMENT_TTL : TIMING_CONFIG.DEFAULT_TTL;

    // Update configuration service
    configService.setApiKey(key);
    configService.setAppId(appId);
    configService.setTtl(ttl);
    configService.setEnvironment(environment);

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
    // wait for the storage to be initialized, if storage is provided
    if (
      storage &&
      STORAGE_CONFIG.REQUIRED_METHODS.every(
        (method) => typeof storage[method] === "function"
      )
    ) {
      await ResyncCache.init(storage);
    }
    const cache = ResyncCache.getCache();
    this.userId = cache?.userId || null;

    const sessionId = cache?.sessionId || `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    this.sessionId = sessionId;

    // try to fetch data from api
    this.#loadAppConfig()
  }

  /**
   * Logs out the user and clears the cache.
   * @returns {Promise<void>} - Returns a promise that resolves when the logout is complete
   * @example
   * Resync.logout();
   */
  async logout() {
    if (!this.userId) {
      // no user to logout
      return Promise.resolve();
    }
    this.userId = null;
    this.sessionId = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    this.isLoading = false;
    await ResyncCache.clearCache();
    this.#loadAppConfig(true);
  }


  /**
   * Fetches the app configuration from the Resync API.
   * This method retrieves the configuration settings for the Resync application.
   * @returns {Promise<void>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig(isReload = false) {
    if (!this.#apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    }
    this.isLoading = true;
    const cache = ResyncCache.getCache();

    ResyncCache.saveKeyValue("sessionId", this.sessionId);
    ResyncCache.saveKeyValue("appId", this.#appId);

    // check if appId is same as the appId in the cache
    // and if the last fetch timestamp is less than the ttl
    if (
      !isReload &&
      cache?.appId && cache?.appId === this.#appId &&
      cache?.lastFetchTimestamp &&
      Date.now() - new Date(cache.lastFetchTimestamp).getTime() <
        this.#ttl
    ) {
      this.ready = true;
      this.isLoading = false;
      AbTest.setCampaigns(cache?.campaigns || []);
      this.#executePendingOperations();
      this.#notifySubscribers();
    }

    try {
      const config = await ConfigFetch.fetchAppConfig();
      const lastFetchTimestamp = new Date().toISOString();
  
      if (config) {
        Promise.all([
          ResyncCache.saveKeyValue("configs", config.appConfig || {}),
          ResyncCache.saveKeyValue("content", config.content || []),
          ResyncCache.saveKeyValue("campaigns", config.campaigns || []),
          ResyncCache.saveKeyValue("campaignAssignments", config.campaignAssignments || {}),
          ResyncCache.saveKeyValue("user", config.user || null),
          ResyncCache.saveKeyValue("lastFetchTimestamp", lastFetchTimestamp),
        ]);
        if (config.campaigns) {
          AbTest.setCampaigns(config.campaigns);
        }
        this.loadFailed = false;
      } else {
        // fallback to cache
        // only fail if content is not available in cache
        if (cache?.content?.length === 0) {
          this.loadFailed =  true;
        }
      }
      this.ready = true;
      this.isLoading = false;
      this.#executePendingOperations();
      this.#notifySubscribers();
    } catch (error) {
      this.ready = true;
      this.isLoading = false;
      // fallback to cache
      // only fail if content is not available in cache
      if (cache?.content?.length === 0) {
        this.loadFailed =  true;
      }
      this.#notifySubscribers();
      console.error("Error loading app data. Falling back to cache if available.");
    }
  }

  /**
   * Executes the pending operations due to the app config not being loaded yet.
   */
  #executePendingOperations() {
    for (const operation of this.pendingOperations) {
      operation.method.apply(this, operation.args);
    }
    this.pendingOperations = [];
  }

  /**
   * Executes the pending user operations due to the user ID not being set yet.
   */
  #executePendingUserOperations() {
    for (const operation of this.pendingUserOperations) {
      operation.method.apply(this, operation.args);
    }
    this.pendingUserOperations = [];
  }

  reload() {
    this.#loadAppConfig(true);
  }

  /**
   * Sets the user ID for tracking.
   * @param {string|number} userId - The user ID to set
   * @param {{
   * email: string,
   * name: string,
   * phone: string,
   * language: string
   * age: number
   * gender: string
   * country: string
   * }} attributes - The attributes to set
   * @returns {Promise<boolean>} - Returns true if the user ID is set successfully, false otherwise.
   * @example
   * Resync.logInUser('user123');
   * Resync.logInUser('12345', { email: 'test@test.com', name: 'Test User', phone: '1234567890', language: 'en' });
   */
  logInUser(userId, attributes = null) {
    if (this.userId) {
      this.#executePendingUserOperations();
      return Promise.resolve(true);
    }
    return this.#queueSetMethod(this.#logInUser, userId, attributes);
  }
  #logInUser(userId, metadata = null) {
    this.userId = `${userId}`;
    this.sessionId = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    ResyncCache.saveKeyValue("userId", `${userId}`);
    ResyncCache.saveKeyValue("sessionId", this.sessionId);
    ResyncCache.saveKeyValue("user", null);
    ResyncCache.saveKeyValue("campaignAssignments", {});
    this.#executePendingUserOperations();
    if (this.#apiKey && this.#appId) {
      const body = JSON.stringify({
        userId,
        appId: Number(this.#appId),
        ...metadata,
      })
      // post the user data and reload the data
      return ConfigFetch.logInUser(body).then(() => this.#loadAppConfig(true));
    }
    return Promise.resolve(false);
  }

  /**
   * Sets the client identifier for tracking.
   * @param {string} client - The client identifier
   * @throws {Error} If client is not a string
   * @example
   * Resync.setClient('web-app');
   */
  setClient(client) {
    return this.#queueSetMethod(this.#setClient, client);
  }
  #setClient(client) {
    if (typeof client !== "string") {
      throw new Error(ERROR_MESSAGES.CLIENT_MUST_BE_STRING);
    }
    this.client = client;
  }

  /**
   * Sets user attributes for tracking, audience grouping and targeting.
   * @param {{
   * email: string,
   * name: string,
   * phone: string,
   * language: string,
   * age: number,
   * gender: string,
   * country: string,
   * attributes: Record<string, any>
   * }} attributes - User attributes object
   * @returns {Promise<boolean>} - Returns true if the attributes are set successfully, false otherwise.
   * @example
   * Resync.setUserAttributes({
   *   language: 'en',
   *   age: 25,
   *   gender: 'male',
   *   country: 'US',
   *   attributes: {
   *     height: 180,
   *     plan: 'premium',
   *     planType: 'monthly',
   *     favoriteColor: 'blue',
   *   }
   * });
   */
  setUserAttributes({ email, name, phone, language, age, gender, country, attributes }) {
    if (!this.userId) {
      return new Promise((resolve, reject) => {
        this.pendingUserOperations.push({
          method: this.#setUserAttributes,
          args: [{ email, name, phone, language, age, gender, country, attributes }],
          resolve,
          reject
        });
      });
    }
    return this.#queueSetMethod(this.#setUserAttributes, { email, name, phone, language, age, gender, country, attributes });
  }
  #setUserAttributes({ email, name, phone, language, age, gender, country, attributes }) {
    this.attributes = JSON.stringify(attributes);
    if (this.#apiKey && this.#appId) {
      const body = JSON.stringify({
        userId: this.userId,
        appId: Number(this.#appId),
        email,
        name,
        phone,
        language,
        age,
        gender,
        country,
        attributes,
      });
      return ConfigFetch.setUserAttributesData(body);
    }
    return Promise.resolve(false);
  }

  /**
   * Gets a variant for a campaign.
   * @param {string} campaignName - The campaign name
   * @returns {Promise<number|null>} The variant content view id or null if not found
   * @throws {Error} If AbTest is not initialized
   * @example
   * const variant = await Resync.getVariant('pricing-campaign');
   */
  async getVariant(campaignName) {
    return this.#queueGetMethod(this.#getVariant, campaignName);
  }
  async #getVariant(campaignName) {
    if (!this.#appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!AbTest) {
      throw new Error(ERROR_MESSAGES.ABTEST_NOT_INITIALIZED);
    }
    return await AbTest.getVariant(campaignName);
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
    return this.#queueGetMethod(this.#getConfig, key);
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
    return this.#queueGetMethod(this.#getContent);
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
    return this.#queueSetMethod(this.#logEvent, event);
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
   * Subscribes a callback function to configuration updates.
   * @param {Function} callback - The callback function to subscribe
   * @throws {Error} If callback is not a function
   * @example
   * this.subscribe(() => {
   *   console.log('Configuration updated:');
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
   */
  #notifySubscribers() {
    if (this.subscribers.size > 0) {
      this.subscribers.forEach((callback) => callback());
    }
  }

  // Generic get method queuer
  // get methods require config data
  // we need to wait for the config data to be loaded
  #queueGetMethod(method, ...args) {
    // if ready and not loading
    if (this.ready && !this.isLoading) {
      // If ready, execute immediately
      return method.apply(this, args);
    }

    // If not ready or loading, queue the method call
    return new Promise((resolve, reject) => {
      this.pendingOperations.push({
        method,
        args,
        resolve,
        reject
      });
    });
  }

    // Generic set method queuer
    // set methods don't require config data
    // once sdk is ready, the set methods will be executed immediately
    #queueSetMethod(method, ...args) {
      // if ready
      if (this.ready) {
        // If ready, execute immediately
        return method.apply(this, args);
      }
  
      // If not ready or loading, queue the method call
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

// Also export an instance for convenience
export const ResyncAPI = new Resync();
