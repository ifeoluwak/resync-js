# Resync JavaScript

A powerful JavaScript library for dynamic content management, remote configuration, and A/B testing. Resync allows you to manage app configurations, run experiments, and deliver dynamic content without app updates. Works seamlessly across JavaScript, React Native, and Expo applications.

## Features

- 🚀 **Remote Configuration** - Manage app configs remotely without code deployments
- 🧪 **A/B Testing** - Run experiments with automatic variant assignment and tracking
- 🎨 **Dynamic Content Management** - Fetch and render content views defined in your Resync dashboard
- 📊 **Event Logging** - Track custom events and user interactions
- 💾 **Smart Caching** - Automatic environment-based caching (6h production, 0ms development)
- 🔄 **Real-time Updates** - Subscribe to configuration changes with callback support
- 📱 **Cross-Platform** - Works with vanilla JavaScript, React Native, and Expo
- 🔧 **TypeScript Support** - Full TypeScript definitions included
- 🎯 **User Targeting** - Set user attributes for personalized experiences

## Installation

```sh
npm install resync
# or
yarn add resync
```

## Quick Start

### 1. Initialize Resync

```javascript
import Resync from 'resync';

// Initialize Resync with your API credentials
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  callback: async (config) => {
    console.log('Resync initialized with config:', config);
  },
  storage: localStorage, // or AsyncStorage for React Native
  environment: 'production',
});
```

### 2. Get Remote Configuration

```javascript
// Get a specific config value
const featureEnabled = Resync.getConfig('FEATURE_FLAG');
const apiEndpoint = Resync.getConfig('API_ENDPOINT');

console.log('Feature enabled:', featureEnabled);
```

### 3. Campaign

```javascript
// Get variant for an Campaign experiment
const variant = await Resync.getVariant('homepage_experiment');

if (variant === 'variant_a') {
  // Show variant A
} else {
  // Show variant B
}
```

### 4. Event Logging

```javascript
// Log custom events
Resync.logEvent({
  eventId: 'evt_button_clicked',
  metadata: {
    buttonName: 'signup',
    screen: 'homepage',
  },
});
```

### 5. Get Content Views

```javascript
// Fetch all content views
const contentViews = Resync.getContent();

// Find a specific content view by name
const welcomeCard = contentViews.find(
  (view) => view.name === 'HomeWelcomeCard'
);

console.log('Welcome card content:', welcomeCard);
```

## API Reference

### Resync.init(options)

Initialize the Resync SDK. Must be called before using any other methods.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | ✅ | Your Resync API key |
| `appId` | `number` | ✅ | Your application ID |
| `callback` | `() => void` | ❌ | Callback function invoked when config is loaded |
| `storage` | `Storage` | ✅ | Storage object for caching (localStorage, AsyncStorage, etc.) |
| `environment` | `sandbox` | `production` | ✅ | Environment for your project |

#### Returns

`Promise<void>` - Returns the Resync instance

#### Example

```javascript
await Resync.init({
  key: 'rsk_live_abc123',
  appId: 7,
  callback: () => {
    console.log('Config loaded:');
  },
  storage: localStorage,
  environment: 'sandbox'
});
```

---

### Resync.getConfig(key)

Get a configuration value by key.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | ✅ | Configuration key to retrieve |

#### Returns

`any` - The configuration value

#### Example

```javascript
const apiUrl = Resync.getConfig('API_BASE_URL');
const maxRetries = Resync.getConfig('MAX_RETRIES');
const features = Resync.getConfig('ENABLED_FEATURES');

console.log('API URL:', apiUrl);
console.log('Max retries:', maxRetries);
```

---

### Resync.getVariant(campaignName)

Get the assigned variant for an A/B test experiment.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campaignName` | `string` | ✅ | Name of the A/B test campaign |

#### Returns

`Promise<number | null>` - Returns the variant content view ID or null

#### Example

```javascript
const variant = await Resync.getVariant('checkout_flow_test');

if (variant === 123) {
  // Show variant A (content view ID 123)
  renderCheckoutVariantA();
} else if (variant === 124) {
  // Show variant B (content view ID 124)
  renderCheckoutVariantB();
}
```

---

### Resync.getContent()

Get all content views from the current configuration.

#### Returns

`ContentView[]` - Array of content views

#### Example

```javascript
const contentViews = Resync.getContent();

// Find specific content view
const bannerContent = contentViews.find(
  (view) => view.name === 'PromoAnnouncement'
);

// Iterate through all published content
contentViews
  .filter((view) => view.status === 'published')
  .forEach((view) => {
    console.log(`Content view: ${view.name}`);
  });
```

---

### Resync.setUserId(userId, metadata)

Set the user ID for tracking and personalized variant assignment.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string \| number` | ✅ | Unique user identifier |
| `metadata` | `object` | ❌ | User metadata (email, name, phone, language) |

#### Returns

`Promise<boolean>` - Returns true if successful

#### Example

