import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { ResyncBaseSDK, ReactNativeRenderer } from './react-native-sdk';

/**
 * ResyncBase Content View Component
 * Renders dynamic content views in React Native apps
 */
const ResyncBaseContentView = ({
  contentViewId,
  sdkConfig = {},
  renderOptions = {},
  onElementPress,
  onError,
  onLoad,
  style,
  loadingComponent,
  errorComponent,
  emptyComponent
}) => {
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    data: null,
    lastUpdated: null
  });

  const sdk = React.useMemo(() => new ResyncBaseSDK(sdkConfig), [sdkConfig]);
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
      
      if (onLoad) {
        onLoad(data);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load content';
      setState({
        loading: false,
        error: errorMessage,
        data: null,
        lastUpdated: null
      });
      
      if (onError) {
        onError(error);
      }
    }
  }, [contentViewId, sdk, onLoad, onError]);

  const refresh = React.useCallback(() => {
    fetchContent(false);
  }, [fetchContent]);

  const clearCache = React.useCallback(() => {
    sdk.clearCache();
  }, [sdk]);

  React.useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleElementPress = React.useCallback((element, type, action) => {
    if (onElementPress) {
      onElementPress(element, type, action);
    } else {
      // Default handling
      switch (type) {
        case 'button':
          if (action) {
            Alert.alert('Button Action', `Action: ${action}`);
          }
          break;
        case 'text':
        case 'icon':
          Alert.alert('Element Pressed', `${type} element: ${element.name}`);
          break;
      }
    }
  }, [onElementPress]);

  // Render loading state
  if (state.loading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  // Render error state
  if (state.error) {
    if (errorComponent) {
      return errorComponent;
    }
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>Error: {state.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render empty state
  if (!state.data || !state.data.sections || state.data.sections.length === 0) {
    if (emptyComponent) {
      return emptyComponent;
    }
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No content to display</Text>
      </View>
    );
  }

  // Render content
  const renderSection = (section) => {
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
      marginBottom: 16,
    };

    return (
      <View key={section.id} style={sectionStyle}>
        {sortedElements.map(renderElement)}
      </View>
    );
  };

  const renderElement = (element) => {
    if (!element.isVisible) return null;

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
      ...renderOptions[element.type]
    };

    switch (element.type) {
      case 'text':
        return (
          <View key={element.id} style={[baseStyle, styles.customStyles]}>
            <Text
              style={[
                styles.text,
                {
                  fontSize: styles.fontSize || 16,
                  fontWeight: styles.fontWeight || 'normal',
                  color: styles.color || '#000000',
                  backgroundColor: styles.backgroundColor || 'transparent',
                  textAlign: styles.textAlign || 'left'
                }
              ]}
              onPress={() => handleElementPress(element, 'text')}
            >
              {element.content || 'Sample Text'}
            </Text>
          </View>
        );

      case 'button':
        return (
          <TouchableOpacity
            key={element.id}
            style={[
              baseStyle,
              {
                backgroundColor: styles.backgroundColor || '#007AFF',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 44
              },
              styles.customStyles
            ]}
            onPress={() => handleElementPress(element, 'button', properties.buttonAction)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  fontSize: styles.fontSize || 16,
                  fontWeight: styles.fontWeight || '600',
                  color: styles.color || '#FFFFFF',
                  textAlign: 'center'
                }
              ]}
            >
              {properties.buttonText || 'Button'}
            </Text>
          </TouchableOpacity>
        );

      case 'icon':
        // Determine icon size
        const iconSize = properties.iconSize || styles.fontSize || 24;
        const containerSize = iconSize + 16;
        
        if (properties.customSvg) {
          // Render custom SVG (placeholder for now)
          return (
            <TouchableOpacity
              key={element.id}
              style={[
                baseStyle,
                {
                  backgroundColor: styles.backgroundColor || 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: containerSize,
                  height: containerSize
                },
                styles.customStyles
              ]}
              onPress={() => handleElementPress(element, 'icon')}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: iconSize,
                  height: iconSize,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text
                  style={[
                    styles.iconText,
                    {
                      fontSize: iconSize * 0.8,
                      color: properties.iconColor || styles.color || '#000000',
                      textAlign: 'center'
                    }
                  ]}
                >
                  SVG
                </Text>
              </View>
            </TouchableOpacity>
          );
        } else {
          // Render icon library icon
          return (
            <TouchableOpacity
              key={element.id}
              style={[
                baseStyle,
                {
                  backgroundColor: styles.backgroundColor || 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: containerSize,
                  height: containerSize
                },
                styles.customStyles
              ]}
              onPress={() => handleElementPress(element, 'icon')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.iconText,
                  {
                    fontSize: iconSize,
                    color: properties.iconColor || styles.color || '#000000',
                    textAlign: 'center'
                  }
                ]}
              >
                {properties.iconName ? properties.iconName.charAt(0).toUpperCase() : 'I'}
              </Text>
            </TouchableOpacity>
          );
        }

      default:
        console.warn(`Unknown element type: ${element.type}`);
        return null;
    }
  };

  // Sort sections by order
  const sortedSections = state.data.sections
    .sort((a, b) => a.order - b.order);

  return (
    <View style={[styles.container, style]}>
      {sortedSections.map(renderSection)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  emptyText: {
    fontSize: 16,
    color: '#666666'
  },
  text: {
    fontSize: 16
  },
  buttonText: {
    fontSize: 16
  },
  iconText: {
    fontSize: 24
  }
});

export default ResyncBaseContentView;
