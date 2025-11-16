import { configService } from "../core/ConfigService.js";
import ResyncCache from "../core/ResyncCache.js";
import { API_CONFIG, RETRY_CONFIG } from "../utils/constants.js";

/**
 * ConfigFetch class for fetching application configurations and user variants from the Resync API.
 * Handles authentication, retry logic, and error handling for API requests.
 * 
 * @class ConfigFetch
 * @example
 * const fetcher = new ConfigFetch();
 * const config = await fetcher.fetchAppConfig();
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
   * Fetches the application configuration from the Resync API.
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
        const environment = configService.getEnvironment();
        const userId = ResyncCache.getKeyValue("userId") // user has been set
        const sessionId = ResyncCache.getKeyValue("sessionId"); // for no user data
        const body = userId ? JSON.stringify({ userId, environment }) : JSON.stringify({ environment, sessionId });
        const response = await fetch(`${apiUrl}${path}`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE
          },
          body,
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
        } else {
          return null;
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
  async logInUser(body) {
    try {
      const { appId, apiKey } = configService.getApiConfig();
      const response = await fetch(`${API_CONFIG.DEFAULT_URL}${appId}${API_CONFIG.ENDPOINTS.CUSTOMER}`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
        },
        body,
      });

      if (!response.ok) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  async setUserAttributesData(body) {
      try {
        const { appId, apiKey } = configService.getApiConfig();
        const response = await fetch(`${API_CONFIG.DEFAULT_URL}${appId}${API_CONFIG.ENDPOINTS.CUSTOMER}`, {
          method: "PATCH",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body,
        });

        if (!response.ok) {
          return false;
        }
        // update local user
        const oldUser = ResyncCache.getKeyValue("user");
        if (oldUser) {
          const attributes = JSON.parse(body).attributes;
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
}

export default new ConfigFetch();