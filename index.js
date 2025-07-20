import { AbTest } from "./ab-test.js";
import ResyncCache from "./cache.js";
import { ConfigFetch } from "./config-fetch.js";
import { FunctionExecutor } from "./function-executor.js";

const STORAGE_KEY = "ResyncBaseCache";

export class ResyncBase {
  constructor() {
    /**
     * @type {ResyncCache}
     */
    ResyncBase.#fetcher = new ConfigFetch();
    this.#loadAppConfig()
      .then((data) => {
        ResyncBase.ready = true;
      })
      .catch((error) => {
        console.error("Error initializing ResyncBase:", error);
      });
    this.subscribers = new Set();
  }

  static #fetcher = null;

  /**
   * The API key for Banana API.
   * This key is used to authenticate requests to the Banana API.
   * @type {string|null}
   */
  static #apiKey = null;

  static #apiUrl = "http://localhost:3000/v1/apps-external/";

  static #ttl = 60 * 60 * 1000; // 60 minutes in milliseconds

  static instance = null;

  static exec = null;
  static abTest = null;

  static ready = false;

  static #appId = null;

  static userId = null;

  static sessionId = null;

  static client = null;

  static attributes = null;

  static userVariants = new Map();

  /**
   * Initializes the ResyncBase class.
   * Api key is required to use the Banana API.
   * @param {string} apiKey - The API key for Banana API.
   * @param {number} [ttl=3600000] - The time-to-live for the cache in milliseconds. Default is 1 hour (3600000 ms).
   * @param {Function} [callback] - Optional callback function to be called when the configuration is loaded.
   * @param {Storage} [storage] - Optional storage object to use for caching. If not provided, a default in-memory cache is used.
   * @throws {Error} - Throws an error if the API key is not provided.
   * @throws {Error} - Throws an error if the callback is not a function.
   * @throws {Error} - Throws an error if the storage is not a valid Storage object.
   * @description This method initializes the ResyncBase class with the provided API key and optional parameters.
   * It sets the API key, time-to-live for the cache, and subscribes to updates if a callback is provided.
   * It also creates an instance of ResyncBase if it does not already exist.
   * @returns {ResyncBase} - Returns the instance of ResyncBase.
   */
  static init({ key, appId, ttl = 60 * 60 * 1000, callback, storage }) {
    if (!key) {
      throw new Error("API key is required to use Banana API.");
    }
    if (!appId) {
      throw new Error("App ID is required to use Banana API.");
    }
    ResyncBase.#apiKey = key;
    ResyncBase.#appId = appId;
    ResyncBase.#ttl = ttl;
    // storage must have a getItem, setItem, removeItem and clear methods
    const allowedStorageMethods = ["getItem", "setItem", "removeItem", "clear"];
    if (
      storage &&
      allowedStorageMethods.every(
        (method) => typeof storage[method] === "function"
      )
    ) {
      // ResyncCache.storage = storage;
      ResyncCache.init(storage);
      console.log("ResyncBase using custom storage", storage);
    } else {
      // console.warn("ResyncBase using default localStorage");
      ResyncCache.init();
    }
    if (!ResyncBase.instance) {
      ResyncBase.instance = new ResyncBase(key);
    }
    if (callback && typeof callback === "function") {
      ResyncBase.instance.subscribe(callback);
    }
    return ResyncBase.instance;
  }

  static getApiKey() {
    return ResyncBase.#apiKey;
  }

  static getAppId() {
    return ResyncBase.#appId;
  }

  static getApiUrl() {
    return ResyncBase.#apiUrl;
  }

  static setUserId(userId) {
    ResyncBase.userId = `${userId}`;
    if (ResyncCache.cache) {
      ResyncCache.saveKeyValue("userId", `${userId}`);
    }
    // // ResyncBase.instance.getUserVariants();
  }

  static setClient(client) {
    if (typeof client !== "string") {
      throw new Error("Client must be a string");
    }
    ResyncBase.client = client;
  }

  static setAttributes(attributes) {
    if (typeof attributes !== "object") {
      throw new Error("Attributes must be an object");
    }
    ResyncBase.attributes = JSON.stringify(attributes);
  }

  static async executeFunction(functionName, args) {
    if (!ResyncBase.exec) {
      throw new Error("FunctionExecutor is not initialized. Please initialize ResyncBase first.");
    }
    return await ResyncBase.exec.execute(functionName, args);
  }

  static async getVariant(experimentId, payload) {
    if (!ResyncBase.abTest) {
      throw new Error("AbTest is not initialized. Please initialize ResyncBase first.");
    }
    return await ResyncBase.abTest.getVariant(experimentId, payload);
  }

  static getConfig(key) {
    if (!ResyncBase.#appId) {
      throw new Error("App ID is not set. Please initialize ResyncBase with a valid App ID.");
    }
    const config = ResyncCache.getKeyValue("configs");
    if (config && key in config) {
      return config[key];
    }
    throw new Error(`Configuration for key "${key}" not found.`);
  }

  static recordConversion(experimentId, metadata = {}) {
    if (!experimentId) {
      throw new Error("Experiment ID and variant value are required");
    }
    // Record the conversion event
    return ResyncBase.abTest.recordConversion(experimentId, metadata);

  }

  /**
   * Fetches the app configuration from the Banana API.
   * This method retrieves the configuration settings for the Banana application.
   * @returns {Promise<Object>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig() {
    if (!ResyncBase.#apiKey) {
      throw new Error(
        "API key is not set. Please initialize ResyncBase with a valid API key."
      );
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
      Date.now() - cache?.lastFetchTimestamp < ResyncBase.#ttl
    ) {
      this.#notifySubscribers(cache);
      ResyncBase.#appId = cache.configs.appId;
      ResyncBase.sessionId = cache.sessionId;
      // Always fetch user variants
      await this.getUserVariants();
      return cache;
    }

    const config = await ResyncBase.#fetcher.fetchAppConfig();
    const lastFetchTimestamp = new Date().toISOString();

    if (config) {
      ResyncCache.saveKeyValue("configs", config.appConfig || {});
      ResyncCache.saveKeyValue("functions", config.functions || []);
      ResyncCache.saveKeyValue(
        "functionSettings",
        config.functionSettings || {}
      );
      ResyncCache.saveKeyValue("experiments", config.experiments || []);
      // Always fetch user variants
      await this.getUserVariants();

      ResyncCache.saveKeyValue(
        "lastFetchTimestamp",
        lastFetchTimestamp
      );

      ResyncBase.exec = new FunctionExecutor(cache);
      ResyncBase.abTest = new AbTest(cache.experiments);
      this.#notifySubscribers(cache);
      return cache;
    }
  }

  subscribe(callback) {
    if (typeof callback === "function") {
      this.subscribers.add(callback);
    } else {
      throw new Error("Callback must be a function");
    }
  }
  unsubscribe(callback) {
    if (this.subscribers.has(callback)) {
      this.subscribers.delete(callback);
    } else {
      throw new Error("Callback not found in subscribers");
    }
  }
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
