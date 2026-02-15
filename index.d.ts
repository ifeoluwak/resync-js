// TypeScript declarations for Resync library
// Public API only - Internal types are not exposed

// ============================================================================
// PUBLIC API TYPES
// ============================================================================

/**
 * Configuration options for initializing Resync
 */
export interface InitOptions {
  /** The API key for Resync API */
  key: string;
  /** The application ID */
  appId: number;
  /** Optional callback function when config is loaded */
  callback?: () => void;
  /** Required storage object for caching (e.g., localStorage, AsyncStorage) */
  storage?: Storage;
  /** Optional environment object */
  environment: 'sandbox' | 'production';
}

/**
 * Storage interface for cache persistence
 */
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Application configuration returned by Resync
 */
export interface AppConfig {
  /** Application configuration object */
  appConfig: Record<string, any>;
  /** Campaigns */
  campaigns: Campaign[];
  /** Content blocks */
  content?: ContentView[];
}

/**
 * Campaign
 */
export interface Campaign {
  /** Unique identifier for the campaign */
  id: string;
  /** Name of the campaign */
  name: string;
  /** Type of campaign ('system' or 'custom') */
  type: 'system' | 'custom';
  /** Array of possible variants */
  variants: CampaignVariant[];
  /** System function ID for variant assignment */
  systemFunctionId?: string;
  /** Rollout percentage for the campaign */
  rolloutPercent?: number;
  /** Date settings for time-based campaigns */
  dateSettings?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Campaign variant
 */
export interface CampaignVariant {
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


export enum ContentViewStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export type ElementType =
  | 'text'
  | 'button'
  | 'image'
  | 'icon'
  | 'divider'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea';

export type ContentType = 'section' | 'list' | 'list-item' | 'form' | 'element';

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
  status: ContentViewStatus;
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
  event: AppEvent;
  eventId?: string;
  hasUnpublishedItems: boolean;
  /** Content items array */
  contents: ContentItem[];
  /** Whether this is a full page view */
  isFullPage: boolean;
  /** Created at timestamp */
  createdAt: Date;
  /** Updated at timestamp */
  updatedAt: Date;
}

export enum ListDataSource {
  STATIC = 'static',
  API = 'api',
  DATABASE = 'database',
}

export enum FormStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum FormSubmissionType {
  WEBHOOK = 'webhook',
  FUNCTION = 'function',
  INTERNAL = 'internal',
}

export type ClickAction = {
  actionType?: 'link' | 'navigation' | 'share' | 'props';
  actionValue?: string;
  navigation?: {
    routeName?: string;
    params?: Record<string, any>;
    type?: 'push' | 'navigate' | 'goBack';
  };
  shareOption?: {
    message?: string;
    url?: string;
    title?: string;
  };
};

export type ContentElementStyles = {
  fontSize?: number;
  fontStyle?: string;
  fontFamily?: string;
  fontWeight?: string;
  textDecorationLine?: string;
  textDecorationColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  textTransform?: string;
  lineHeight?: number;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  marginBottom?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  position?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  boxShadowOffset?: string;
  boxShadowOpacity?: number;
  boxShadowRadius?: number;
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number;
  flexDirection?: string;
  flexWrap?: string;
  gap?: number;
  opacity?: number;
  objectFit?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  resizeMode?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  tintColor?: string;
  customStyles?: Record<string, any>;
};

export interface ContainerStyles {
  flexDirection: 'row' | 'column' | 'grid';
  alignItems:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap: number;
  padding: number;
  borderRadius: number;
  backgroundColor: string;
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  width?: number | string;
  flex?: number;
}

export interface ContentElementProperties {
  textContent?: string;

