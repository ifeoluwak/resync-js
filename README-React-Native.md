# ResyncBase React Native SDK

A lightweight and powerful SDK for rendering dynamic content views in React Native applications. Create content once in the dashboard and render it consistently across all your mobile apps.

## Features

- 🚀 **Lightweight**: Minimal bundle size impact
- 🎨 **Flexible Styling**: Full control over element appearance
- 📱 **React Native Native**: Built specifically for React Native
- 🔄 **Caching**: Intelligent caching for better performance
- 🎯 **Type Safe**: Full TypeScript support
- 🛠️ **Customizable**: Easy to extend and customize

## Installation

```bash
npm install resyncbase-react-native-sdk
# or
yarn add resyncbase-react-native-sdk
```

## Quick Start

### 1. Basic Usage

```jsx
import React from 'react';
import { View } from 'react-native';
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <ResyncBaseContentView
        contentViewId="your-content-view-id"
        sdkConfig={{
          baseUrl: 'https://api.resyncbase.com',
          apiKey: 'your-api-key'
        }}
        onElementPress={(element, type, action) => {
          console.log(`${type} element pressed:`, element.name);
        }}
      />
    </View>
  );
};
```

### 2. Advanced Usage with Custom Styling

```jsx
import React from 'react';
import { View } from 'react-native';
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const App = () => {
  const renderOptions = {
    text: {
      margin: 8,
      padding: 12,
      backgroundColor: '#f5f5f5'
    },
    button: {
      margin: 12,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    icon: {
      margin: 8,
      padding: 16
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ResyncBaseContentView
        contentViewId="your-content-view-id"
        sdkConfig={{
          baseUrl: 'https://api.resyncbase.com',
          apiKey: 'your-api-key'
        }}
        renderOptions={renderOptions}
        onElementPress={(element, type, action) => {
          // Handle element interactions
          switch (type) {
            case 'button':
              if (action === 'navigate') {
                // Navigate to another screen
                navigation.navigate('Home');
              }
              break;
            case 'text':
              // Handle text element press
              break;
            case 'icon':
              // Handle icon press
              break;
          }
        }}
        onLoad={(data) => {
          console.log('Content loaded:', data);
        }}
        onError={(error) => {
          console.error('Content error:', error);
        }}
      />
    </View>
  );
};
```

### 3. Custom Loading and Error States

```jsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const CustomLoadingComponent = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 16, fontSize: 16 }}>Loading your content...</Text>
  </View>
);

const CustomErrorComponent = ({ error, onRetry }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, color: '#FF3B30', marginBottom: 20 }}>
      Oops! Something went wrong
    </Text>
    <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
      {error}
    </Text>
    <TouchableOpacity
      style={{
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
      }}
      onPress={onRetry}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
        Try Again
      </Text>
    </TouchableOpacity>
  </View>
);

const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <ResyncBaseContentView
        contentViewId="your-content-view-id"
        sdkConfig={{
          baseUrl: 'https://api.resyncbase.com',
          apiKey: 'your-api-key'
        }}
        loadingComponent={<CustomLoadingComponent />}
        errorComponent={<CustomErrorComponent />}
      />
    </View>
  );
};
```

## API Reference

### ResyncBaseContentView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `contentViewId` | `string` | **Required** | The ID of the content view to render |
| `sdkConfig` | `object` | `{}` | Configuration for the SDK |
| `renderOptions` | `object` | `{}` | Custom styling options for elements |
| `onElementPress` | `function` | `null` | Callback when elements are pressed |
| `onError` | `function` | `null` | Callback when errors occur |
| `onLoad` | `function` | `null` | Callback when content loads successfully |
| `style` | `StyleProp` | `null` | Additional styles for the container |
| `loadingComponent` | `ReactNode` | `null` | Custom loading component |
| `errorComponent` | `ReactNode` | `null` | Custom error component |
| `emptyComponent` | `ReactNode` | `null` | Custom empty state component |

### SDK Configuration

```jsx
const sdkConfig = {
  baseUrl: 'https://api.resyncbase.com',     // Your API base URL
  apiKey: 'your-api-key',                   // Your API key
  cacheTimeout: 5 * 60 * 1000,              // Cache timeout in milliseconds (5 minutes)
};
```

### Render Options

```jsx
const renderOptions = {
  text: {
    // Custom styles for text elements
    margin: 8,
    padding: 12,
    backgroundColor: '#f5f5f5'
  },
  button: {
    // Custom styles for button elements
    margin: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  icon: {
    // Custom styles for icon elements
    margin: 8,
    padding: 16
  }
};
```

### Element Press Handler

