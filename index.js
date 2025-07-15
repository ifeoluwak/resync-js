import { AbTest } from "./ab-test.js";
import BananaCache from "./cache.js";
import { ConfigFetch } from "./config-fetch.js";
import { FunctionExecutor } from "./function-executor.js";

const STORAGE_KEY = "bananaConfigCache";

export class BananaConfig {
  constructor() {
    /**
     * @type {BananaCache}
     */
    BananaConfig.#fetcher = new ConfigFetch();
    this.#loadAppConfig()
      .then((data) => {
        // console.log("BananaConfig initialized with data:", JSON.stringify(data, null, 2));
        BananaConfig.ready = true;
      })
      .catch((error) => {
        console.error("Error initializing BananaConfig:", error);
      });
    this.subscribers = new Set();
  }

  #cache = null;
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
   * Initializes the BananaConfig class.
   * Api key is required to use the Banana API.
   * @param {string} apiKey - The API key for Banana API.
   * @param {number} [ttl=3600000] - The time-to-live for the cache in milliseconds. Default is 1 hour (3600000 ms).
   * @param {Function} [callback] - Optional callback function to be called when the configuration is loaded.
   * @param {Storage} [storage] - Optional storage object to use for caching. If not provided, a default in-memory cache is used.
   * @throws {Error} - Throws an error if the API key is not provided.
   * @throws {Error} - Throws an error if the callback is not a function.
   * @throws {Error} - Throws an error if the storage is not a valid Storage object.
   * @description This method initializes the BananaConfig class with the provided API key and optional parameters.
   * It sets the API key, time-to-live for the cache, and subscribes to updates if a callback is provided.
   * It also creates an instance of BananaConfig if it does not already exist.
   * @returns {BananaConfig} - Returns the instance of BananaConfig.
   */
  static init({ key, appId, ttl = 60 * 60 * 1000, callback, storage }) {
    if (!key) {
      throw new Error("API key is required to use Banana API.");
    }
    if (!appId) {
      throw new Error("App ID is required to use Banana API.");
    }
    BananaConfig.#apiKey = key;
    BananaConfig.#appId = appId;
    BananaConfig.#ttl = ttl;
    // storage must have a getItem, setItem, removeItem and clear methods
    const allowedStorageMethods = ["getItem", "setItem", "removeItem", "clear"];
    if (
      storage &&
      allowedStorageMethods.every(
        (method) => typeof storage[method] === "function"
      )
    ) {
      // BananaCache.storage = storage;
      BananaCache.init(storage);
      console.log("BananaConfig using custom storage");
    } else {
      // console.warn("BananaConfig using default localStorage");
      BananaCache.init();
    }
    if (!BananaConfig.instance) {
      BananaConfig.instance = new BananaConfig(key);
    }
    if (callback && typeof callback === "function") {
      BananaConfig.instance.subscribe(callback);
    }
    return BananaConfig.instance;
  }

  static getApiKey() {
    return BananaConfig.#apiKey;
  }

  static getAppId() {
    return BananaConfig.#appId;
  }

  static getApiUrl() {
    return BananaConfig.#apiUrl;
  }

  static setUserId(userId) {
    BananaConfig.userId = `${userId}`;
    if (BananaCache.cache) {
      BananaCache.saveKeyValue("userId", `${userId}`);
    }
    // // BananaConfig.instance.getUserVariants();
  }

  static setClient(client) {
    if (typeof client !== "string") {
      throw new Error("Client must be a string");
    }
    BananaConfig.client = client;
  }

  static setAttributes(attributes) {
    if (typeof attributes !== "object") {
      throw new Error("Attributes must be an object");
    }
    BananaConfig.attributes = JSON.stringify(attributes);
  }

  /**
   * Fetches the app configuration from the Banana API.
   * This method retrieves the configuration settings for the Banana application.
   * @returns {Promise<Object>} - Returns a promise that resolves to the app configuration object.
   * @throws {Error} - Throws an error if the API key is not set or if the request fails.
   */
  async #loadAppConfig() {
    // console.log("BananaConfig.getAppConfig called");
    if (!BananaConfig.#apiKey) {
      throw new Error(
        "API key is not set. Please initialize BananaConfig with a valid API key."
      );
    }

    const cache = BananaCache.getCache();

    if (
      cache?.lastFetchTimestamp &&
      Date.now() - cache?.lastFetchTimestamp < BananaConfig.#ttl
    ) {
      this.#notifySubscribers(cache);
      BananaConfig.#appId = cache.configs.appId;
      BananaConfig.sessionId = cache.sessionId;
      // always fetch user variants
      this.getUserVariants();
      return cache;
    }

    const config = await BananaConfig.#fetcher.fetchAppConfig();
    const lastFetchTimestamp = new Date().toISOString();

    if (config) {
      BananaCache.saveKeyValue("configs", config.appConfig || {});
      BananaCache.saveKeyValue("functions", config.functions || []);
      BananaCache.saveKeyValue(
        "functionSettings",
        config.functionSettings || {}
      );
      BananaCache.saveKeyValue("experiments", config.experiments || []);
      BananaCache.saveKeyValue(
        "lastFetchTimestamp",
        lastFetchTimestamp
      );
      const sessionId =
        BananaCache.getKeyValue("sessionId") ||
        `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      BananaCache.saveKeyValue("sessionId", sessionId);
      BananaConfig.sessionId = sessionId;
      BananaCache.saveKeyValue("userId", BananaConfig.userId);

      BananaConfig.exec = new FunctionExecutor(cache);
      BananaConfig.abTest = new AbTest(cache.experiments);
      this.#notifySubscribers(cache);
      this.getUserVariants();
      // console.log("BananaConfig initialized with cache:", cache);
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

  getUserVariants() {
    const userVariants = new Map();
    BananaConfig.#fetcher
      .fetchUserVariants()
      .then((variants) => {
        console.log("Fetched user variants =======x:", variants);
        if (variants && Array.isArray(variants)) {
          // variants.forEach((variant) => {
          //   userVariants.set(variant.experimentId, variant);
          // });
          // BananaConfig.userVariants = userVariants;
          // BananaCache.saveKeyValue("userVariants", Array.from(userVariants.entries()));
          // console.log("User variants fetched and saved:", userVariants);


          // variants.forEach((variant) => {
          //   userVariants.set(variant.experimentId, variant);
          // });
          // cache.userVariants = userVariants;
          // BananaCache.saveKeyValue("userVariants", userVariants);
          }
      });
  }
}
