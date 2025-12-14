/**
 * Constants for Resync library
 * Centralized configuration and magic numbers
 */

// API Configuration
export const API_CONFIG = {
  DEFAULT_URL: "https://api.getresync.com/v1/apps-external/",
  ENDPOINTS: {
    APP_DATA: "/app-data",
    USER_VARIANTS: "/user-variants",
    SYSTEM_VARIANT: "/get-system-variant",
    GET_ROUND_ROBIN_VARIANT: "/get-round-robin-variant",
    LOG_EXPERIMENT: "/log-experiment",
    LOG_EXPERIMENT_BATCH: "/log-experiment/batch",
    LOG_CAMPAIGN_EVENT: "/log-campaign-event",
    LOG_CAMPAIGN_EVENT_BATCH: "/log-campaign-event/batch",
    LOG_CONTENT_EVENTS: "/log-content-events",
    LOG_EVENTS_BATCH: "/log-events-batch",
    SUBMIT_FORM: "/submit-form",
    CUSTOMER: "/customers"
  },
  HEADERS: {
    CONTENT_TYPE: "application/json",
    API_KEY_HEADER: "x-api-key"
  }
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  BATCH_SIZE: 100,
  MAX_LOG_BUFFER: 1000
};

// Timing Configuration
export const TIMING_CONFIG = {
  FLUSH_INTERVAL: 5000, // 5 seconds
  DEFAULT_TTL: 60 * 60 * 1000 * 6, // 6 hours in milliseconds
  HASH_MULTIPLIER: 31,
  HASH_MODULO: 1000000007,
  DEVELOPMENT_TTL: 0,
};

// Log Types
export const LOG_TYPES = {
  IMPRESSION: "IMPRESSION",
  CONVERSION: "CONVERSION"
};

// System Template IDs
export const SYSTEM_TEMPLATE_IDS = {
  WEIGHTED_ROLLOUT: "weighted-rollout",
  FEATURE_FLAG_ROLLOUT: "feature-flag-rollout", 
  WEIGHTED_RANDOM: "weighted-random",
  TIME_BASED: "time-based",
  BANDIT_EPSILON_GREEDY: "bandit-epsilon-greedy",
  ROUND_ROBIN: "round-robin"
};

// Backend System Templates (require API calls)
export const BACKEND_SYSTEM_TEMPLATES = [
  SYSTEM_TEMPLATE_IDS.BANDIT_EPSILON_GREEDY,
  SYSTEM_TEMPLATE_IDS.ROUND_ROBIN
];

// Storage Configuration
export const STORAGE_CONFIG = {
  CACHE_KEY: "resync_cache",
  REQUIRED_METHODS: ["getItem", "setItem", "removeItem", "clear"]
};

// Error Messages
export const ERROR_MESSAGES = {
  API_KEY_REQUIRED: "API key is required to use Resync API.",
  APP_ID_REQUIRED: "App ID is required to use Resync API.",
  STORAGE_REQUIRED: "Storage is required to use Resync API.",
  API_KEY_NOT_SET: "API key is not set. Please initialize Resync with a valid API key.",
  APP_ID_NOT_SET: "App ID is not set. Please initialize Resync with a valid App ID.",
  API_URL_NOT_SET: "API URL is not set. Please initialize Resync with a valid API URL.",
  CLIENT_MUST_BE_STRING: "Client must be a string",
  ATTRIBUTES_MUST_BE_OBJECT: "Attributes must be an object",
  CALLBACK_MUST_BE_FUNCTION: "Callback must be a function",
  CALLBACK_NOT_FOUND: "Callback not found in subscribers",
  CAMPAIGN_NOT_FOUND: (name) => `Campaign "${name}" not found.`,
  CONFIG_NOT_FOUND: (key) => `Configuration for key "${key}" not found.`,
  NO_CONTENT_AVAILABLE: "No content available",
  NO_IMPRESSION_LOGGED: (name) => `No impression logged for campaign "${name}".`,
  NO_VARIANT_FOUND: (id) => `No variant found for campaign ID "${id}".`,
  CAMPAIGN_ID_REQUIRED: "Campaign ID and variant value are required",
  CAMPAIGN_NOT_INITIALIZED: "Campaign is not initialized. Please initialize Resync first.",
  CONTENT_LOGGER_NOT_INITIALIZED: "AppLogger is not initialized. Please initialize Resync first.",
  UNKNOWN_SYSTEM_FUNCTION: (id) => `Unknown system function ID: ${id}`,
  FAILED_FETCH_APP_CONFIG: "Failed to fetch app config after multiple attempts.",
  FAILED_FETCH_USER_VARIANTS: "Failed to fetch user variants:",
  FAILED_FETCH_SYSTEM_VARIANT: "Failed to fetch system variant:",
  FAILED_SEND_LOG: "Failed to send log entry:",
  LOGGING_FAILED: "Logging failed:",
  TOO_MANY_RETRIES: "Too many retries, stopping flush",
  USER_ALREADY_LOGGED_IN: 'A user is already logged in. Call logout() first to switch users.'
};

// Hash Algorithm Constants
export const HASH_CONFIG = {
  DJB2_INITIAL: 5381,
  DJB2_MULTIPLIER: 33
};