  // Image properties
  imageUrl?: string; // Image URL/link
  imageAltText?: string; // Alt text for accessibility
  imageWidth?: number; // Image width in pixels
  imageHeight?: number; // Image height in pixels
}

export type ElementProperty = {
  styles: ContentElementStyles;
  customStyles?: Record<string, any>;
  properties: ContentElementProperties;
  clickAction?: ClickAction;
  customProps?: Record<string, any>;
  backgroundImage?: string;
  icon?: {
    name?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
  };
};
export type SectionProperty = {
  styles: ContainerStyles;
  customStyles?: Record<string, any>;
  clickAction?: ClickAction;
  customProps?: Record<string, any>;
  scrollOptions: {
    scrollType: 'vertical' | 'horizontal';
  };
  backgroundImage?: string;
};
export type ListProperty = {
  styles: ContainerStyles;
  customStyles?: Record<string, any>;
  dataSource: ListDataSource;
  data?: Array<Record<string, any>>;
  apiEndpoint?: string;
  maxItems?: number;
  pagination: boolean;
  customProps?: Record<string, any>;
};
export type FormProperty = {
  styles: ContainerStyles;
  customStyles?: Record<string, any>;
  submissionType: FormSubmissionType;
  submitUrl?: string;
  submissionSettings?: {
    // Webhook settings
    webhookHeaders?: Record<string, string>;
    webhookMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH';
    webhookTimeout?: number;

    // Function settings
    functionName?: string;
  };
  submittedSuccessAction?: {
    type?: 'alert' | 'in_app_navigate' | 'out_app_navigate';
    alertTitle?: string;
    alertMessage?: string;
    inAppNavigate?: {
      routeName?: string;
      params?: Record<string, any>;
      type?: 'push' | 'navigate' | 'goBack';
    };
    outAppNavigate?: {
      url?: string;
    };
  };
  submittedErrorAction?: {
    type?: 'alert' | 'in_app_navigate' | 'out_app_navigate';
    alertTitle?: string;
    alertMessage?: string;
    inAppNavigate?: {
      routeName?: string;
      params?: Record<string, any>;
      type?: 'push' | 'navigate' | 'goBack';
    };
    outAppNavigate?: {
      url?: string;
    };
  hideAfterSubmission?: boolean;
  };
  // Form element properties
  inputMode?:
    | 'none'
    | 'text'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'tel'
    | 'url'
    | 'search';
  placeholder?: string;
  label?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  defaultValue?: string | number | boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  cols?: number;
  validationRules?: Record<string, any>;

  labelStyle?: Record<string, any>;
  status: FormStatus;
  isActive: boolean;
  requiresCaptcha: boolean;
  customProps?: Record<string, any>;
};

/**
 * Content item within a content view
 */
export interface ContentItem {
  /** Database ID (optional) */
  id?: number | null;
  /** Frontend item ID */
  itemId: string;
  /** Content type */
  type: ContentType;
  /** Element type (for elements) */
  elementType?: ElementType | null;
  /** Item name */
  name: string;
  /** Parent item ID */
  parentItemId: string | null;
  /** Display order */
  order: number;
  /** Item data (styles, properties, etc.) */
  data: ElementProperty | SectionProperty | ListProperty | FormProperty;
  /** Event */
  event?: AppEvent;
  /** Event ID */
  eventId?: number;
  /** Event config */
  eventConfig?: {
    action?: 'view' | 'click' | 'submit';
    metadata?: Record<string, any>;
    logId?: string;
  };
  /** Content view ID */
  contentViewId: number;
  /** Whether the item is visible */
  isVisible: boolean;
  /** Whether the item is scrollable */
  isScrollable: boolean;
  environment?: 'sandbox' | 'production'; // Item environment
}

/**
 * User variant assignment
 */
export interface CampaignAssignment {
  /** Campaign ID */
  campaignId: number;
  /** Content view ID */
  contentViewId: number;
}

/**
 * Content event logging parameters
 */
export interface AppEvent {
  /** Event ID */
  eventId: string;
  /** External Log ID */
  logId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  id: number;
  name: string;
  description: string;
  type: string;
  scope: 'generic' | 'content_view' | 'content_item' | 'campaign';
}

// ============================================================================
// MAIN CLASS DECLARATIONS
// ============================================================================

/**
 * Main Resync class
 */
declare class ResyncAPI {
  /** Whether the Resync instance is ready */
  ready: boolean;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Whether the app configuration failed to load */
  loadFailed: boolean;
  /** Current user ID */
  userId: string | null;
  /** Current session ID */
  sessionId: string | null;
  /** Current client identifier */
  client: string | null;
  /** Current user attributes */
  attributes: string | null;
  /** Campaign assignments */
  campaignAssignments: { [campaignId: number]: CampaignAssignment };

