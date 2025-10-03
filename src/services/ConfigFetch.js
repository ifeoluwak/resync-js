import { configService } from "../core/ConfigService.js";
import ResyncCache from "../core/ResyncCache.js";
import { API_CONFIG, RETRY_CONFIG } from "../utils/constants.js";

/**
 * ConfigFetch class for fetching application configurations and user variants from the ResyncBase API.
 * Handles authentication, retry logic, and error handling for API requests.
 * 
 * @class ConfigFetch
 * @example
 * const fetcher = new ConfigFetch();
 * const config = await fetcher.fetchAppConfig();
 * const variants = await fetcher.fetchUserVariants();
 */
class ConfigFetch {
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
    configService.validateConfig();
  }

  /**
   * Fetches the application configuration from the ResyncBase API.
   * Implements retry logic with exponential backoff and fallback URL handling.
   * 
   * @returns {Promise<AppConfigResponse>} The application configuration
   * @throws {Error} If the API request fails after all retries
   * @example
   * const config = await fetcher.fetchAppConfig();
   * console.log('App config:', config.appConfig);
   */
  async fetchAppConfig() {
    const numOfRetries = RETRY_CONFIG.MAX_RETRIES;
    const retryDelay = RETRY_CONFIG.RETRY_DELAY;
    const { appId, apiUrl, apiKey } = configService.getApiConfig();
    let path = `${appId}${API_CONFIG.ENDPOINTS.APP_DATA}`;

    this.validateEnv();

    /**
     * Performs the actual fetch request to the API.
     * @returns {Promise<AppConfigResponse>} The API response
     * @throws {Error} If the request fails
     * @private
     */
    const fetchData = async () => {
      try {
        const userId = ResyncCache.getKeyValue("userId") // user has been set
        const sessionId = ResyncCache.getKeyValue("sessionId"); // for no user data
        const fullPath = userId ? `${apiUrl}${path}` : `${apiUrl}${path}?sessionId=${sessionId}`;
        const response = await fetch(fullPath, {
          method: userId ? "POST" : "GET",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body: userId ? JSON.stringify({ userId }) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch app config: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
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
        if (i < numOfRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            throw error;
          }
      }
    }
  }

  /**
   * Fetches user variants for A/B test experiments from the ResyncBase API.
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
      return;
    }
    this.validateEnv();
    const { appId, apiUrl, apiKey } = configService.getApiConfig();
    // if userId is not set, use sessionId
    const userId = ResyncCache.getKeyValue("userId")
    const sessionId = ResyncCache.getKeyValue("sessionId");
    let path = `${appId}${API_CONFIG.ENDPOINTS.USER_VARIANTS}`;

    /**
     * Performs the actual fetch request for user variants.
     * @returns {Promise<UserVariantResponse>} The API response
     * @throws {Error} If the request fails
     * @private
     */
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}${path}`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body: JSON.stringify({
            userId,
            sessionId,
            experimentIds,
            appId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user variants: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        throw error; // Re-throw the error to handle it in the retry logic
      }
    }
    try {
        const data = await fetchData();
        if (data) {
          return data;
        }
        return null;
      } catch (error) {
        return null;
      }
  }
}

export default new ConfigFetch();