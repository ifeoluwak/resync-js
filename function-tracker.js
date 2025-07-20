import { ResyncBase } from "./index.js";

const FLUSH_INTERVAL = 5000; // 5 seconds
export class FunctionTracker {
  timeoutId = null;
  constructor() {
    this.executionLogs = [];
    this.retryCount = 0;
    /**
     * This will be stopped and restarted every time we have unflushed logs
     * @type {null | NodeJS.Timeout}
     */
    this.timeoutId = setInterval(() => this.flushLogs(), FLUSH_INTERVAL); // Every 5s
  }

  /**
   * Saves the log entries that failed to upload for later upload.
   * This method is used when the backend API is unreachable or returns an error.
   * It adds the log entries to a circular buffer to ensure memory safety.
   * @param {Array} logEntrys - The log entries to save for later upload.
   */
  saveLogForLaterUpload(logEntrys) {
    // Add to logs (circular buffer for memory safety)
    this.executionLogs.unshift(...logEntrys);
    if (this.executionLogs.length > 1000) {
      this.executionLogs.pop();
    }
    if (!this.timeoutId) {
      console.log("No timeout set, setting a new one");
      this.timeoutId = setTimeout(() => this.flushLogs(), FLUSH_INTERVAL); // Reset timeout
    }
  }

  /**
   * Logs the execution of a function.
   * @param {string} fnName - The name of the function being executed.
   * @param {Array} args - The arguments passed to the function.
   * @param {*} result - The result returned by the function.
   * @param {Error|null} error - An error object if an error occurred, otherwise null.
   * @param {number} dur - The duration of the function execution in milliseconds.
   * @returns {Promise<void>}
   * @throws {Error} If the log entry cannot be created or sent to the backend.
   * @description This method creates a log entry with the function name, arguments, result, error (if any), duration, and fetch count.
   * It then sends this log entry to the backend API for storage.
   */
  async logExecution(entry) {

    // In production: Send to your backend API
    this.sendLogToBackend(entry);
  }

  /**
   * Flushes the execution logs to the backend in batches.
   * If there are no logs, it clears the timeout.
   * @returns {Promise<void>}
   * @throws {Error} If the backend API is unreachable or returns an error.
   * @description This method sends the logs in batches of 100 to avoid overwhelming the backend.
   * It will also clear the timeout if there are no logs to flush.
   * If the backend API is unreachable or returns an error, it will save the logs for later upload.
   * This is useful for ensuring that logs are not lost in case of network issues.
   * The timeout is reset to ensure logs are flushed periodically.
   * @example
   * // Flush logs to the backend
   * await functionTracker.flushLogs();
   * 
   * // If there are no logs, it will clear the timeout
   * await functionTracker.flushLogs();
   */
  async flushLogs() {
    if (this.executionLogs.length === 0) {
      console.log("No stats to flush", {timeoutId: this.timeoutId}, this.executionLogs);
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    if (this.retryCount > 5) {
      console.warn("Too many retries, stopping flush");
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    this.retryCount++;

    const BATCH_SIZE = 100;
    const batch = this.executionLogs.splice(0, BATCH_SIZE);
    
    this.sendLogsToBackend(batch);
  }

  /**
   * Sends a single log entry to the backend API.
   * @param {Object} logEntry - The log entry to send.
   * @returns {void}
   * @throws {Error} If the backend API is unreachable or returns an error.
   * @description This method sends a single log entry to the backend API for storage.
   * If unsuccessful, it will save the log entry for later upload.
   */
  sendLogToBackend(logEntry) {
    fetch(`${ResyncBase.getApiUrl()}${ResyncBase.getAppId()}/${logEntry.functionId}/log-function`, {
      method: "POST",
      headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
      body: JSON.stringify(logEntry),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to send log entry:", response.statusText);
          this.saveLogForLaterUpload([logEntry]);
          return
        }
        console.log("Log entry sent successfully 11111:", logEntry);
      })
      .catch((error) => {
        console.error("Logging failed:", error);
        this.saveLogForLaterUpload([logEntry]);
      });
  }

  /** * Sends a batch of unuploaded log entries to the backend API.
   * @param {Array} batchEntries - The batch of log entries to send.
   * @returns {void}
   * @throws {Error} If the backend API is unreachable or returns an error.
   * @description This method sends a batch of log entries to the backend API for storage.
   * If unsuccessful, it will save the log entries for later upload.
   */
  sendLogsToBackend(batchEntries) {
    console.log("Log entry sent successfully 2222:", JSON.stringify(batchEntries, null, 2));
    fetch(`${ResyncBase.getApiUrl()}${ResyncBase.getAppId()}/log-function/batch`, {
      method: "POST",
      headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
      body: JSON.stringify(batchEntries),
    })
      .then((response) => {
        if (!response.ok) {
          return
        }
        console.log("Log entry sent successfully 33333:", batchEntries.count);
        this.executionLogs = this.executionLogs.filter(
          (log) => !batchEntries.some((entry) => entry.id === log.id)
        );
      })
      .catch((error) => {
        console.error("Logging failed:", error);
        this.saveLogForLaterUpload(batchEntries);
      });
  }
}
