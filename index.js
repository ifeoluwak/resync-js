import BananaCache from "./cache.js";
import { ConfigFetch } from "./config-fetch.js";
import { FunctionExecutor } from "./function-executor.js";

const STORAGE_KEY = "bananaConfigCache";

export class BananaConfig {
  constructor() {
    /**
     * @type {BananaCache}
     */
    this.#cache = this.#loadFromStorage();
    this.fetcher = new ConfigFetch();
    this.#loadAppConfig()
      .then((data) => {
        // console.log("BananaConfig initialized with data:", JSON.stringify(data, null, 2));
        BananaConfig.ready = true;
        // this.#notifySubscribers(data);
      })
      .catch((error) => {
        console.error("Error initializing BananaConfig:", error);
      });
    this.subscribers = new Set();
  }

  #cache = null;

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

  static ready = false;

  static #storage = null;

  static #appId = null;

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
      BananaConfig.#storage = storage;
      console.log("BananaConfig using custom storage");
    } else {
      // BananaConfig.storage = localStorage; // Default to localStorage if no valid storage is provided
      // console.warn("BananaConfig using default localStorage");
    }
    if (!BananaConfig.instance) {
      BananaConfig.instance = new BananaConfig(key);
    }
    if (callback && typeof callback === "function") {
      BananaConfig.instance.subscribe(callback);
    }
    return BananaConfig.instance;
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

    if (
      this.#cache.lastFetchTimestamp &&
      Date.now() - this.#cache.lastFetchTimestamp < BananaConfig.#ttl
    ) {
      this.#notifySubscribers(this.#cache);
      BananaConfig.#appId = this.#cache.configs.appId;
      return this.#cache;
    }

    const config = await this.fetcher.fetchAppConfig(
      BananaConfig.#apiKey,
      BananaConfig.#appId,
      BananaConfig.#apiUrl
    )

    if (config) {
      this.#cache.configs = config.appConfig || {};
      this.#cache.functions = config.functions || [];
      this.#cache.functionSettings = config.functionSettings || {};
      this.#cache.lastFetchTimestamp = Date.now();

      BananaConfig.exec = new FunctionExecutor(this.#cache, {
        key: BananaConfig.#apiKey,
        appUrl: BananaConfig.#apiUrl,
        appId: BananaConfig.#appId,
      });
      // save cache to storage
      this.#saveToStorage();
      this.#notifySubscribers(this.#cache);
      return this.#cache;
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

  #saveToStorage() {
    if (BananaConfig.#storage) {
      BananaConfig.#storage.setItem(STORAGE_KEY, JSON.stringify(this.#cache));
    } else {
    }
  }
  #loadFromStorage() {
    if (BananaConfig.#storage) {
      const data = BananaConfig.#storage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
    console.warn("No storage available to load cache.", BananaConfig);
    return new BananaCache();
  }
}