```javascript
// Simple user ID
await Resync.setUserId('user_12345');

// With metadata
await Resync.setUserId('user_12345', {
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  language: 'en',
});
```

---

### Resync.setUserAttributes(attributes)

Set user attributes for targeting and personalization.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attributes` | `object` | ✅ | User attributes object |
| `attributes.email` | `string` | ❌ | User email |
| `attributes.name` | `string` | ❌ | User name |
| `attributes.phone` | `string` | ❌ | User phone |
| `attributes.language` | `string` | ❌ | User language |
| `attributes.attributes` | `object` | ❌ | Additional custom attributes |

#### Returns

`Promise<boolean>` - Returns true if successful

#### Example

```javascript
await Resync.setUserAttributes({
  email: 'user@example.com',
  name: 'Jane Smith',
  phone: '+1234567890',
  language: 'en',
  attributes: {
    subscriptionTier: 'premium',
    country: 'US',
    signupDate: '2025-01-15',
  },
});
```

---

### Resync.setClient(client)

Set a client identifier for tracking purposes.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client` | `string` | ✅ | Client identifier (e.g., 'web', 'mobile', 'ios', 'android') |

#### Example

```javascript
Resync.setClient('web');
// or
Resync.setClient('mobile-ios');
```

---

### Resync.logEvent(event)

Log a custom event for analytics and tracking.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | `object` | ✅ | Event object |
| `event.eventId` | `string` | ✅ | Event identifier |
| `event.logId` | `string` | ❌ | External log ID for correlation |
| `event.metadata` | `object` | ❌ | Additional event metadata |

#### Example

```javascript
// Simple event
Resync.logEvent({
  eventId: 'evt_user_signup',
});

// Event with metadata
Resync.logEvent({
  eventId: 'evt_purchase_completed',
  logId: 'order_789',
  metadata: {
    amount: 99.99,
    currency: 'USD',
    productId: 'prod_123',
    quantity: 2,
  },
});
```

---

### Resync.submitForm(formData)

Submit form data to the Resync backend.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `formData` | `object` | ✅ | Form submission object |
| `formData.contentViewId` | `number` | ✅ | Content view ID of the form |
| `formData.data` | `object` | ✅ | Form field data |

#### Returns

`Promise<boolean | Error>` - Returns true if successful, Error otherwise

#### Example

```javascript
try {
  const success = await Resync.submitForm({
    contentViewId: 456,
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello!',
    },
  });

  if (success) {
    console.log('Form submitted successfully');
  }
} catch (error) {
  console.error('Form submission failed:', error);
}
```

---

### Resync.subscribe(callback)

Subscribe to configuration updates. The callback will be invoked whenever the configuration changes.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | `(config: AppConfig) => void` | ✅ | Callback function |

#### Example

```javascript
function handleConfigUpdate(config) {
  console.log('Config updated:', config);
  // Update UI or app state
}

Resync.subscribe(handleConfigUpdate);
```

---

### Resync.unsubscribe(callback)

Unsubscribe from configuration updates.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callback` | `(config: AppConfig) => void` | ✅ | Previously subscribed callback function |

#### Example

```javascript
Resync.unsubscribe(handleConfigUpdate);
```

## Advanced Usage

### Real-time Configuration Updates

Subscribe to configuration changes to update your app dynamically:

```javascript
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: localStorage,
  callback: () => {
    console.log('Initial config loaded:');
  },
});

// Subscribe to future updates
Resync.subscribe((config) => {
  console.log('Config updated!', config);
  // Update your app's state or UI
  updateAppSettings(config.appConfig);
});
```

### User Segmentation with A/B Tests

Combine user attributes with A/B testing for targeted experiments:

```javascript
// Set user attributes
await Resync.setUserId('user_123', {
  email: 'user@example.com',
  name: 'Alice',
});

await Resync.setUserAttributes({
  attributes: {
    userTier: 'premium',
    region: 'north-america',
  },
});

// Get variant (assignment may be based on attributes)
const variant = await Resync.getVariant('premium_feature_test');

if (variant) {
  // Show experiment variant
} else {
  // Show control
}
```

### Dynamic Feature Flags

Use remote config for feature flagging:

```javascript
// Check if a feature is enabled
const newUIEnabled = Resync.getConfig('ENABLE_NEW_UI');
const darkModeAvailable = Resync.getConfig('DARK_MODE_AVAILABLE');

if (newUIEnabled) {
  renderNewUI();
} else {
  renderLegacyUI();
}

// Get configuration objects
const apiSettings = Resync.getConfig('API_SETTINGS');
console.log('API timeout:', apiSettings?.timeout);
console.log('Max retries:', apiSettings?.maxRetries);
```

### Event Tracking Pipeline

Build a comprehensive event tracking system:

```javascript
// Track user journey
Resync.logEvent({
  eventId: 'evt_app_opened',
  metadata: { timestamp: Date.now() },
});