  /**
   * Initialize Resync
   * @param options - Initialization options
   * @returns Resync instance
   */
  init(options: InitOptions): ResyncAPI;

  /**
   * Reload the app configuration
   * @returns Promise that resolves when the reload is complete
   */
  reload(): Promise<void>;

  /**
   * Log in the user for tracking and variant assignment
   * @param userId - The user ID to set
   * @param {{ email?: string, name?: string, phone?: string, language?: string; age?: number; gender?: string; }} attributes - The attributes to set
   * @returns {Promise<boolean>} - Returns true if the user ID is set successfully, false otherwise.
   */
  logInUser(userId: string | number, attributes?: { email?: string, name?: string, phone?: string, language?: string; age?: number; gender?: string; }): Promise<boolean>;

  /**
   * Set the client identifier for tracking
   * @param client - The client identifier
   */
  setClient(client: string): void;

  /**
   * Set user attributes for tracking and targeting
   * @param {{ email?: string, name?: string, phone?: string, language?: string, age?: number, gender?: string, attributes?: Record<string, unknown> }} attributes - User attributes object
   * @returns {Promise<boolean>} - Returns true if the user attributes are set successfully, false otherwise.
   */
  setUserAttributes({ email, name, phone, language, age, gender, attributes }: { email?: string, name?: string, phone?: string, language?: string, age?: number, gender?: string, attributes?: Record<string, unknown> }): Promise<boolean>;

  /**
   * Get a variant for a campaign
   * @param campaignName - The campaign name
   * @returns Promise that resolves to the variant content view id or null
   */
  getVariant(campaignName: string): Promise<number | null>;

  /**
   * Get a configuration value by key
   * @param key - The configuration key
   * @returns The configuration value
   */
  getConfig(key: string): any | null;

  /**
   * Get content blocks
   * @returns Array of content blocks
   */
  getContent(): ContentView[] | null;

  /**
   * Log a content event
   * @param {{eventId: string, logId?: string, metadata?: Record<string, unknown>}} event - Content event parameters
   */
  logEvent(event: {eventId: string, logId?: string, metadata?: Record<string, unknown>}): void;

  /**
   * Submit a form to the backend API.
   * @param {{contentViewId: number, data: Record<string, unknown>}} formData - Form data to submit.
   * @returns {Promise<boolean | Error>} - Returns true if the form is submitted successfully, false otherwise.
   */
  submitForm(formData: { contentViewId: number, data: Record<string, unknown> }): Promise<boolean | Error>;

  /**
   * Record a conversion for a campaign
   * @param campaignName - The campaign name
   * @param metadata - Additional metadata for the conversion
   */
  // recordConversion(campaignName: string, metadata?: object): any;

  /** Subscribers to configuration updates */
  subscribers: Set<Function>;

  /**
   * Subscribe to configuration updates
   */
  subscribe(callback: () => void): void;

  /**
   * Unsubscribe from configuration updates
   */
  unsubscribe(callback: () => void): void;

  /**
   * Logout the user and clear the cache
   * @returns Promise that resolves when the logout is complete
   */
  logout(): Promise<void>;
}

// Export the ResyncAPI instance as default (matches the actual JavaScript export)
declare const instance: ResyncAPI;
export default instance;
