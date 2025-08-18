import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import ResyncBaseContentView from './ResyncBaseContentView';

/**
 * Example React Native App using ResyncBase SDK
 * This demonstrates how to integrate dynamic content views
 */
const ExampleApp = () => {
  // Example content view ID - replace with your actual ID
  const contentViewId = 'example-content-view-id';
  
  // SDK configuration
  const sdkConfig = {
    baseUrl: 'https://api.resyncbase.com', // Replace with your API URL
    apiKey: 'your-api-key-here', // Replace with your API key
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  };

  // Custom styling for elements
  const renderOptions = {
    text: {
      margin: 8,
      padding: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
    },
    button: {
      margin: 12,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    icon: {
      margin: 8,
      padding: 16,
      backgroundColor: '#e9ecef',
      borderRadius: 20,
    },
  };

  // Handle element interactions
  const handleElementPress = (element, type, action) => {
    console.log('Element pressed:', {
      name: element.name,
      type: type,
      action: action,
      properties: element.properties
    });

    // Handle different element types and actions
    switch (type) {
      case 'button':
        handleButtonAction(action, element);
        break;
      
      case 'text':
        Alert.alert('Text Element', `You tapped: ${element.name}`);
        break;
      
      case 'icon':
        handleIconPress(element);
        break;
      
      default:
        console.log('Unknown element type:', type);
    }
  };

  // Handle button actions
  const handleButtonAction = (action, element) => {
    switch (action) {
      case 'navigate':
        Alert.alert('Navigation', 'Navigate to another screen');
        break;
      
      case 'openUrl':
        const url = element.properties?.url || 'https://example.com';
        Linking.openURL(url).catch(err => {
          Alert.alert('Error', 'Could not open URL');
        });
        break;
      
      case 'showAlert':
        Alert.alert('Button Action', element.properties?.buttonText || 'Button clicked!');
        break;
      
      default:
        Alert.alert('Button Pressed', `Action: ${action || 'No action specified'}`);
    }
  };

  // Handle icon interactions
  const handleIconPress = (element) => {
    const properties = element.properties || {};
    
    if (properties.customSvg) {
      Alert.alert('Custom SVG Icon', `Custom SVG icon: ${element.name}`);
    } else {
      Alert.alert('Icon Library Icon', 
        `Icon: ${properties.iconName || 'Unknown'}\n` +
        `Library: ${properties.iconLibrary || 'Unknown'}\n` +
        `Size: ${properties.iconSize || 'Default'}\n` +
        `Color: ${properties.iconColor || 'Default'}`
      );
    }
  };

  // Handle content load success
  const handleContentLoad = (data) => {
    console.log('Content loaded successfully:', data);
    Alert.alert('Success', `Loaded ${data.elements?.length || 0} elements`);
  };

  // Handle content load errors
  const handleContentError = (error) => {
    console.error('Content load error:', error);
    Alert.alert('Error', 'Failed to load content. Please check your connection.');
  };

  // Custom loading component
  const CustomLoadingComponent = () => (
    <View style={styles.customLoading}>
      <Text style={styles.loadingText}>🔄 Loading your content...</Text>
      <Text style={styles.loadingSubtext}>Please wait while we fetch the latest content</Text>
    </View>
  );

  // Custom error component
  const CustomErrorComponent = ({ error, onRetry }) => (
    <View style={styles.customError}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>🔄 Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Custom empty component
  const CustomEmptyComponent = () => (
    <View style={styles.customEmpty}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No content available</Text>
      <Text style={styles.emptyMessage}>
        This content view doesn't have any elements yet.
        Create some content in the dashboard first!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ResyncBase SDK Demo</Text>
          <Text style={styles.headerSubtitle}>
            Dynamic content rendering in React Native
          </Text>
        </View>

        {/* Content View */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Dynamic Content</Text>
          <Text style={styles.sectionDescription}>
            This content is loaded dynamically from the ResyncBase API
          </Text>
          
          <ResyncBaseContentView
            contentViewId={contentViewId}
            sdkConfig={sdkConfig}
            renderOptions={renderOptions}
            onElementPress={handleElementPress}
            onLoad={handleContentLoad}
            onError={handleContentError}
            loadingComponent={<CustomLoadingComponent />}
            errorComponent={<CustomErrorComponent />}
            emptyComponent={<CustomEmptyComponent />}
            style={styles.contentView}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionsText}>
            1. Create a content view in the ResyncBase dashboard{'\n'}
            2. Add text, button, and icon elements{'\n'}
            3. Style them with colors, fonts, and spacing{'\n'}
            4. Publish the content view{'\n'}
            5. Use the content view ID in this app{'\n'}
            6. Watch your content render dynamically!
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureText}>Rich styling options for all elements</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Responsive design for all screen sizes</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Intelligent caching for performance</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>Real-time content updates</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  contentView: {
    minHeight: 200,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  customLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  customError: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExampleApp;
