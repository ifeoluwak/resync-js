/**
 * Object representing the configuration for a ResyncBase application.
 * @typedef {Object} Config
 * @property {string} id - The unique identifier for the configuration.
 * @property {boolean} isCurrent - Indicates whether this configuration is the current one.
 * @property {string} version - The version of the configuration.
 * @property {Object} config - The config values for the ResyncBase application.
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
 * Object representing a user.
 * @typedef {Object} User
 * @property {string} userId - User ID
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} phone - User phone
 * @property {string} language - User language
 * @property {string} country - User country
 * @property {Object} attributes - User attributes
 */

/**
 * Cache object for storing ResyncBase application configurations.
 * @typedef {Object} ResyncCacheData
 * @property {Object} configs - Application configuration object
 * @property {Experiment[]} experiments - Array of A/B test experiments
 * @property {ContentView[]} content - Array of content views
 * @property {string} [lastFetchTimestamp] - ISO timestamp of last fetch
 * @property {string} [sessionId] - Current session ID
 * @property {string} [userId] - Current user ID
 * @property {Map<string, Object>} [userVariants] - User variant assignments
 * @property {Object} [userEvents] - User event assignments
 */

/**
 * Storage interface for cache persistence.
 * @typedef {Object} StorageInterface
 * @property {function(string): Promise<string|null>} getItem - Get item from storage
 * @property {function(string, string): Promise<void>} setItem - Set item in storage
 * @property {function(string): Promise<void>} removeItem - Remove item from storage
 * @property {function(): Promise<void>} clear - Clear all items from storage
 */

/**
 * @typedef {Object} AppConfigResponse
 * @property {Object} appConfig - The application configuration
 * @property {Experiment[]} experiments - A/B test experiments
 * @property {ContentView[]} content - Content
 * @property {User} [user] - User object
 * @property {UserVariantResponse} [userEvents] - User variant assignments
 */

/**
 * @typedef {Object} UserVariantRequest
 * @property {string} userId - The user ID
 * @property {string} sessionId - The session ID
 * @property {string[]} experimentIds - Array of experiment IDs
 * @property {string} appId - The application ID
 */

/**
 * @typedef {Object} UserVariantResponse
 * @property {Object} variants - User variant assignments
 * @property {string} userId - The user ID
 * @property {string} sessionId - The session ID
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} key - The API key for ResyncBase API
 * @property {number} appId - The application ID
 * @property {number} [ttl=3600000] - Time-to-live for cache in milliseconds
 * @property {Function} [callback] - Optional callback function when config is loaded
 * @property {StorageInterface} [storage] - Optional storage object for caching
 */

/**
 * @typedef {Object} AppConfig
 * @property {Object} configs - Application configuration
 * @property {Array} experiments - A/B test experiments
 * @property {Array} [content] - Content views
 */

/**
 * @typedef {Object} UserVariant
 * @property {string} experimentId - The experiment ID
 * @property {Object} variant - The assigned variant
 * @property {string} sessionId - The session ID
 * @property {string} userId - The user ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} client - The client identifier
 * @property {Object} metadata - Additional metadata
 */