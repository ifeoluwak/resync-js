import { configService } from "../core/ConfigService.js";
import ResyncCache from "../core/ResyncCache.js";
import { API_CONFIG, ERROR_MESSAGES, RETRY_CONFIG, TIMING_CONFIG } from "../utils/constants.js";

// Remove duplicate constants - using from constants.js

/**
 * ContentLogger class for logging events.
 * @description This class provides methods to log events, form submissions and handle logging functionality.
 * It uses the Resync for configuration and logging.
 * It also handles retry logic for fetching data and logging.
 * @class AppLogger
 */
class AppLogger {
  constructor() {
    this.logs = [];
    this.retryCount = 0;
    this.timeoutId = setInterval(() => this.flushLogs(), TIMING_CONFIG.FLUSH_INTERVAL);
  }

  // TODO: Save to storage and send on app load?


  /**
   * Logs an event.
   * @param {{eventId: string, logId?: string, metadata?: Record<string, unknown>}} event - The content event object
   * @throws {Error} If App ID is not set or ContentLogger is not initialized
   * @example
   * Resync.logEvent({
   *   eventId: 'evt-cta-click-234r56',
   *   logId: 'click-001',
   *   metadata: { name: 'John Doe', email: 'john.doe@example.com' }
   * });
   */
  logEvent({
    eventId = null,
    logId = null,
    metadata = null,
  }) {
    const logEntry = {
      eventId,
      logId,
      appId: configService.getApiConfig().appId,
      sessionId: ResyncCache.getKeyValue("sessionId"),
      appCustomerId: ResyncCache.getKeyValue("userId"),
      timestamp: new Date().toISOString(),
      client: ResyncCache.getKeyValue("client"),
      metadata: metadata || ResyncCache.getKeyValue("attributes"),
      environment: configService.getEnvironment(),
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
    fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.LOG_EVENTS_BATCH}`, {
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
   * Submits a form to the backend API.
   * @param {{contentViewId: number, data: Record<string, unknown>}} formData - The form data to submit.
   * @returns {Promise<boolean>} - Returns true if the form is submitted successfully, false otherwise.
   * @description This method sends a form data to the backend API for storage.
   */
  async submitForm(formData) {
    const { apiKey, appId, apiUrl } = configService.getApiConfig();
    return fetch(`${apiUrl}${appId}${API_CONFIG.ENDPOINTS.SUBMIT_FORM}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
      },
      body: JSON.stringify({
        ...formData,
        sessionId: ResyncCache.getKeyValue("sessionId"),
        userId: ResyncCache.getKeyValue("userId"),
        environment: configService.getEnvironment(),
      }),
    })
    .then((response) => {
      if (response.ok) {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    })
    .catch((error) => {
      return Promise.resolve(false);
    });
  }
}

export default new AppLogger();