// Track interactions
document.getElementById('cta-button').addEventListener('click', () => {
  Resync.logEvent({
    eventId: 'evt_cta_clicked',
    metadata: {
      buttonId: 'cta-button',
      page: 'homepage',
    },
  });
});

// Track conversions
async function completePurchase(orderId, amount) {
  await processPayment();

  Resync.logEvent({
    eventId: 'evt_purchase_completed',
    logId: orderId,
    metadata: {
      amount,
      currency: 'USD',
      timestamp: Date.now(),
    },
  });
}
```

### Storage Adapters

Use different storage adapters based on your platform:

#### Browser (Web)

```javascript
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: localStorage, // or sessionStorage
});
```

#### React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: AsyncStorage,
});
```

#### Custom Storage Adapter

```javascript
// Implement your own storage adapter
const customStorage = {
  async getItem(key) {
    // Your implementation
  },
  async setItem(key, value) {
    // Your implementation
  },
  async removeItem(key) {
    // Your implementation
  },
  async clear() {
    // Your implementation
  },
};

await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: customStorage,
});
```

## TypeScript Support

The library includes comprehensive TypeScript definitions:

```typescript
import Resync, {
  InitOptions,
  AppConfig,
  ContentView,
  Experiment,
  ExperimentVariant,
  AppEvent,
  Storage,
} from 'resync';

// Type-safe initialization
const options: InitOptions = {
  key: 'your-api-key',
  appId: 7,
  callback: (config: AppConfig) => {
    console.log(config.appConfig);
  },
  storage: localStorage,
};

await Resync.init(options);

// Type-safe event logging
const event: AppEvent = {
  eventId: 'evt_user_action',
  metadata: {
    action: 'click',
    target: 'button',
  },
};

Resync.logEvent(event);
```

## Platform Support

- ✅ **JavaScript (ES6+)** - Modern JavaScript environments
- ✅ **React Native** - iOS and Android apps
- ✅ **Expo** - Managed and bare workflows
- ✅ **Node.js** - Server-side JavaScript (with compatible storage)
- ✅ **Web Browsers** - Chrome, Firefox, Safari, Edge

## Best Practices

### 1. Initialize Early

Initialize Resync as early as possible in your application lifecycle:

```javascript
// App entry point
import Resync from 'resync';

async function initializeApp() {
  await Resync.init({
    key: process.env.RESYNC_API_KEY,
    appId: parseInt(process.env.RESYNC_APP_ID),
    storage: localStorage,
  });

  // Continue app initialization
  startApp();
}

initializeApp();
```

**Note:** Cache TTL is automatically configured based on your environment:
- **Development**: No caching (always fetches fresh data for fast iteration)
- **Production**: 6 hours cache (optimal performance)

### 2. Handle Errors Gracefully

Always handle potential errors:

```javascript
try {
  await Resync.init({
    key: 'your-api-key',
    appId: 7,
    storage: localStorage,
  });
} catch (error) {
  console.error('Failed to initialize Resync:', error);
  // Fallback to default configuration
}
```

### 3. Use Environment Variables

Store API credentials securely:

```javascript
await Resync.init({
  key: process.env.RESYNC_API_KEY,
  appId: parseInt(process.env.RESYNC_APP_ID),
  storage: localStorage,
});
```

### 4. Automatic Cache Management

The SDK automatically manages caching based on your environment:

```javascript
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: localStorage,
});

// Cache TTL is set automatically:
// - Development: 0ms (no caching, always fresh)
// - Production: 6 hours (21600000ms)
```

### 5. Clean Up Subscriptions

Unsubscribe from updates when components unmount:

```javascript
function MyComponent() {
  useEffect(() => {
    const handleUpdate = (config) => {
      console.log('Config updated:', config);
    };

    Resync.subscribe(handleUpdate);

    return () => {
      Resync.unsubscribe(handleUpdate);
    };
  }, []);
}
```

## Troubleshooting

### API Key Issues

**Problem:** "API key is required" error

**Solution:** Ensure you're passing the API key during initialization:

```javascript
await Resync.init({
  key: 'rsk_live_your_api_key', // Make sure this is set
  appId: 7,
  storage: localStorage,
});
```

### Storage Issues

**Problem:** "Storage is required" error

**Solution:** Provide a valid storage object:

```javascript
// Web
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: localStorage, // Add storage
});

// React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: AsyncStorage, // Add storage
});
```

### Configuration Not Updating

**Problem:** Configuration values aren't updating in production

**Solution:** The cache TTL is automatically set based on environment:
- **Production**: 6 hours cache
- **Development**: No cache (always fresh)

If you need to force a refresh in production, clear the storage cache:

```javascript
// Clear cache to force fresh fetch
await localStorage.removeItem('resync_cache');

// Re-initialize
await Resync.init({
  key: 'your-api-key',
  appId: 7,
  storage: localStorage,
});
```

## Examples

Check out the [example](./demo-node.js) for a complete working example.

## License

MIT

---

Built with ❤️ for developers who ship fast

