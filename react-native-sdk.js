/**
 * ResyncBase React Native SDK
 * A lightweight SDK for rendering dynamic content views in React Native apps
 */

class ResyncBaseSDK {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.resyncbase.com';
    this.apiKey = config.apiKey;
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch a content view from the API
   * @param {string} contentViewId - The ID of the content view to fetch
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Object>} The content view data with sections
   */
  async fetchContentView(contentViewId, useCache = true) {
    const cacheKey = `content-view-${contentViewId}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/content-management/public/${contentViewId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content view: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform legacy data structure to new section-based structure if needed
      if (data.elements && !data.sections) {
        data.sections = [{
          id: 1,
          name: 'Main Content',
          containerStyles: {
            layout: 'column',
            alignment: 'flex-start',
            gap: 16,
            padding: 16,
            borderRadius: 8,
            backgroundColor: '#ffffff',
            flexWrap: 'nowrap'
          },
          elements: data.elements,
          order: 0,
          contentViewId: data.id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }];
        delete data.elements;
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching content view:', error);
      throw error;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
        this.cache.delete(key);
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }

  /**
   * Fetch all content views for an app
   * @param {string} appId - The app ID
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Array>} Array of content views
   */
  async fetchContentViews(appId, useCache = true) {
    const cacheKey = `content-views-${appId}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/content-management/public/app/${appId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content views: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform legacy data structure if needed
      data.forEach(contentView => {
        if (contentView.elements && !contentView.sections) {
          contentView.sections = [{
            id: 1,
            name: 'Main Content',
            containerStyles: {
              layout: 'column',
              alignment: 'flex-start',
              gap: 16,
              padding: 16,
              borderRadius: 8,
              backgroundColor: '#ffffff',
              flexWrap: 'nowrap'
            },
            elements: contentView.elements,
            order: 0,
            contentViewId: contentView.id,
            createdAt: contentView.createdAt,
            updatedAt: contentView.updatedAt
          }];
          delete contentView.elements;
        }
      });
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching content views:', error);
      throw error;
    }
  }

  /**
   * Get default container styles for a new section
   * @returns {Object} Default container styles
   */
  getDefaultContainerStyles() {
    return {
      layout: 'column',
      alignment: 'flex-start',
      gap: 16,
      padding: 16,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      flexWrap: 'nowrap'
    };
  }

  /**
   * Create a new section with default styles
   * @param {string} name - Section name
   * @param {number} order - Section order
   * @returns {Object} New section object
   */
  createSection(name, order = 0) {
    return {
      name,
      containerStyles: this.getDefaultContainerStyles(),
      elements: [],
      order
    };
  }

  /**
   * Get version history for a content view
   * @param {string} contentViewId - The content view ID
   * @returns {Promise<Array>} Array of versions
   */
  async getVersionHistory(contentViewId) {
    try {
      const response = await fetch(`${this.baseUrl}/content-version/1/${contentViewId}/versions`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version history: ${response.status}`);
      }

      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw error;
    }
  }

  /**
   * Get a specific version by number
   * @param {string} contentViewId - The content view ID
   * @param {number} versionNumber - The version number
   * @returns {Promise<Object>} Version data
   */
  async getVersionByNumber(contentViewId, versionNumber) {
    try {
      const response = await fetch(`${this.baseUrl}/content-version/1/${contentViewId}/${versionNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version ${versionNumber}: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching version:', error);
      throw error;
    }
  }

  /**
   * Compare two versions
   * @param {string} contentViewId - The content view ID
   * @param {number} version1 - First version number
   * @param {number} version2 - Second version number
   * @returns {Promise<Object>} Comparison data
   */
  async compareVersions(contentViewId, version1, version2) {
    try {
      const response = await fetch(`${this.baseUrl}/content-version/1/${contentViewId}/compare/${version1}/${version2}`);
      
      if (!response.ok) {
        throw new Error(`Failed to compare versions: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw error;
    }
  }

  /**
   * Get version statistics
   * @param {string} contentViewId - The content view ID
   * @returns {Promise<Object>} Version statistics
   */
  async getVersionStats(contentViewId) {
    try {
      const response = await fetch(`${this.baseUrl}/content-version/1/${contentViewId}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version stats: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching version stats:', error);
      throw error;
    }
  }
}

/**
 * React Native Component Renderer
 * Renders content views with text, buttons, and icons
 */
class ReactNativeRenderer {
  constructor(sdk) {
    this.sdk = sdk;
  }

  /**
   * Render a content view
   * @param {Object} contentView - The content view data
   * @param {Object} options - Rendering options
   * @returns {Object} React Native component tree
   */
  renderContentView(contentView, options = {}) {
    if (!contentView || !contentView.sections) {
      return null;
    }

    const {
      onElementPress,
      customStyles = {},
      theme = 'default'
    } = options;

    // Sort sections by order
    const sortedSections = contentView.sections
      .sort((a, b) => a.order - b.order);

    return {
      type: 'View',
      props: {
        style: {
          flex: 1,
          backgroundColor: '#ffffff',
          ...customStyles.container
        }
      },
      children: sortedSections.map(section => 
        this.renderSection(section, { onElementPress, customStyles, theme })
      )
    };
  }

  /**
   * Render a section with container styles
   * @param {Object} section - The section data
   * @param {Object} options - Rendering options
   * @returns {Object} React Native component
   */
  renderSection(section, options = {}) {
    const { onElementPress, customStyles, theme } = options;
    const containerStyles = section.containerStyles || {};
    
    // Sort elements by order
    const sortedElements = (section.elements || [])
      .filter(element => element.isVisible)
      .sort((a, b) => a.order - b.order);

    // Apply container styles
    const sectionStyle = {
      flexDirection: containerStyles.layout === 'column' ? 'column' : 'row',
      justifyContent: containerStyles.alignment || 'flex-start',
      alignItems: containerStyles.alignment === 'center' ? 'center' : 'flex-start',
      gap: containerStyles.gap || 16,
      padding: containerStyles.padding || 16,
      backgroundColor: containerStyles.backgroundColor || '#ffffff',
      borderRadius: containerStyles.borderRadius || 0,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      flexWrap: containerStyles.flexWrap || 'nowrap',
      maxWidth: containerStyles.maxWidth || undefined,
      ...customStyles.section
    };

    return {
      type: 'View',
      props: {
        key: section.id,
        style: sectionStyle
      },
      children: sortedElements.map(element => 
        this.renderElement(element, { onElementPress, customStyles, theme })
      )
    };
  }

  /**
   * Render an individual element
   * @param {Object} element - The element data
   * @param {Object} options - Rendering options
   * @returns {Object} React Native component
   */
  renderElement(element, options = {}) {
    const { onElementPress, customStyles, theme } = options;
    const styles = element.styles || {};
    const properties = element.properties || {};

    const baseStyle = {
      margin: styles.margin || 4,
      padding: styles.padding || 8,
      borderRadius: styles.borderRadius || 0,
      borderWidth: styles.borderWidth || 0,
      borderColor: styles.borderColor || 'transparent',
      width: styles.width || 'auto',
      height: styles.height || 'auto',
      ...customStyles[element.type]
    };

    switch (element.type) {
      case 'text':
        return this.renderTextElement(element, baseStyle, options);
      
      case 'button':
        return this.renderButtonElement(element, baseStyle, options);
      
      case 'icon':
        return this.renderIconElement(element, baseStyle, options);
      
      default:
        console.warn(`Unknown element type: ${element.type}`);
        return null;
    }
  }

  /**
   * Get section container styles as React Native styles
   * @param {Object} containerStyles - Container styles from the section
   * @returns {Object} React Native style object
   */
  getSectionContainerStyles(containerStyles = {}) {
    return {
      flexDirection: containerStyles.layout === 'column' ? 'column' : 'row',
      justifyContent: containerStyles.alignment || 'flex-start',
      alignItems: containerStyles.alignment === 'center' ? 'center' : 'flex-start',
      gap: containerStyles.gap || 16,
      padding: containerStyles.padding || 16,
      backgroundColor: containerStyles.backgroundColor || '#ffffff',
      borderRadius: containerStyles.borderRadius || 0,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      flexWrap: containerStyles.flexWrap || 'nowrap',
      maxWidth: containerStyles.maxWidth || undefined,
    };
  }

  /**
   * Validate section data structure
   * @param {Object} section - Section data to validate
   * @returns {boolean} Whether the section is valid
   */
  validateSection(section) {
    return section && 
           section.id && 
           section.name && 
           section.containerStyles && 
           Array.isArray(section.elements);
  }

  /**
   * Get section statistics
   * @param {Object} section - Section data
   * @returns {Object} Section statistics
   */
  getSectionStats(section) {
    if (!this.validateSection(section)) {
      return { valid: false, elementCount: 0, visibleElements: 0 };
    }

    const visibleElements = section.elements.filter(element => element.isVisible);
    
    return {
      valid: true,
      elementCount: section.elements.length,
      visibleElements: visibleElements.length,
      hasContainerStyles: !!section.containerStyles,
      layout: section.containerStyles?.layout || 'unknown'
    };
  }

  /**
   * Render a text element
   */
  renderTextElement(element, baseStyle, options) {
    const styles = element.styles || {};
    
    return {
      type: 'Text',
      props: {
        style: {
          ...baseStyle,
          fontSize: styles.fontSize || 16,
          fontWeight: styles.fontWeight || 'normal',
          color: styles.color || '#000000',
          backgroundColor: styles.backgroundColor || 'transparent',
          textAlign: styles.textAlign || 'left'
        },
        onPress: () => {
          if (options.onElementPress) {
            options.onElementPress(element, 'text');
          }
        }
      },
      children: element.content || 'Sample Text'
    };
  }

  /**
   * Render a button element
   */
  renderButtonElement(element, baseStyle, options) {
    const styles = element.styles || {};
    const properties = element.properties || {};
    
    return {
      type: 'TouchableOpacity',
      props: {
        style: {
          ...baseStyle,
          backgroundColor: styles.backgroundColor || '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 44
        },
        onPress: () => {
          if (options.onElementPress) {
            options.onElementPress(element, 'button', properties.buttonAction);
          }
        },
        activeOpacity: 0.7
      },
      children: {
        type: 'Text',
        props: {
          style: {
            fontSize: styles.fontSize || 16,
            fontWeight: styles.fontWeight || '600',
            color: styles.color || '#FFFFFF',
            textAlign: 'center'
          }
        },
        children: properties.buttonText || 'Button'
      }
    };
  }

  /**
   * Render an icon element
   */
  renderIconElement(element, baseStyle, options) {
    const styles = element.styles || {};
    const properties = element.properties || {};
    
    // Determine icon size
    const iconSize = properties.iconSize || styles.fontSize || 24;
    const containerSize = iconSize + 16;
    
    if (properties.customSvg) {
      // Render custom SVG
      return {
        type: 'TouchableOpacity',
        props: {
          style: {
            ...baseStyle,
            backgroundColor: styles.backgroundColor || 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            width: containerSize,
            height: containerSize
          },
          onPress: () => {
            if (options.onElementPress) {
              options.onElementPress(element, 'icon');
            }
          },
          activeOpacity: 0.7
        },
        children: {
          type: 'View',
          props: {
            style: {
              width: iconSize,
              height: iconSize,
              justifyContent: 'center',
              alignItems: 'center'
            }
          },
          children: {
            type: 'Text',
            props: {
              style: {
                fontSize: iconSize * 0.8,
                color: properties.iconColor || styles.color || '#000000',
                textAlign: 'center'
              }
            },
            children: 'SVG' // Placeholder for SVG rendering
          }
        }
      };
    } else {
      // Render icon library icon
      return {
        type: 'TouchableOpacity',
        props: {
          style: {
            ...baseStyle,
            backgroundColor: styles.backgroundColor || 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            width: containerSize,
            height: containerSize
          },
          onPress: () => {
            if (options.onElementPress) {
              options.onElementPress(element, 'icon');
            }
          },
          activeOpacity: 0.7
        },
        children: {
          type: 'Text',
          props: {
            style: {
              fontSize: iconSize,
              color: properties.iconColor || styles.color || '#000000',
              textAlign: 'center'
            }
          },
          children: properties.iconName ? properties.iconName.charAt(0).toUpperCase() : 'I'
        }
      };
    }
  }
}

/**
 * Hook for using ResyncBase content in React Native
 * @param {string} contentViewId - The ID of the content view to fetch
 * @param {Object} options - Options for fetching and rendering
 * @returns {Object} Hook state and methods
 */
function useResyncBaseContent(contentViewId, options = {}) {
  const [state, setState] = React.useState({
    loading: false,
    error: null,
    data: null,
    lastUpdated: null
  });

  const sdk = React.useMemo(() => new ResyncBaseSDK(options.sdkConfig), [options.sdkConfig]);
  const renderer = React.useMemo(() => new ReactNativeRenderer(sdk), [sdk]);

  const fetchContent = React.useCallback(async (useCache = true) => {
    if (!contentViewId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await sdk.fetchContentView(contentViewId, useCache);
      setState({
        loading: false,
        error: null,
        data,
        lastUpdated: new Date()
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        data: null,
        lastUpdated: null
      });
    }
  }, [contentViewId, sdk]);

  const refresh = React.useCallback(() => {
    fetchContent(false);
  }, [fetchContent]);

  const clearCache = React.useCallback(() => {
    sdk.clearCache();
  }, [sdk]);

  React.useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const renderedContent = React.useMemo(() => {
    if (!state.data) return null;
    return renderer.renderContentView(state.data, options.renderOptions);
  }, [state.data, renderer, options.renderOptions]);

  return {
    ...state,
    renderedContent,
    refresh,
    clearCache,
    sdk
  };
}

// Export the main classes and hook
module.exports = {
  ResyncBaseSDK,
  ReactNativeRenderer,
  useResyncBaseContent
};

// Also export for ES modules
if (typeof exports !== 'undefined') {
  exports.ResyncBaseSDK = ResyncBaseSDK;
  exports.ReactNativeRenderer = ReactNativeRenderer;
  exports.useResyncBaseContent = useResyncBaseContent;
}
