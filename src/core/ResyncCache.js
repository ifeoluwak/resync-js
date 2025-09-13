/**
 * Object representing the configuration for a Banana application.
 * @typedef {Object} Config
 * @property {string} id - The unique identifier for the configuration.
 * @property {boolean} isCurrent - Indicates whether this configuration is the current one.
 * @property {string} version - The version of the configuration.
 * @property {Object} config - The config values for the Banana application.
 */

/**
 * Object representing an experiment variant in A/B testing.
 * @typedef {Object} ExperimentVariant
 * @property {string} id - The unique identifier for the variant
 * @property {string} name - The name of the variant
 * @property {string} value - The value of the variant
 * @property {number} weight - The weight/percentage for this variant
 */

/**
 * Object representing an A/B test experiment.
 * @typedef {Object} Experiment
 * @property {string} id - The unique identifier for the experiment
 * @property {string} name - The name of the experiment
 * @property {string} type - The type of experiment (e.g., 'system', 'custom')
 * @property {ExperimentVariant[]} variants - Array of possible variants
 * @property {string} [systemFunctionId] - ID of system function for variant assignment
 */

/**
 * Object representing content element styles.
 * @typedef {Object} ContentElementStyles
 * @property {number} [fontSize] - Font size
 * @property {string} [fontStyle] - Font style
 * @property {string} [fontFamily] - Font family
 * @property {string} [fontWeight] - Font weight
 * @property {string} [textDecorationLine] - Text decoration line
 * @property {string} [textDecorationColor] - Text decoration color
 * @property {string} [textAlign] - Text alignment
 * @property {string} [color] - Text color
 * @property {string} [textTransform] - Text transform
 * @property {string} [backgroundColor] - Background color
 * @property {number} [padding] - Padding
 * @property {number} [margin] - Margin
 * @property {number} [borderRadius] - Border radius
 * @property {number} [borderWidth] - Border width
 * @property {string} [borderColor] - Border color
 * @property {number|string} [width] - Width
 * @property {number|string} [height] - Height
 * @property {string} [position] - Position
 * @property {string} [boxShadow] - Box shadow
 * @property {string} [boxShadowColor] - Box shadow color
 * @property {string} [boxShadowOffset] - Box shadow offset
 * @property {number} [boxShadowOpacity] - Box shadow opacity
 * @property {number} [boxShadowRadius] - Box shadow radius
 * @property {number} [flex] - Flex
 * @property {number} [flexGrow] - Flex grow
 * @property {number} [flexShrink] - Flex shrink
 * @property {number} [flexBasis] - Flex basis
 * @property {string} [flexDirection] - Flex direction
 * @property {string} [flexWrap] - Flex wrap
 * @property {number} [opacity] - Opacity
 * @property {string} [objectFit] - Object fit
 * @property {string} [resizeMode] - Resize mode
 * @property {string} [tintColor] - Tint color
 * @property {Object} [customStyles] - Custom styles
 */

/**
 * Object representing container styles.
 * @typedef {Object} ContainerStyles
 * @property {string} flexDirection - Layout type (row, column, grid)
 * @property {string} alignItems - Alignment type
 * @property {string} [justifyContent] - Justify content
 * @property {number} gap - Gap between items
 * @property {number} padding - Padding
 * @property {number} borderRadius - Border radius
 * @property {string} backgroundColor - Background color
 * @property {string} flexWrap - Flex wrap
 * @property {number|string} [width] - Width
 * @property {number} [flex] - Flex
 */

/**
 * Object representing content element properties.
 * @typedef {Object} ContentElementProperties
 * @property {string} [textContent] - Text content
 * @property {string} [imageUrl] - Image URL
 * @property {string} [imageAltText] - Image alt text
 * @property {number} [imageWidth] - Image width
 * @property {number} [imageHeight] - Image height
 * @property {string} [inputMode] - Input mode
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [label] - Label text
 * @property {boolean} [required] - Required field
 * @property {boolean} [secureTextEntry] - Secure text entry
 * @property {string|number|boolean} [defaultValue] - Default value
 * @property {number} [minLength] - Minimum length
 * @property {number} [maxLength] - Maximum length
 * @property {number} [min] - Minimum value
 * @property {number} [max] - Maximum value
 * @property {number} [step] - Step value
 * @property {string} [pattern] - Pattern
 * @property {Array} [options] - Options array
 * @property {number} [rows] - Number of rows
 * @property {number} [cols] - Number of columns
 * @property {Object} [validationRules] - Validation rules
 * @property {Object} [labelStyle] - Label style
 */