```jsx
const handleElementPress = (element, type, action) => {
  console.log('Element pressed:', {
    name: element.name,
    type: type,
    action: action,
    properties: element.properties
  });

  // Handle different element types
  switch (type) {
    case 'button':
      if (action === 'navigate') {
        navigation.navigate('Home');
      } else if (action === 'openUrl') {
        Linking.openURL('https://example.com');
      }
      break;
    
    case 'text':
      // Handle text element press
      break;
    
    case 'icon':
      // Handle icon press
      break;
  }
};
```

## Content Element Types

### Text Element
- **Type**: `text`
- **Properties**: `content` (text content)
- **Styles**: `fontSize`, `fontWeight`, `color`, `backgroundColor`, etc.

### Button Element
- **Type**: `button`
- **Properties**: `buttonText`, `buttonAction`
- **Styles**: `backgroundColor`, `borderRadius`, `padding`, etc.

### Icon Element
- **Type**: `icon`
- **Properties**: `iconName`
- **Styles**: `fontSize`, `color`, `backgroundColor`, etc.

## Styling

The SDK supports comprehensive styling options for all element types:

### Common Styles
- `fontSize`: Font size in pixels
- `fontWeight`: Font weight (normal, bold, 100-900)
- `color`: Text color
- `backgroundColor`: Background color
- `padding`: Padding in pixels
- `margin`: Margin in pixels
- `borderRadius`: Border radius in pixels
- `borderWidth`: Border width in pixels
- `borderColor`: Border color
- `width`: Element width
- `height`: Element height
- `textAlign`: Text alignment (left, center, right, justify)

### Custom Styles
You can add custom styles using the `customStyles` property in the dashboard, which will be applied directly to the element.

## Performance

### Caching
The SDK includes intelligent caching to improve performance:
- Content is cached for 5 minutes by default
- Cache timeout is configurable
- Automatic cache cleanup for expired entries

### Optimization Tips
1. **Use appropriate cache timeouts** for your content update frequency
2. **Implement custom loading states** for better UX
3. **Handle errors gracefully** with custom error components
4. **Use render options** for consistent styling across your app

## Error Handling

The SDK provides comprehensive error handling:

```jsx
<ResyncBaseContentView
  contentViewId="your-content-view-id"
  onError={(error) => {
    // Log error for debugging
    console.error('Content error:', error);
    
    // Show user-friendly error message
    Alert.alert('Error', 'Failed to load content. Please try again.');
    
    // Report to analytics
    analytics.track('content_load_error', { error: error.message });
  }}
/>
```

## Examples

### Navigation Integration

```jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => (
  <ResyncBaseContentView
    contentViewId="home-content"
    sdkConfig={{ baseUrl: 'https://api.resyncbase.com' }}
    onElementPress={(element, type, action) => {
      if (type === 'button' && action === 'navigate') {
        navigation.navigate('Detail');
      }
    }}
  />
);

const DetailScreen = () => (
  <ResyncBaseContentView
    contentViewId="detail-content"
    sdkConfig={{ baseUrl: 'https://api.resyncbase.com' }}
  />
);

const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

### Theme Integration

```jsx
import React from 'react';
import { useColorScheme } from 'react-native';
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeStyles = {
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'
    },
    button: {
      backgroundColor: isDark ? '#0A84FF' : '#007AFF',
      color: '#FFFFFF'
    },
    icon: {
      color: isDark ? '#FFFFFF' : '#000000'
    }
  };

  return (
    <ResyncBaseContentView
      contentViewId="your-content-view-id"
      sdkConfig={{ baseUrl: 'https://api.resyncbase.com' }}
      renderOptions={themeStyles}
    />
  );
};
```

## Troubleshooting

### Common Issues

1. **Content not loading**
   - Check your `contentViewId` is correct
   - Verify your API base URL and key
   - Ensure the content view is published

2. **Styling not applied**
   - Check that styles are properly configured in the dashboard
   - Verify `renderOptions` are correctly formatted
   - Ensure element types match expected values

3. **Performance issues**
   - Adjust cache timeout settings
   - Implement custom loading states
   - Use appropriate element counts

### Debug Mode

Enable debug logging:

```jsx
const sdkConfig = {
  baseUrl: 'https://api.resyncbase.com',
  apiKey: 'your-api-key',
  debug: true // Enable debug logging
};
```

## Support

For support and questions:
- 📧 Email: support@resyncbase.com
- 📚 Documentation: https://docs.resyncbase.com
- 🐛 Issues: https://github.com/resyncbase/react-native-sdk/issues

## License

MIT License - see [LICENSE](LICENSE) file for details.

