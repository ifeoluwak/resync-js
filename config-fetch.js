import { ResyncBase } from "./index.js";
import ResyncCache from "./cache.js";

/**
 * @typedef {Object} AppConfigResponse
 * @property {Object} appConfig - The application configuration
 * @property {import("./cache.js").Function[]} functions - Available functions
 * @property {import("./cache.js").FunctionSetting} functionSettings - Function execution settings
 * @property {import("./cache.js").Experiment[]} experiments - A/B test experiments
 * @property {import("./cache.js").Content[]} content - Content
 */

/**
 * @typedef {Object} UserVariantRequest
 * @property {string} userId - The user ID
 * @property {string} sessionId - The session ID
 * @property {string[]} experimentIds - Array of experiment IDs
 * @property {string} appId - The application ID
 */

/**
 * @typedef {Object} UserVariantResponse
 * @property {Object} variants - User variant assignments
 * @property {string} userId - The user ID
 * @property {string} sessionId - The session ID
 */

/**
 * ConfigFetch class for fetching application configurations and user variants from the Banana API.
 * Handles authentication, retry logic, and error handling for API requests.
 * 
 * @class ConfigFetch
 * @example
 * const fetcher = new ConfigFetch();
 * const config = await fetcher.fetchAppConfig();
 * const variants = await fetcher.fetchUserVariants();
 */
export class ConfigFetch {
  /**
   * Creates a new ConfigFetch instance.
   * @constructor
   */
  constructor() {}

  /**
   * Validates that required environment variables are set.
   * @throws {Error} If API key, App ID, or API URL are not set
   * @private
   */
  validateEnv() {
    if (!ResyncBase.getApiKey()) {
      throw new Error("API key is not set. Please initialize ResyncBase with a valid API key.");
    }
    if (!ResyncBase.getAppId()) {
      throw new Error("App ID is not set. Please initialize ResyncBase with a valid App ID.");
    }
    if (!ResyncBase.getApiUrl()) {
      throw new Error("API URL is not set. Please initialize ResyncBase with a valid API URL.");
    }
  }

  /**
   * Fetches the application configuration from the Banana API.
   * Implements retry logic with exponential backoff and fallback URL handling.
   * 
   * @returns {Promise<AppConfigResponse>} The application configuration
   * @throws {Error} If the API request fails after all retries
   * @example
   * const config = await fetcher.fetchAppConfig();
   * console.log('App config:', config.appConfig);
   * console.log('Functions:', config.functions);
   */
  async fetchAppConfig() {
    const numOfRetries = 5;
    const retryDelay = 2000; // 2 seconds
    const appId = ResyncBase.getAppId();
    let path = `${appId}/app-data`;

    this.validateEnv();

    /**
     * Performs the actual fetch request to the API.
     * @returns {Promise<AppConfigResponse>} The API response
     * @throws {Error} If the request fails
     * @private
     */
    const fetchData = async () => {
      try {
        const response = await fetch(`${ResyncBase.getApiUrl()}${path}`, {
          method: "GET",
          headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch app config: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching app config:", error);
        throw error; // Re-throw the error to handle it in the retry logic
      }
    };

    // we want to try as much as possible to get the data
    for (let i = 0; i < numOfRetries; i++) {
      try {
        const data = await fetchData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < numOfRetries - 1) {
            if (i === 2) {
              path = `${appId}/app-data`;
              console.log("Switching to correct API URL", path);
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            throw new Error(
              "Failed to fetch app config after multiple attempts."
            );
          }
      }
    }
  }

  /**
   * Fetches user variants for A/B test experiments from the Banana API.
   * 
   * @returns {Promise<UserVariantResponse>} The user variant assignments
   * @throws {Error} If the API request fails or no experiments are found
   * @example
   * const variants = await fetcher.fetchUserVariants();
   * console.log('User variants:', variants.variants);
   */
  async fetchUserVariants() {
    const experiments = ResyncCache.getKeyValue("experiments") || [];
    const experimentIds = experiments.map((experiment) => experiment.id);
    if (!experimentIds || !Array.isArray(experimentIds) || experimentIds.length === 0) {
      console.warn("No experiments found or experiment IDs are invalid.");
      // throw new Error("Experiment IDs must be a non-empty array.");
      return
    }
    this.validateEnv();
    // if userId is not set, use sessionId
    const userId = ResyncCache.getKeyValue("userId")
    const sessionId = ResyncCache.getKeyValue("sessionId");
    let path = `${ResyncBase.getAppId()}/user-variants`;

    /**
     * Performs the actual fetch request for user variants.
     * @returns {Promise<UserVariantResponse>} The API response
     * @throws {Error} If the request fails
     * @private
     */
    const fetchData = async () => {
      try {
        const response = await fetch(`${ResyncBase.getApiUrl()}${path}`, {
          method: "POST",
          headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            sessionId,
            experimentIds,
            appId: ResyncBase.getAppId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user variants: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error ------:", error?.message);
        throw error; // Re-throw the error to handle it in the retry logic
      }
    }
    try {
        const data = await fetchData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error("Error fetching user variants:", JSON.stringify(error));
        throw error; // Re-throw the error to handle it in the retry logic
      }
  }
}
