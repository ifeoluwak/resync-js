// TypeScript declarations for ResyncBase library
// Public API only - Internal types are not exposed

// ============================================================================
// PUBLIC API TYPES
// ============================================================================

/**
 * Configuration options for initializing ResyncBase
 */
export interface InitOptions {
  /** The API key for ResyncBase API */
  key: string;
  /** The application ID */
  appId: number;
  /** Time-to-live for cache in milliseconds (default: 1 hour) */
  ttl?: number;
  /** Optional callback function when config is loaded */
  callback?: (config: AppConfig) => void;
  /** Optional storage object for caching (e.g., localStorage) */
  storage?: Storage;
}

/**
 * Storage interface for cache persistence
 */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Application configuration returned by ResyncBase
 */
export interface AppConfig {
  /** Application configuration object */
  appConfig: Record<string, any>;
  /** A/B test experiments */
  experiments: Experiment[];
  /** Content views */
  content?: ContentView[];
}

/**
 * A/B test experiment
 */
export interface Experiment {
  /** Unique identifier for the experiment */
  id: string;
  /** Name of the experiment */
  name: string;
  /** Type of experiment ('system' or 'custom') */
  type: 'system' | 'custom';
  /** Array of possible variants */
  variants: ExperimentVariant[];
  /** System function ID for variant assignment */
  systemFunctionId?: string;
  /** Rollout percentage for the experiment */
  rolloutPercent?: number;
  /** Date settings for time-based experiments */
  dateSettings?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * A/B test experiment variant
 */
export interface ExperimentVariant {
  /** Unique identifier for the variant */
  id: string;
  /** Name of the variant */
  name: string;
  /** Value of the variant */
  value: string;
  /** Weight/percentage for this variant */
  weight: number;
  /** Whether this is the default variant */
  default?: boolean;
}

/**
 * Content view for dynamic content management
 */
export interface ContentView {
  /** Content view ID */
  id: number;
  /** Content view name */
  name: string;
  /** Description */
  description?: string;
  /** Status of the content view */
  status: 'draft' | 'published' | 'archived';
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Version */
  version?: string;
  /** Application ID */
  appId: number;
  /** Created by user information */
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  /** Content items array */
  contents: ContentItem[];
  /** Whether this is a full page view */
  isFullPage: boolean;
  /** Created at timestamp */
  createdAt: Date;
  /** Updated at timestamp */
  updatedAt: Date;
}

/**
 * Content item within a content view
 */
export interface ContentItem {
  /** Database ID (optional) */
  id?: number | null;
  /** Frontend item ID */
  itemId: string;
  /** Content type */
  type: 'section' | 'list' | 'list-item' | 'form' | 'element';
  /** Element type (for elements) */
  elementType?: 'text' | 'button' | 'image' | 'input' | 'select' | 'checkbox' | 'radio' | 'textarea' | null;
  /** Item name */
  name: string;
  /** Parent item ID */
  parentItemId: string | null;
  /** Display order */
  order: number;
  /** Item data (styles, properties, etc.) */
  data: Record<string, any>;
  /** Content view ID */
  contentViewId: number;
  /** Whether the item is visible */
  isVisible: boolean;
  /** Whether the item is scrollable */
  isScrollable: boolean;
}

/**
 * User variant assignment
 */
export interface UserVariant {
  /** Experiment ID */
  experimentId: string;
  /** Assigned variant */
  variant: any;
  /** Session ID */
  sessionId: string;
  /** User ID */
  userId: string;
  /** Timestamp */
  timestamp: string;
  /** Client identifier */
  client: string;
  /** Additional metadata */
  metadata: any;
}

/**
 * Content event logging parameters
 */
export interface ContentEvent {
  /** Content view ID */
  contentViewId: number;
  /** Item ID */
  itemId: string;
  /** Log ID */
  logId: string;
  /** Action type */
  action: 'view' | 'click';
  /** Event type */
  type: 'IMPRESSION' | 'CONVERSION';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// MAIN CLASS DECLARATIONS
// ============================================================================

/**
 * Main ResyncBase class for configuration management and A/B testing
 */
export declare class ResyncBase {
  /** Current ResyncBase instance */
  static instance: ResyncBase | null;
  /** A/B test manager */
  static abTest: any | null;
  /** Whether ResyncBase is ready */
  static ready: boolean;
  /** Current user ID */
  static userId: string | null;
  /** Current session ID */
  static sessionId: string | null;
  /** Current client identifier */
  static client: string | null;
  /** Current user attributes */
  static attributes: string | null;
  /** User variant assignments */
  static userVariants: Map<string, UserVariant>;

  /**
   * Initialize ResyncBase
   * @param options - Initialization options
   * @returns ResyncBase instance
   */
  static init(options: InitOptions): ResyncBase;

  /**
   * Get the current API key
   * @returns API key or null if not set
   */
  static getApiKey(): string | null;

  /**
   * Get the current App ID
   * @returns App ID or null if not set
   */
  static getAppId(): string | null;

  /**
   * Get the current API URL
   * @returns API URL
   */
  static getApiUrl(): string;

  /**
   * Set the user ID for tracking and variant assignment
   * @param userId - The user ID to set
   */
  static setUserId(userId: string | number): void;

  /**
   * Set the client identifier for tracking
   * @param client - The client identifier
   */
  static setClient(client: string): void;

  /**
   * Set user attributes for tracking and targeting
   * @param attributes - User attributes object
   */
  static setAttributes(attributes: object): void;

  /**
   * Get a variant for an A/B test experiment
   * @param experimentId - The experiment ID
   * @param payload - Additional payload for variant assignment
   * @returns Promise that resolves to the variant value or null
   */
  static getVariant(experimentId: string, payload?: any): Promise<string | null>;

  /**
   * Get a configuration value by key
   * @param key - The configuration key
   * @returns The configuration value
   */
  static getConfig(key: string): any;

  /**
   * Get content views
   * @returns Array of content views
   */
  static getContent(): ContentView[];

  /**
   * Log a content event
   * @param event - Content event parameters
   */
  static logContentEvent(event: ContentEvent): void;

  /**
   * Record a conversion for an A/B test experiment
   * @param experimentId - The experiment ID
   * @param metadata - Additional metadata for the conversion
   */
  static recordConversion(experimentId: string, metadata?: object): any;

  /** Subscribers to configuration updates */
  subscribers: Set<Function>;

  /**
   * Subscribe to configuration updates
   * @param callback - Callback function to subscribe
   */
  subscribe(callback: (config: AppConfig) => void): void;

  /**
   * Unsubscribe from configuration updates
   * @param callback - Callback function to unsubscribe
   */
  unsubscribe(callback: (config: AppConfig) => void): void;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Initialize ResyncBase (alternative to ResyncBase.init)
 * @param options - Initialization options
 * @returns ResyncBase instance
 */
export declare function ResyncBaseInit(options: InitOptions): ResyncBase;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ResyncBase;
