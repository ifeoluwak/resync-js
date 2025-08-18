import { ResyncBase } from "./index.js";
import ResyncCache from "./cache.js";
import { backendSystemTemplatesIds, featureFlagRolloutTemplate, getTimeVariant, weightedRandom, weightedRolloutTemplate } from "./system-templates.js";

const FLUSH_INTERVAL = 5000; // 5 seconds

const LogType = {
  IMPRESSION: "IMPRESSION",
  CONVERSION: "CONVERSION"
};

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
export class AbTest {
  constructor(experiments) {
    this.experiments = experiments || [];
    this.logs = [];
    this.retryCount = 0;
    const fns = this.experiments
      .map((exp) => exp.assignmentFunction)
      .filter((fn) => fn);
    if (fns.length > 0) {
      ResyncBase.exec.loadFunctions(fns);
    }
    this.timeoutId = setInterval(() => this.flushLogs(), FLUSH_INTERVAL); // Every 5s
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
      throw new Error(`Experiment "${experimentName}" not found.`);
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
          const postData = JSON.stringify({
            experimentId: experiment.id,
            systemFunctionId: experiment.systemFunctionId,
            userId: ResyncBase.userId,
            sessionId: ResyncBase.sessionId,
            client: ResyncBase.client,
            metadata: ResyncBase.attributes,
          });
          const response = await fetch(`${ResyncBase.getApiUrl()}${ResyncBase.getAppId()}/get-system-variant`, {
            method: "POST",
            headers: {
              "x-api-key": ResyncBase.getApiKey(),
              "Content-Type": "application/json",
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

    // Does the experiment have custom logic for variant assignment?
    if (experiment.assignmentFunction) {
      // Call the custom function via the functionMapper
      const variantValue = await ResyncBase.exec.functionMapper(
        experiment.assignmentFunction.name,
        ...payload
      );
      const variant = experiment.variants.find(
        (v) => v.value === variantValue
      );
      this.logExperiment(experiment.id, variant, LogType.IMPRESSION);
      return variantValue;
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
    const apiKey = ResyncBase.getApiKey();
    const appId = ResyncBase.getAppId();
    const appUrl = ResyncBase.getApiUrl();
    if (!apiKey || !appId || !appUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    const logEntry = {
      type,
      experimentId,
      variant,
      sessionId: ResyncCache.getKeyValue("sessionId") || ResyncBase.sessionId,
      userId: ResyncCache.getKeyValue("userId") || ResyncBase.userId,
      timestamp: new Date().toISOString(),
      client: ResyncBase.client,
      metadata: metadata || ResyncBase.attributes,
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
    fetch(`${appUrl}${appId}/${experimentId}/log-experiment`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
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
      throw new Error(`Experiment "${experimentName}" not found.`);
    }
    if (!userVariants) {
      throw new Error(`No impression logged for experiment "${experimentName}".`);
    }
    const variant = userVariants.get(experimentId);
    console.log("Recording conversion for userVariants:", userVariants);
    if (!variant) {
      throw new Error(`No variant found for experiment ID "${experimentId}".`);
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
    if (this.logs.length > 1000) {
      this.logs.pop();
    }
    if (!this.timeoutId) {
      console.log("No timeout set, setting a new one");
      this.timeoutId = setTimeout(() => this.flushLogs(), FLUSH_INTERVAL); // Reset timeout
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

    if (this.retryCount > 5) {
      console.warn("A/B Too many retries, stopping flush");
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    this.retryCount++;

    const BATCH_SIZE = 100;
    const batch = this.logs.splice(0, BATCH_SIZE);

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
    const apiKey = ResyncBase.getApiKey();
    const appId = ResyncBase.getAppId();
    const appUrl = ResyncBase.getApiUrl();
    if (!apiKey || !appId || !appUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    fetch(`${appUrl}${appId}/log-experiment/batch`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
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
        throw new Error(`Unknown system function ID: ${experiment.systemFunctionId}`);
    }
  }
}
