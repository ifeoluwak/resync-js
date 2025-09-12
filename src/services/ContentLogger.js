import { ResyncBase } from "../core/ResyncBase.js";
import ResyncCache from "../core/ResyncCache.js";

const FLUSH_INTERVAL = 5000; // 5 seconds

const LogType = {
  IMPRESSION: "IMPRESSION",
  CONVERSION: "CONVERSION"
};

/**
 * ContentLogger class for managing content events.
 * @description This class provides methods to get variant values for content views,
 * log content events, and handle logging functionality.
 * It uses the ResyncBase for configuration and logging.
 * It also handles retry logic for fetching data and logging.
 */
export class ContentLogger {
  constructor() {
    this.logs = [];
    this.retryCount = 0;
    this.timeoutId = setInterval(() => this.flushLogs(), FLUSH_INTERVAL); // Every 5s
  }


  logContentEvent({
    contentViewId,
    itemId,
    logId,
    action,
    type,
    metadata
  }) {
    const logEntry = {
      type,
      action,
      contentViewId,
      logId,
      itemId,
      sessionId: ResyncCache.getKeyValue("sessionId") || ResyncBase.sessionId,
      userId: ResyncCache.getKeyValue("userId") || ResyncBase.userId,
      timestamp: new Date().toISOString(),
      client: ResyncBase.client,
      metadata: metadata || ResyncBase.attributes,
    };
    // Send the log entry to the backend API
    this.saveLogForLaterUpload([logEntry]);
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
        "Content. No stats to flush",
        { timeoutId: this.timeoutId },
        this.logs
      );
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    if (this.retryCount > 5) {
      console.warn("Content. Too many retries, stopping flush");
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
    fetch(`${appUrl}${appId}/log-content-events`, {
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
          "Content. Log entry sent successfully 33333:",
          batchEntries.length
        );
        this.logs = this.logs.filter(
          (log) => !batchEntries.some((entry) => entry.id === log.id)
        );
      })
      .catch((error) => {
        console.error("Content. Logging failed:", error);
        this.saveLogForLaterUpload(batchEntries);
      });
  }
}
