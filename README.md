# ResyncBase JavaScript SDK

[![npm version](https://badge.fury.io/js/resyncbase.svg)](https://badge.fury.io/js/resyncbase)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful JavaScript client library for **ResyncBase** - the modern configuration management and A/B testing platform. ResyncBase helps you manage dynamic content, run experiments, and deliver personalized experiences across web and mobile applications.

## ✨ Features

- 🚀 **Dynamic Configuration Management** - Update app behavior without deployments
- 🧪 **A/B Testing & Experiments** - Run controlled experiments with statistical significance
- 📱 **Content Management** - Dynamic content delivery and personalization
- 📊 **Analytics & Tracking** - Built-in event logging and conversion tracking
- 🔄 **Real-time Updates** - Subscribe to configuration changes
- 💾 **Intelligent Caching** - Optimized performance with smart caching
- 🎯 **User Targeting** - Segment users based on attributes and behavior
- 📦 **Universal Support** - Works in browsers, Node.js, and React Native

## 🚀 Quick Start

### Installation

```bash
npm install resyncbase
```

### Basic Usage

```javascript
import ResyncBase from 'resyncbase';

// Initialize ResyncBase
const resyncBase = ResyncBase.init({
  key: 'your-api-key-here',
  appId: 123,
  ttl: 60 * 60 * 1000, // 1 hour cache
  callback: (config) => {
    console.log('Configuration loaded:', config);
  }
});

// Set user context
ResyncBase.setUserId('user-123');
ResyncBase.setClient('web-app');
ResyncBase.setAttributes({
  plan: 'premium',
  country: 'US',
  device: 'desktop'
});

// Get configuration values
const featureFlag = ResyncBase.getConfig('new-feature');
const content = ResyncBase.getContent();

// Run A/B tests
const variant = await ResyncBase.getVariant('pricing-experiment');
console.log('User sees variant:', variant);

// Track conversions
ResyncBase.recordConversion('pricing-experiment', {
  revenue: 99.99,
  currency: 'USD'
});
```

## 📚 API Reference

### Initialization

#### `ResyncBase.init(options)`

Initialize the ResyncBase client.

**Parameters:**
- `options.key` (string, required) - Your ResyncBase API key
- `options.appId` (number, required) - Your application ID
- `options.ttl` (number, optional) - Cache time-to-live in milliseconds (default: 1 hour)
- `options.callback` (function, optional) - Callback when configuration is loaded
- `options.storage` (object, optional) - Storage implementation for caching

**Returns:** `ResyncBase` instance

**Example:**
```javascript
const resyncBase = ResyncBase.init({
  key: 'your-api-key',
  appId: 123,
  ttl: 30 * 60 * 1000, // 30 minutes
  callback: (config) => {
    console.log('Config loaded:', config);
  },
  storage: localStorage // Browser storage
});
```

### User Management

#### `ResyncBase.setUserId(userId)`

Set the current user ID for tracking and personalization.

**Parameters:**
- `userId` (string|number) - Unique user identifier

#### `ResyncBase.setClient(client)`

Set the client identifier for tracking.

**Parameters:**
- `client` (string) - Client identifier (e.g., 'web-app', 'mobile-app')

#### `ResyncBase.setAttributes(attributes)`

Set user attributes for targeting and personalization.

**Parameters:**
- `attributes` (object) - User attributes object

**Example:**
```javascript
ResyncBase.setUserId('user-123');
ResyncBase.setClient('web-app');
ResyncBase.setAttributes({
  plan: 'premium',
  country: 'US',
  age: 28,
  device: { type: 'desktop', os: 'macOS' }
});
```

### Configuration Access

#### `ResyncBase.getConfig(key)`

Get a configuration value by key.

**Parameters:**
- `key` (string) - Configuration key

**Returns:** Configuration value or `undefined`

**Example:**
```javascript
const apiUrl = ResyncBase.getConfig('api-url');
const featureEnabled = ResyncBase.getConfig('new-feature');
```

#### `ResyncBase.getContent()`

Get all content views for the application.

**Returns:** Array of `ContentView` objects

**Example:**
```javascript
const content = ResyncBase.getContent();
content.forEach(view => {
  console.log('Content view:', view.name);
});
```

### A/B Testing

#### `ResyncBase.getVariant(experimentId, payload)`

Get a variant for an A/B test experiment.

**Parameters:**
- `experimentId` (string) - Experiment identifier
- `payload` (any, optional) - Additional data for variant assignment

**Returns:** Promise that resolves to variant value or `null`

**Example:**
```javascript
const variant = await ResyncBase.getVariant('pricing-experiment', {
  userId: 'user-123',
  userData: { plan: 'premium' }
});

if (variant === 'control') {
  // Show original pricing
} else if (variant === 'test') {
  // Show new pricing
}
```

#### `ResyncBase.recordConversion(experimentId, metadata)`

Record a conversion for an A/B test experiment.

**Parameters:**
- `experimentId` (string) - Experiment identifier
- `metadata` (object, optional) - Conversion metadata

**Example:**
```javascript
ResyncBase.recordConversion('pricing-experiment', {
  revenue: 99.99,
  currency: 'USD',
  plan: 'premium'
});
```

### Content Logging

#### `ResyncBase.logEvent(event)`

Log a content interaction event.

**Parameters:**
- `event` (object) - Event object with the following properties:
  - `contentViewId` (number) - Content view ID
  - `itemId` (string) - Content item ID
  - `logId` (string) - Unique log identifier
  - `action` (string) - Action type ('view' or 'click')
  - `type` (string) - Event type ('IMPRESSION' or 'CONVERSION')
  - `metadata` (object, optional) - Additional event data

**Example:**
```javascript
ResyncBase.logEvent({
  eventId: 'evt_click_3ry5xt',
  contentViewId: 123,
  metadata: { position: 'top', section: 'hero' }
});
```

### Real-time Updates

#### `ResyncBase.instance.subscribe(callback)`

Subscribe to configuration updates.

**Parameters:**
- `callback` (function) - Callback function that receives updated configuration

**Returns:** Subscription object

#### `ResyncBase.instance.unsubscribe(callback)`

Unsubscribe from configuration updates.

**Parameters:**
- `callback` (function) - Callback function to unsubscribe

**Example:**
```javascript
const handleConfigUpdate = (config) => {
  console.log('Configuration updated:', config);
  // Update UI based on new configuration
};

// Subscribe to updates
ResyncBase.instance.subscribe(handleConfigUpdate);

// Later, unsubscribe
ResyncBase.instance.unsubscribe(handleConfigUpdate);
```

## 🌐 Platform Support

### Browser
```javascript
// ES Modules
import ResyncBase from 'resyncbase';

// CommonJS
const ResyncBase = require('resyncbase');

// UMD (via CDN)
<script src="https://unpkg.com/resyncbase@latest/dist/resyncbase.umd.js"></script>
```

### React Native
```javascript
import ResyncBase from 'resyncbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize with AsyncStorage
const resyncBase = ResyncBase.init({
  key: 'your-api-key',
  appId: 123,
  storage: AsyncStorage
});
```

## 🔗 Links

- [Documentation](https://docs.resyncbase.com)
- [API Reference](https://docs.resyncbase.com/api)
- [Examples](https://github.com/ifeoluwak/resyncbase-js/tree/main/examples)
- [Changelog](https://github.com/ifeoluwak/resyncbase-js/blob/main/CHANGELOG.md)
- [Issues](https://github.com/ifeoluwak/resyncbase-js/issues)

## 📄 License

MIT © [ResyncBase](https://github.com/ifeoluwak/resyncbase-js)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ifeoluwak/resyncbase-js/blob/main/CONTRIBUTING.md) for details.

---

**Need help?** Check out our [documentation](https://docs.resyncbase.com) or [contact support](mailto:support@resyncbase.com).
