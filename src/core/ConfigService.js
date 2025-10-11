/**
 * Configuration service for Resync
 * Centralizes configuration management to avoid circular dependencies
 * @class ConfigService
 */

import { API_CONFIG, ERROR_MESSAGES } from '../utils/constants.js';

class ConfigService {
  constructor() {
    this.apiKey = null;
    this.appId = null;
    this.apiUrl = API_CONFIG.DEFAULT_URL;
    this.ttl = 60 * 60 * 1000; // 60 minutes in milliseconds
  }

  /**
   * Sets the API key
   * @param {string} key - The API key
   */
  setApiKey(key) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    this.apiKey = key;
  }

  /**
   * Sets the App ID
   * @param {string|number} id - The App ID
   */
  setAppId(id) {
    if (!id) {
      throw new Error(ERROR_MESSAGES.APP_ID_REQUIRED);
    }
    this.appId = `${id}`;
  }

  /**
   * Sets the API URL
   * @param {string} url - The API URL
   */
  setApiUrl(url) {
    this.apiUrl = url;
  }

  /**
   * Sets the TTL
   * @param {number} ttl - Time to live in milliseconds
   */
  setTtl(ttl) {
    this.ttl = ttl;
  }

  /**
   * Gets the API key
   * @returns {string|null} The API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Gets the App ID
   * @returns {string|null} The App ID
   */
  getAppId() {
    return this.appId;
  }

  /**
   * Gets the API URL
   * @returns {string} The API URL
   */
  getApiUrl() {
    return this.apiUrl;
  }

  /**
   * Gets the TTL
   * @returns {number} The TTL in milliseconds
   */
  getTtl() {
    return this.ttl;
  }

  /**
   * Validates that required configuration is set
   * @throws {Error} If required configuration is missing
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_SET);
    }
    if (!this.appId) {
      throw new Error(ERROR_MESSAGES.APP_ID_NOT_SET);
    }
    if (!this.apiUrl) {
      throw new Error(ERROR_MESSAGES.API_URL_NOT_SET);
    }
  }

  /**
   * Gets API configuration for requests
   * @returns {Object} API configuration object
   */
  getApiConfig() {
    this.validateConfig();
    return {
      apiKey: this.apiKey,
      appId: this.appId,
      apiUrl: this.apiUrl
    };
  }
}

// Export singleton instance
export const configService = new ConfigService();
