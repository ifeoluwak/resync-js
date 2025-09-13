import { configService } from "../core/ConfigService.js";
import ResyncCache from "../core/ResyncCache.js";
import { backendSystemTemplatesIds, featureFlagRolloutTemplate, getTimeVariant, weightedRandom, weightedRolloutTemplate } from "../templates/AbSystemTemplate.js";
import { API_CONFIG, ERROR_MESSAGES, LOG_TYPES, RETRY_CONFIG, TIMING_CONFIG } from "../utils/constants.js";

const LogType = LOG_TYPES;

/**
 * AbTest class for managing A/B testing experiments.
 * It allows for variant assignment based on experiments and logs exposures.
 * @class
 * @param {Array} experiments - The list of experiments to manage.
 * @description This class provides methods to get variant values for experiments,
 * log experiment exposures, and handle logging functionality.
 * It uses the ResyncBase for configuration and logging.
 * It also handles retry logic for fetching data and logging.
 */
class AbTest {
  constructor(experiments) {
    this.experiments = experiments || [];
    this.logs = [];
    this.retryCount = 0;
    this.timeoutId = setInterval(() => this.flushLogs(), TIMING_CONFIG.FLUSH_INTERVAL);
  }

  /**
   * Return the variant value and logs the execution of an experiment
   * @param {string} experimentName - The name of the experiment.
   * @param {...*} payload - The payload to use for variant assignment.
   * @returns {Promise<string|null>} - The variant value or null if the experiment is not found.
   * @description This method returns the variant value for the given experiment and logs the execution.
   * It uses the experiment's assignment function if available, otherwise it uses a random assignment based on the input string.
   */
  async getVariant(experimentName, ...payload) {
    const experiment = this.experiments.find(
      (exp) => exp.name === experimentName
    );
    if (!experiment) {
      throw new Error(ERROR_MESSAGES.EXPERIMENT_NOT_FOUND(experimentName));
    }

    // check if user already has a variant for this experiment
    const cachedVariants = ResyncCache.getKeyValue("userVariants") || new Map();

    if (cachedVariants.has(experiment.id)) {
      const userVariant = cachedVariants.get(experiment.id);
      console.log("Using cached variant for experiment:", experimentName, userVariant);
      // No need to log again, just return the variant value
      return userVariant.variant.value;
    }

    // check if the function is a system template
    if (experiment.type === "system") {
      // that should be executed in the backend
      if (backendSystemTemplatesIds.includes(experiment.systemFunctionId)) {
        console.log("Calling backend system function for experiment:", experiment);
        try {
          const { apiUrl, appId, apiKey } = configService.getApiConfig();
          const postData = JSON.stringify({
            experimentId: experiment.id,
            systemFunctionId: experiment.systemFunctionId,
            userId: ResyncCache.getKeyValue("userId"),
            sessionId: ResyncCache.getKeyValue("sessionId"),
            client: ResyncCache.getKeyValue("client"),
            metadata: ResyncCache.getKeyValue("attributes"),
          });
          const response = await fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.SYSTEM_VARIANT}`, {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
            },
            body: postData,
          });
          if (response.ok) {
            const data = await response.json();
            console.log("System function response:", data);
            // store the variant in the cache
            cachedVariants.set(experiment.id, {
              variant: data
            });
            ResyncCache.saveKeyValue("userVariants", cachedVariants);
            return data;
          } else {
            console.error("Failed to fetch system variant:", response.statusText);
            // TODO: Handle error appropriately
          }
        } catch (error) {
          console.error("Failed to fetch system variant:", error);
          // TODO: Handle error appropriately
          // If the backend call fails, choose a random variant
          // const randomIndex = Math.floor(
          //   this.#hashString(ResyncBase.userId + experiment.id) % experiment.variants.length
          // );
          // const variant = experiment.variants[randomIndex];
          // this.logExperiment(experiment.id, variant, LogType.IMPRESSION);
          // return variant.value;
        }
      } else {
        return this.handleSystemFunction(experiment);
      }
    }
  }

  /**
   * Hashes a string using the djb2 algorithm.
   * @param {string} str - The string to hash.
   * @returns {number} - The hash value.
   * @description This method hashes a string using the djb2 algorithm.
   * It is used to ensure consistent variant assignment based on the input string.
   * @example
   * // Hash a string
   * const hashValue = hashString("example string");
   * console.log("Hash value:", hashValue);
   */
  #hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  setExperiments(experiments) {
    this.experiments = experiments;
  }

  /**
   * Logs an experiment exposure.
   * @param {string} experimentId - The ID of the experiment.
   * @param {Object} variant - The variant that was exposed.
   * @param {string} type - The type of exposure (e.g., "IMPRESSION", "CONVERSION").
   * @returns {void}
   * @description This method logs the exposure of an experiment variant.
   * It sends the log entry to the backend API for storage.
   * If the backend API is unreachable or returns an error, it saves the log for later upload.
   * @example
   * // Log an experiment exposure
   * logExperiment("exp123", { value: "variantA" }, "IMPRESSION");
   */
  logExperiment(experimentId, variant, type, metadata = {}) {
    const { apiKey, appId, apiUrl } = configService.getApiConfig();
    if (!apiKey || !appId || !apiUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    const logEntry = {
      type,
      experimentId,
      variant,
      sessionId: ResyncCache.getKeyValue("sessionId"),
      userId: ResyncCache.getKeyValue("userId"),
      timestamp: new Date().toISOString(),
      client: ResyncCache.getKeyValue("client"),
      metadata: metadata || ResyncCache.getKeyValue("attributes"),
    };
    if (type === LogType.IMPRESSION) {
      // also log to userVariants
      // ResyncBase.userVariants.set(experimentId, logEntry);
      const variantCaches = ResyncCache.getKeyValue("userVariants") || new Map();
      variantCaches.set(experimentId, logEntry);
      ResyncCache.saveKeyValue("userVariants", variantCaches);
    }
    // return;
    // Send the log entry to the backend API
    fetch(`${apiUrl}${appId}/${experimentId}${API_CONFIG.ENDPOINTS.LOG_EXPERIMENT}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
      },
      body: JSON.stringify(logEntry),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("A/B Failed to send log entry:", response.statusText);
          this.saveLogForLaterUpload([logEntry]);
          return;
        }
        console.log("A/B Log entry sent successfully:", logEntry);
      })
      .catch((error) => {
        console.error("A/B Logging failed:", error);
        this.saveLogForLaterUpload([logEntry]);
      });
  }

  recordConversion(experimentName, metadata = {}) {
    // get the variant from userVariants
    const userVariants = ResyncCache.getKeyValue("userVariants")
    const experimentId = this.experiments.find(
      (exp) => exp.name === experimentName
    )?.id;
    if (!experimentId) {
      throw new Error(ERROR_MESSAGES.EXPERIMENT_NOT_FOUND(experimentName));
    }
    if (!userVariants) {
      throw new Error(ERROR_MESSAGES.NO_IMPRESSION_LOGGED(experimentName));
    }
    const variant = userVariants.get(experimentId);
    console.log("Recording conversion for userVariants:", userVariants);
    if (!variant) {
      throw new Error(ERROR_MESSAGES.NO_VARIANT_FOUND(experimentId));
    }
    console.log("found conversion for variant:", variant);
    // // Log the conversion
    // this.logExperiment(experimentId, variant, LogType.CONVERSION, metadata);
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
      console.log("No timeout set, setting a new one");
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
      console.log(
        "A/B No stats to flush",
        { timeoutId: this.timeoutId },
        this.logs
      );
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
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
    if (!apiKey || !appId || !apiUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.LOG_EXPERIMENT_BATCH}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
      },
      body: JSON.stringify(batchEntries),
    })
      .then((response) => {
        if (!response.ok) {
          return;
        }
        console.log(
          "A/B Log entry sent successfully 33333:",
          batchEntries.length
        );
        this.executionLogs = this.executionLogs.filter(
          (log) => !batchEntries.some((entry) => entry.id === log.id)
        );
      })
      .catch((error) => {
        console.error("A/B Logging failed:", error);
        this.saveLogForLaterUpload(batchEntries);
      });
  }

  handleSystemFunction(experiment) {
    console.log("Handling system function for experiment:", experiment);
    switch (experiment.systemFunctionId) {
      case "weighted-rollout":
        return weightedRolloutTemplate(experiment);
      case "feature-flag-rollout":
        return featureFlagRolloutTemplate(experiment);
      case "weighted-random":
        return weightedRandom(experiment);
      case "time-based":
        return getTimeVariant(experiment);
      default:
        console.warn(`No handler for system function ID: ${experiment.systemFunctionId}`);
        throw new Error(ERROR_MESSAGES.UNKNOWN_SYSTEM_FUNCTION(experiment.systemFunctionId));
    }
  }
}

export default new AbTest();
