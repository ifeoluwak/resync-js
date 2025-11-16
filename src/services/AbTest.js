import { configService } from "../core/ConfigService.js";
import ResyncCache from "../core/ResyncCache.js";
import { weightedRolloutTemplate } from "../templates/AbSystemTemplate.js";
import { API_CONFIG, ERROR_MESSAGES, LOG_TYPES, RETRY_CONFIG, TIMING_CONFIG } from "../utils/constants.js";

const LogType = LOG_TYPES;

/**
 * AbTest class for managing campaigns.
 * It allows for variant assignment based on campaigns and logs exposures.
 * @class
 * @param {Array} campaigns - The list of campaigns to manage.
 * @description This class provides methods to get variant values for campaigns,
 * log campaign exposures, and handle logging functionality.
 * It uses the Resync for configuration and logging.
 * It also handles retry logic for fetching data and logging.
 */
class AbTest {
  constructor(campaigns) {
    /**
     * @type {Array<Campaign>}
     */
    this.campaigns = campaigns || [];
    this.logs = [];
    this.retryCount = 0;
    this.timeoutId = setInterval(() => this.flushLogs(), TIMING_CONFIG.FLUSH_INTERVAL);
  }

  /**
   * Return the variant value and logs the execution of an campaign
   * @param {string} campaignName - The name of the campaign.
   * @returns {Promise<number>} - The content view id of the assigned variant or null if no variants are provided
   * @description This method returns the variant value for the given campaign and logs the execution.
   * It uses the campaign's assignment function if available, otherwise it uses a random assignment based on the input string.
   */
  async getVariant(campaignName) {
    const campaign = this.campaigns.find(
      (camp) => camp.name === campaignName
    );
    if (!campaign) {
      throw new Error(ERROR_MESSAGES.CAMPAIGN_NOT_FOUND(campaignName));
    }

    // check if user already has a variant for this campaign
    const cachedVariants = ResyncCache.getKeyValue("userVariants") || new Map();

    if (cachedVariants.has(campaign.id)) {
      const userVariant = cachedVariants.get(campaign.id);
      // No need to log again, just return the variant value
      return userVariant.contentViewId;
    }

    // check if the function is a system template
    if (campaign.abTestType === "round-robin") {
      // that should be executed and logged in the backend
      try {
        const { apiUrl, appId, apiKey } = configService.getApiConfig();
        const postData = JSON.stringify({
          campaignId: campaign.id,
          userId: ResyncCache.getKeyValue("userId"),
          sessionId: ResyncCache.getKeyValue("sessionId"),
          client: ResyncCache.getKeyValue("client"),
          metadata: ResyncCache.getKeyValue("attributes"),
          environment: configService.getEnvironment(),
        });
        const response = await fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.GET_ROUND_ROBIN_VARIANT}`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
          },
          body: postData,
        });
        if (response.ok) {
          // data should be a content view id
          const contentViewId = await response.json();
          // store the variant in the cache
          cachedVariants.set(campaign.id, {
            eventType: 'IMPRESSION',
            contentViewId,
            campaignId: campaign.id,
            sessionId: ResyncCache.getKeyValue("sessionId"),
            userId: ResyncCache.getKeyValue("userId"),
            client: ResyncCache.getKeyValue("client"),
            environment: configService.getEnvironment(),
          });
          ResyncCache.saveKeyValue("userVariants", cachedVariants);
          // return the content view id
          return contentViewId;
        } else {
          console.error("Failed to fetch system variant:", response.statusText);
          return campaign.controlContentId;
        }
      } catch (error) {
        console.error("Failed to fetch system variant:", error);
        return campaign.controlContentId;
      }
    } else {
      return this.handleWeightedRollout(campaign);
    }
  }

  setCampaigns(campaigns) {
    this.campaigns = campaigns;
  }

  /**
   * Logs an campaign exposure.
   * @param {string} campaignId - The ID of the campaign.
   * @param {number} contentViewId - The ID of the content view.
   * @param {string} eventType - The type of event (e.g., "IMPRESSION", "CONVERSION").
   * @returns {void}
   * @description This method logs the exposure of an campaign variant.
   * It sends the log entry to the backend API for storage.
   * If the backend API is unreachable or returns an error, it saves the log for later upload.
   * @example
   * // Log an campaign exposure
   * logCampaign("camp123", 123, "IMPRESSION");
   */
  logCampaign(campaignId, contentViewId, eventType, metadata = null) {
    const { apiKey, appId, apiUrl } = configService.getApiConfig();
    const logEntry = {
      eventType,
      campaignId,
      contentViewId,
      sessionId: ResyncCache.getKeyValue("sessionId"),
      userId: ResyncCache.getKeyValue("userId"),
      timestamp: new Date().toISOString(),
      client: ResyncCache.getKeyValue("client") || '',
      metadata: metadata || ResyncCache.getKeyValue("attributes"),
      environment: configService.getEnvironment(),
    };
    if (eventType === LogType.IMPRESSION) {
      const variantCaches = ResyncCache.getKeyValue("userVariants") || new Map();
      variantCaches.set(campaignId, logEntry);
      ResyncCache.saveKeyValue("userVariants", variantCaches);
    }
    // return;
    // Send the log entry to the backend API
    fetch(`${apiUrl}${appId}/${campaignId}${API_CONFIG.ENDPOINTS.LOG_CAMPAIGN_EVENT}
      `, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
      },
      body: JSON.stringify(logEntry),
    })
      .then((response) => {
        if (!response.ok) {
          this.saveLogForLaterUpload([logEntry]);
          return;
        }
      })
      .catch((error) => {
        this.saveLogForLaterUpload([logEntry]);
      });
  }

  /** * Saves log entries for later upload.
   * @param {Array} logEntrys - The log entries to save.
   * @returns {void}
   * @description This method saves log entries for later upload if the backend API is unreachable or returns an error.
   */
  saveLogForLaterUpload(logEntrys) {
    // Add to logs (circular buffer for memory safety)
    this.logs.unshift(...logEntrys);
    if (this.logs.length > RETRY_CONFIG.MAX_LOG_BUFFER) {
      this.logs.pop();
    }
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flushLogs(), TIMING_CONFIG.FLUSH_INTERVAL);
    }
  }

  /**
   * Flushes the logs to the backend API.
   * @returns {Promise<void>}
   * @throws {Error} If the backend API is unreachable or returns an error.
   * @description This method sends the logs to the backend API for storage.
   * If unsuccessful, it will save the logs for later upload.
   */
  async flushLogs() {
    if (this.logs.length === 0) {
      clearInterval(this.timeoutId);
      this.timeoutId = null;
      return;
    }

    if (this.retryCount > RETRY_CONFIG.MAX_RETRIES) {
      console.warn(ERROR_MESSAGES.TOO_MANY_RETRIES);
      clearInterval(this.timeoutId);
      return;
    }

    this.retryCount++;

    const batch = this.logs.splice(0, RETRY_CONFIG.BATCH_SIZE);

    this.sendLogsToBackend(batch);
  }

  /**
   * Sends a batch of log entries to the backend API.
   * @param {Array} batchEntries - The batch of log entries to send.
   * @returns {void}
   * @throws {Error} If the backend API is unreachable or returns an error.
   * @description This method sends a batch of log entries to the backend API for storage.
   * If unsuccessful, it will save the log entries for later upload.
   */
  sendLogsToBackend(batchEntries) {
    const { apiKey, appId, apiUrl } = configService.getApiConfig();
    fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.LOG_CAMPAIGN_EVENT_BATCH}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
      },
      body: JSON.stringify(batchEntries),
    })
      .then((response) => {
        if (!response.ok) {
          this.saveLogForLaterUpload(batchEntries);
          return;
        }
        this.logs = this.logs.filter(
          (log) => !batchEntries.some((entry) => entry.id === log.id)
        );
      })
      .catch((error) => {
        this.saveLogForLaterUpload(batchEntries);
      });
  }

  /**
   * Handles the system function for the campaign.
   * @param {Campaign} campaign - The campaign to handle.
   * @returns {number|null} The content view id of the assigned variant or null if no variants are provided
   */
  handleWeightedRollout(campaign) {
    const contentViewId = weightedRolloutTemplate(campaign);
    this.logCampaign(campaign.id, contentViewId, LogType.IMPRESSION, {
      timestamp: new Date().toISOString(),
    });
    return contentViewId;
  }
}

export default new AbTest();