/**
 * Object representing click action.
 * @typedef {Object} ClickAction
 * @property {string} [actionType] - Action type
 * @property {string} [actionValue] - Action value
 * @property {Object} [navigation] - Navigation object
 * @property {Object} [shareOption] - Share option object
 */

/**
 * Object representing element property.
 * @typedef {Object} ElementProperty
 * @property {ContentElementStyles} styles - Element styles
 * @property {Object} [customStyles] - Custom styles
 * @property {ContentElementProperties} properties - Element properties
 * @property {ClickAction} [clickAction] - Click action
 * @property {Object} [customProps] - Custom properties
 */

/**
 * Object representing section property.
 * @typedef {Object} SectionProperty
 * @property {ContainerStyles} styles - Container styles
 * @property {Object} [customStyles] - Custom styles
 * @property {ClickAction} [clickAction] - Click action
 * @property {Object} [customProps] - Custom properties
 * @property {Object} scrollOptions - Scroll options
 * @property {string} scrollOptions.scrollType - Scroll type (vertical, horizontal)
 */

/**
 * Object representing list property.
 * @typedef {Object} ListProperty
 * @property {ContainerStyles} styles - Container styles
 * @property {Object} [customStyles] - Custom styles
 * @property {string} dataSource - Data source type
 * @property {Array} [data] - Data array
 * @property {string} [apiEndpoint] - API endpoint
 * @property {number} [maxItems] - Maximum items
 * @property {boolean} pagination - Pagination enabled
 * @property {Object} [customProps] - Custom properties
 */

/**
 * Object representing form property.
 * @typedef {Object} FormProperty
 * @property {ContainerStyles} styles - Container styles
 * @property {Object} [customStyles] - Custom styles
 * @property {string} submissionType - Submission type
 * @property {string} [submitUrl] - Submit URL
 * @property {Object} [submissionSettings] - Submission settings
 * @property {Object} [submittedSuccessAction] - Success action
 * @property {Object} [submittedErrorAction] - Error action
 * @property {string} status - Form status
 * @property {boolean} isActive - Is active
 * @property {boolean} requiresCaptcha - Requires captcha
 * @property {Object} [customProps] - Custom properties
 */

/**
 * Object representing a content item in the flat structure.
 * @typedef {Object} ContentItem
 * @property {number|null} [id] - Database ID
 * @property {string} itemId - Frontend item ID
 * @property {string} type - Content type (section, list, form, element)
 * @property {string|null} [elementType] - Element type
 * @property {string} name - Item name
 * @property {string|null} parentItemId - Parent item ID
 * @property {number} order - Order
 * @property {ElementProperty|SectionProperty|ListProperty|FormProperty} data - Item data
 * @property {number} contentViewId - Content view ID
 * @property {boolean} isVisible - Is visible
 * @property {boolean} isScrollable - Is scrollable
 */

/**
 * Object representing a content view.
 * @typedef {Object} ContentView
 * @property {number} id - Content view ID
 * @property {string} name - Content view name
 * @property {string} [description] - Description
 * @property {string} status - Status (draft, published, archived)
 * @property {Object} [metadata] - Metadata
 * @property {string} [version] - Version
 * @property {number} appId - App ID
 * @property {Object} createdBy - Created by user
 * @property {number} createdBy.id - User ID
 * @property {string} createdBy.name - User name
 * @property {string} createdBy.email - User email
 * @property {ContentItem[]} contents - Content items array
 * @property {boolean} isFullPage - Is full page
 * @property {Date} createdAt - Created at
 * @property {Date} updatedAt - Updated at
 */

