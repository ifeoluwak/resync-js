// TypeScript declarations for ResyncBase library

// ============================================================================
// CORE TYPES
// ============================================================================

export interface InitOptions {
    key: string;
    appId: number;
    ttl?: number;
    callback?: (config: AppConfig) => void;
    storage?: Storage;
  }
  
  export interface Storage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }
  
  export interface AppConfig {
    appConfig: any;
    experiments: Experiment[];
    content?: ContentView[]; // Updated to use ContentView array
  }
  
  export interface UserVariant {
    experimentId: string;
    variant: any;
    sessionId: string;
    userId: string;
    timestamp: string;
    client: string;
    metadata: any;
  }
  
  // ============================================================================
  // CACHE TYPES
  // ============================================================================
  
  export interface Config {
    id: string;
    isCurrent: boolean;
    version: string;
    config: any;
  }
  
  export interface ExperimentVariant {
    id: string;
    name: string;
    value: string;
    weight: number;
    default?: boolean;
  }
  
  export interface Experiment {
    id: string;
    name: string;
    type: 'system' | 'custom';
    variants: ExperimentVariant[];
    systemFunctionId?: string;
    rolloutPercent?: number;
    dateSettings?: {
      startDate: string;
      endDate: string;
    };
  }
  
  // ============================================================================
  // CONTENT TYPES (Updated to match admin content-view.ts)
  // ============================================================================
  
  export enum ContentViewStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
  }
  
  export type ElementType =
    | 'text'
    | 'button'
    | 'image'
    | 'input'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea';
  
  export type ContentType = 'section' | 'list' | 'list-item' | 'form' | 'element';
  
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
    backgroundColor?: string;
    padding?: number;
    margin?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    width?: number | string;
    height?: number | string;
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
    opacity?: number;
    objectFit?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    resizeMode?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    tintColor?: string;
    customStyles?: Record<string, any>;
  };
  
  export interface ContainerStyles {
    flexDirection: 'row' | 'column' | 'grid';
    alignItems: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
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
    imageUrl?: string;
    imageAltText?: string;
    imageWidth?: number;
    imageHeight?: number;
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
  }
  
  export type ElementProperty = {
    styles: ContentElementStyles;
    customStyles?: Record<string, any>;
    properties: ContentElementProperties;
    clickAction?: ClickAction;
    customProps?: Record<string, any>;
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
      webhookHeaders?: Record<string, string>;
      webhookMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH';
      webhookTimeout?: number;
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
    };
    status: FormStatus;
    isActive: boolean;
    requiresCaptcha: boolean;
    customProps?: Record<string, any>;
  };
  
  export type ContentView = {
    id: number;
    name: string;
    description?: string;
    status: ContentViewStatus;
    metadata?: Record<string, any>;
    version?: string;
    appId: number;
    createdBy: {
      id: number;
      name: string;
      email: string;
    };
    contents: Array<ContentItem>;
    isFullPage: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  
  // maintain a completely flat structure, no children
  export type ContentItem = {
    id?: number | null; // Database-generated ID (for backend relationships)
    itemId: string; // Frontend uses string IDs (UUIDs)
    type: ContentType;
    elementType?: ElementType | null;
    name: string;
    parentItemId: string | null; // Frontend uses string parent IDs
    order: number;
    data: ElementProperty | SectionProperty | ListProperty | FormProperty;
    contentViewId: number;
    isVisible: boolean;
    isScrollable: boolean;
  };
  
  
  export interface ResyncCacheData {
    configs: any;
    experiments: Experiment[];
    content: ContentView[]; // Updated to use ContentView array
    lastFetchTimestamp?: string;
    sessionId?: string;
    userId?: string;
    userVariants?: Map<string, any>;
  }
  
  export interface StorageInterface {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }
  
  // ============================================================================
  // API RESPONSE TYPES
  // ============================================================================
  
  export interface AppConfigResponse {
    appConfig: any;
    experiments: Experiment[];
    content: ContentView[]; // Updated to use ContentView array
  }
  
  export interface UserVariantRequest {
    userId: string;
    sessionId: string;
    experimentIds: string[];
    appId: string;
  }
  
  export interface UserVariantResponse {
    variants: any;
    userId: string;
    sessionId: string;
  }
  
  // ============================================================================
  // LOGGING TYPES
  // ============================================================================
  
  export interface LogEntry {
    type: 'IMPRESSION' | 'CONVERSION';
    experimentId: string;
    variant: any;
    sessionId: string;
    userId: string;
    timestamp: string;
    client: string;
    metadata: any;
  }
  
  // ============================================================================
  // SYSTEM TEMPLATE TYPES
  // ============================================================================
  
  export type SystemTemplateId = 
    | 'weighted-rollout'
    | 'feature-flag-rollout'
    | 'weighted-random'
    | 'time-based'
    | 'bandit-epsilon-greedy'
    | 'round-robin';
  
  export interface SystemTemplateMap {
    'weighted-rollout': typeof weightedRolloutTemplate;
    'feature-flag-rollout': typeof featureFlagRolloutTemplate;
    'weighted-random': typeof weightedRandom;
    'time-based': typeof getTimeVariant;
  }
  
  // ============================================================================
  // MAIN CLASS DECLARATIONS
  // ============================================================================
  
  export declare class ResyncBase {
    static instance: ResyncBase | null;
    static abTest: AbTest | null;
    static ready: boolean;
    static userId: string | null;
    static sessionId: string | null;
    static client: string | null;
    static attributes: string | null;
    static userVariants: Map<string, UserVariant>;
  
    static init(options: InitOptions): ResyncBase;
    static getApiKey(): string | null;
    static getAppId(): string | null;
    static getApiUrl(): string;
    static setUserId(userId: string | number): void;
    static setClient(client: string): void;
    static setAttributes(attributes: object): void;
    static getVariant(experimentId: string, payload: any): Promise<string | null>;
    static getConfig(key: string): any;
    static getContent(): ContentView[];
    static logContentEvent(event: {
      contentViewId: number,
      itemId: string,
      logId: string,
      action: 'view' | 'click',
      type: 'IMPRESSION' | 'CONVERSION',
      metadata: Record<string, any>
    }): void;
    static recordConversion(experimentId: string, metadata?: object): any;
    
    subscribers: Set<Function>;
    subscribe(callback: (config: AppConfig) => void): void;
    unsubscribe(callback: (config: AppConfig) => void): void;
  }
  
  export declare class ResyncCache {
    static storage: StorageInterface | null;
    static cache: ResyncCacheData;
    static userVariants: Map<string, any>;
  
    static init(storage?: StorageInterface): void;
    static getCache(): ResyncCacheData;
    static getKeyValue(key: string): any;
    static saveKeyValue(key: string, value: any): void;
    static saveToStorage(): void;
    static loadFromStorage(): void;
  }
  
  export declare class ConfigFetch {
    constructor();
    validateEnv(): void;
    fetchAppConfig(): Promise<AppConfigResponse>;
    fetchUserVariants(): Promise<UserVariantResponse>;
  }

  
  export declare class AbTest {
    experiments: Experiment[];
    logs: LogEntry[];
    retryCount: number;
    timeoutId: number;
  
    constructor(experiments: Experiment[]);
    getVariant(experimentName: string, ...payload: any[]): Promise<string | null>;
    logExperiment(experimentId: string, variant: any, type: 'IMPRESSION' | 'CONVERSION', metadata?: any): void;
    recordConversion(experimentName: string, metadata?: any): void;
    saveLogForLaterUpload(logEntries: LogEntry[]): void;
    flushLogs(): Promise<void>;
    sendLogsToBackend(batchEntries: LogEntry[]): void;
    handleSystemFunction(experiment: Experiment): any;
  }
  
  // ============================================================================
  // SYSTEM TEMPLATE FUNCTIONS
  // ============================================================================
  
  export declare function weightedRolloutTemplate(experiment: Experiment): string;
  export declare function featureFlagRolloutTemplate(experiment: Experiment): string;
  export declare function weightedRandom(experiment: Experiment): string;
  export declare function getTimeVariant(experiment: Experiment): string;
  
  export declare const systemTemplatesIdMap: SystemTemplateMap;
  export declare const backendSystemTemplatesIds: string[];
  
  // ============================================================================
  // FACTORY FUNCTION
  // ============================================================================
  
  export declare function ResyncBaseInit(options: InitOptions): ResyncBase;
  
  // ============================================================================
  // DEFAULT EXPORT
  // ============================================================================
  
  export default ResyncBase;