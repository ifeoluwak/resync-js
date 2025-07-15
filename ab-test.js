import { BananaConfig } from "./index.js";
import BananaCache from "./cache.js";

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
 * It uses the BananaConfig for configuration and logging.
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
      BananaConfig.exec.loadFunctions(fns);
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
    const cachedVariants = BananaCache.getKeyValue("userVariants") || new Map();
    
    if (cachedVariants.has(experiment.id)) {
      const userVariant = cachedVariants.get(experiment.id);
      console.log("11111 Cached variants:", userVariant);
      // No need to log again, just return the variant value
      return userVariant.variant.value;
    }

    // check if the function is a system template
    if (experiment.type === "system") {
      const backendTemplates = ['bandit-epsilon-greedy', 'round-robin'];
      // that should be executed in the backend
      if (backendTemplates.includes(experiment.systemFunctionId)) {
        try {
          const response = await fetch(`${BananaConfig.getApiUrl()}${BananaConfig.getAppId()}/get-system-variant`, {
          method: "POST",
          headers: {
            "x-api-key": BananaConfig.getApiKey(),
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            experimentId: experiment.id,
            userId: BananaConfig.userId,
            sessionId: BananaConfig.sessionId,
            client: BananaConfig.client,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
        } catch (error) {
          // If the backend call fails, choose a random variant
          console.error("Failed to fetch system variant from backend:", error);
          const randomIndex = Math.floor(
            this.#hashString(BananaConfig.userId + experiment.id) % experiment.variants.length
          );
          const variant = experiment.variants[randomIndex];
          this.logExperiment(experiment.id, variant, LogType.IMPRESSION);
          return variant.value;
        }
      }
    }

    // Does the experiment have custom logic for variant assignment?
    if (experiment.assignmentFunction) {
      // Call the custom function via the functionMapper
      const variantValue = await BananaConfig.exec.functionMapper(
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
  logExperiment(experimentId, variant, type) {
    const apiKey = BananaConfig.getApiKey();
    const appId = BananaConfig.getAppId();
    const appUrl = BananaConfig.getApiUrl();
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
      sessionId: BananaCache.getKeyValue("sessionId") || BananaConfig.sessionId,
      userId: BananaCache.getKeyValue("userId") || BananaConfig.userId,
      timestamp: new Date().toISOString(),
      client: BananaConfig.client,
      metadata: BananaConfig.attributes,
    };
    // console.log("Logging experiment entry:", logEntry);
    if (type === LogType.IMPRESSION) {
      // also log to userVariants
      // BananaConfig.userVariants.set(experimentId, logEntry);
      const variantCaches = BananaCache.getKeyValue("userVariants") || new Map();
      variantCaches.set(experimentId, logEntry);
      BananaCache.saveKeyValue("userVariants", variantCaches);
      console.log("Saved user variant to cache:", variantCaches);
    }
    return;
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
        console.log("A/B Log entry sent successfully 11111:", logEntry);
      })
      .catch((error) => {
        console.error("A/B Logging failed:", error);
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
    const apiKey = BananaConfig.getApiKey();
    const appId = BananaConfig.getAppId();
    const appUrl = BananaConfig.getApiUrl();
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
          batchEntries.count
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
}