/**
 * Cache object for storing Banana application configurations.
 * @typedef {Object} ResyncCacheData
 * @property {Object} configs - Application configuration object
 * @property {Experiment[]} experiments - Array of A/B test experiments
 * @property {ContentView[]} content - Array of content views
 * @property {string} [lastFetchTimestamp] - ISO timestamp of last fetch
 * @property {string} [sessionId] - Current session ID
 * @property {string} [userId] - Current user ID
 * @property {Map<string, Object>} [userVariants] - User variant assignments
 */

/**
 * Storage interface for cache persistence.
 * @typedef {Object} StorageInterface
 * @property {function(string): string|null} getItem - Get item from storage
 * @property {function(string, string): void} setItem - Set item in storage
 * @property {function(string): void} removeItem - Remove item from storage
 * @property {function(): void} clear - Clear all items from storage
 */

import { STORAGE_CONFIG } from "../utils/constants.js";

const STORAGE_KEY = STORAGE_CONFIG.CACHE_KEY;

/**
 * ResyncCache class for managing application configuration caching.
 * Provides functionality for storing and retrieving configuration data,
 * functions, experiments, and user variants with optional persistence.
 * 
 * @class ResyncCache
 * @example
 * // Initialize with localStorage
 * ResyncCache.init(localStorage);
 * 
 * // Save a configuration value
 * ResyncCache.saveKeyValue('configs', { featureFlag: true });
 * 
 * // Retrieve a configuration value
 * const configs = ResyncCache.getKeyValue('configs');
 */
class ResyncCache {
  /** @type {StorageInterface|null} */
  storage;

  /** @type {ResyncCacheData} */
  cache = {
    configs: {},
    experiments: [],
    content: [],
    lastFetchTimestamp: null,
    sessionId: null,
    userId: null,
    userVariants: new Map(),
  };

  /** @type {Map<string, Object>} */
  userVariants = new Map();

  /**
   * Initializes the ResyncCache with optional storage.
   * @param {StorageInterface} [storage] - Optional storage interface for persistence
   * @example
   * // Initialize with localStorage
   * ResyncCache.init(localStorage);
   * 
   * // Initialize with custom storage
   * ResyncCache.init({
   *   getItem: (key) => customStorage.get(key),
   *   setItem: (key, value) => customStorage.set(key, value),
   *   removeItem: (key) => customStorage.delete(key),
   *   clear: () => customStorage.clear()
   * });
   */
  init(storage) {
    if (storage) {
      this.storage = storage;
      this.loadFromStorage();
    }
  }

  /**
   * Gets the current cache instance.
   * @returns {ResyncCacheData} The current cache data
   * @example
   * const cache = ResyncCache.getCache();
   * console.log('Current cache:', cache);
   */
  getCache() {
    return this.cache;
  }

  /**
   * Retrieves a value from cache by key.
   * @param {string} key - The cache key to retrieve
   * @returns {*} The cached value or null if not found
   * @example
   * const configs = ResyncCache.getKeyValue('configs');
   * const functions = ResyncCache.getKeyValue('functions');
   */
  getKeyValue(key) {
    return this.cache[key] || null;
  }

  /**
   * Saves the entire cache to storage.
   * @example
   * ResyncCache.saveToStorage();
   */
  saveToStorage() {
    if (this.storage) {
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.cache)
      );
    } else {
      console.warn("No storage available to save cache.");
    }
  }

  /**
   * Saves a key-value pair to cache and optionally to storage.
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   * @example
   * ResyncCache.saveKeyValue('configs', { featureFlag: true });
   * ResyncCache.saveKeyValue('lastFetchTimestamp', new Date().toISOString());
   */
  saveKeyValue(key, value) {
    this.cache[key] = value;
    if (this.storage) {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    }
  }

  /**
   * Loads cache data from storage.
   * @example
   * ResyncCache.loadFromStorage();
   */
  loadFromStorage() {
    if (this.storage) {
       try {
        const data = this.storage.getItem(STORAGE_KEY);
        const parsedData = JSON.parse(data);
        // Restore the cache state from the parsed data
        this.cache = parsedData;
       } catch (error) {
        console.error("Error loading cache from storage:", error);
       }
    } else {
      console.warn("No storage available to load cache.");
    }
  }
}

export default new ResyncCache();