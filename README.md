# ResyncBase - JavaScript Configuration Management Library

A powerful JavaScript library for configuration management, A/B testing, and function execution with comprehensive type safety through JSDoc annotations.

## Features

- 🧪 **Advanced A/B Testing** - Custom logic-driven experiments with full control
- 🔧 **Configuration Management** - Fetch and cache application configurations
- ⚡ **Function Execution** - Execute remote functions with sandboxing
- 📝 **Type Safety** - Full JSDoc type annotations for better IDE support
- 💾 **Caching** - Flexible storage with localStorage or custom storage
- 🔒 **Security** - Sandboxed function execution with validation

## Installation

```bash
npm install resyncbase
```

## Quick Start

```javascript
import { ResyncBase } from 'resyncbase';

// Initialize the library
ResyncBase.init({
  key: 'your-api-key',
  appId: 'your-app-id',
  callback: (config) => console.log('Config loaded:', config)
});

// Get a configuration value
const featureFlag = ResyncBase.getConfig('new-feature');

// Execute a remote function
const result = await ResyncBase.executeFunction('calculatePrice', 100, 'USD');

// Get A/B test variant
const variant = await ResyncBase.getVariant('pricing-experiment', { userId: '123' });
```

## Type Safety with JSDoc

This library uses comprehensive JSDoc annotations for type safety. Modern IDEs like VS Code provide excellent support for JSDoc types.

### Configuration Types

```javascript
/**
 * @typedef {Object} InitOptions
 * @property {string} key - The API key for Banana API
 * @property {string} appId - The application ID
 * @property {number} [ttl=3600000] - Time-to-live for cache in milliseconds
 * @property {Function} [callback] - Optional callback function when config is loaded
 * @property {Storage} [storage] - Optional storage object for caching. e.g localStorage (web), AsyncStorage (react-native)
 */
```

```javascript
/**
 * @typedef {Object} Function
 * @property {number} id - The unique identifier for the function
 * @property {string} name - The name of the function
 * @property {string} comment - A brief description of what the function does
 * @property {FunctionParameter[]} parameters - An array of parameter objects
 * @property {string} code - The actual code of the function as a string
 * @property {string} returnType - The type of value that the function returns
 * @property {string[]} constants - Array of constants used in the function
 * @property {boolean} public - Indicates whether the function is public or private
 * @property {string} version - The version of the function
 */
```

```javascript
/**
 * @typedef {Object} Experiment
 * @property {string} id - The unique identifier for the experiment
 * @property {string} name - The name of the experiment
 * @property {string} type - The type of experiment (e.g., 'system', 'custom')
 * @property {ExperimentVariant[]} variants - Array of possible variants
 * @property {Function} [assignmentFunction] - Custom function for variant assignment
 * @property {string} [systemFunctionId] - ID of system function for variant assignment
 */
```

## A/B Testing

ResyncBase's A/B testing capabilities are built around **custom logic-driven experiments**. Unlike traditional A/B testing platforms that limit you to simple random assignments, ResyncBase gives you complete control over variant assignment logic.

### Key Differentiators

- **🎯 Custom Logic**: Write any JavaScript function to determine variant assignment
- **🔄 Real-time Updates**: Change experiment logic without code deployments
- **📊 Advanced Targeting**: Use user attributes, behavior, and context for sophisticated targeting
- **⚡ Performance**: Lightweight client-side execution with server-side validation
- **🔒 Security**: Sandboxed execution with comprehensive validation

### Traditional vs Custom Logic A/B Testing

| Feature | Traditional A/B Testing | ResyncBase Custom Logic |
|---------|------------------------|-------------------------|
| Variant Assignment | Random or simple rules | Any JavaScript logic |
| Targeting | Basic user segments | Complex multi-factor targeting |
| Real-time Changes | Requires deployment | Instant updates via dashboard |
| Experiment Complexity | Limited | Unlimited complexity |
| Data Integration | Basic | Full access to user data |

### Custom Logic Examples

- From the dashboard, you can setup your custom variant logic to allow custom parameters, opening up the ability for any logic you wish to have.

#### 1. User Behavior-Based Assignment

```javascript
// Assign variants based on user's purchase history
function assignVariant(userData) {
  const totalSpent = userData.totalPurchases || 0;
  
  if (totalSpent > 1000) {
    return 'premium'; // High-value users get premium experience
  } else if (totalSpent > 100) {
    return 'standard'; // Medium-value users get standard
  } else {
    return 'basic'; // New users get basic experience
  }
}
```

#### 2. Time-Based Targeting

```javascript
// Different variants for different times of day
function timeBasedAssignment(userData) {
  const hour = new Date().getHours();
  
  if (hour >= 9 && hour <= 17) {
    return 'business'; // Business hours
  } else if (hour >= 18 && hour <= 22) {
    return 'evening'; // Evening hours
  } else {
    return 'night'; // Night hours
  }
}
```

#### 3. Geographic Targeting

```javascript
// Location-based variant assignment
function geoBasedAssignment(userData) {
  const country = userData.country;
  const region = userData.region;
  
  if (country === 'US' && region === 'CA') {
    return 'california'; // California-specific experience
  } else if (country === 'US') {
    return 'us'; // US-specific experience
  } else if (country === 'UK') {
    return 'uk'; // UK-specific experience
  } else {
    return 'international'; // International experience
  }
}
```

#### 4. Complex Multi-Factor Logic

```javascript
// Sophisticated targeting combining multiple factors
function complexAssignment(userId, userData) {
  const { age, plan, country, deviceType, lastLogin } = userData;
  
  // Premium users always get premium experience
  if (plan === 'premium') {
    return 'premium';
  }
  
  // Mobile users in developing countries get optimized experience
  if (deviceType === 'mobile' && ['IN', 'BR', 'ID'].includes(country)) {
    return 'mobile-optimized';
  }
  
  // Young users get modern interface
  if (age < 25) {
    return 'modern';
  }
  
  // Users who haven't logged in recently get re-engagement experience
  const daysSinceLogin = (Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin > 30) {
    return 're-engagement';
  }
  
  return 'default';
}
```

### Setting Up Custom Logic Experiments

#### 1. Create Your Assignment Function

```javascript
// Define your custom logic
function myCustomAssignment(userId, userData, experimentContext) {
  // Access to user data, experiment context, and any other parameters
  const { userAttributes, experimentId, timestamp } = experimentContext;
  
  // Your custom logic here
  if (userAttributes.plan === 'premium') {
    return 'premium-variant';
  }
  
  // Use ResyncConfig for dynamic configuration
  const threshold = ResyncConfig.premiumThreshold || 100;
  
  if (userAttributes.totalSpent > threshold) {
    return 'high-value';
  }
  
  return 'standard';
}
```

#### 2. Configure the Experiment

```javascript
// In your dashboard, configure the experiment with:
{
  "id": "pricing-experiment",
  "name": "Dynamic Pricing Test",
  "type": "custom",
  "assignmentFunction": {
    "name": "myCustomAssignment",
    "code": "function myCustomAssignment(userId, userData, experimentContext) { ... }",
    "parameters": ["userId", "userData", "experimentContext"]
  },
  "variants": [
    { "id": "premium-variant", "name": "Premium", "value": "premium" },
    { "id": "high-value", "name": "High Value", "value": "high-value" },
    { "id": "standard", "name": "Standard", "value": "standard" }
  ]
}
```

#### 3. Use in Your Application

```javascript
// Set user context
ResyncBase.setUserId('user123');
ResyncBase.setAttributes({
  plan: 'premium',
  totalSpent: 1500,
  country: 'US',
  deviceType: 'desktop'
});

// Get variant using your custom logic
const variant = await ResyncBase.getVariant('pricing-experiment', {
  userId: 'user123',
  userData: {
    plan: 'premium',
    totalSpent: 1500
  }
});

console.log('User got variant:', variant); // 'premium-variant'
```

### Traditional A/B Testing Support

ResyncBase also supports traditional A/B testing methods:

#### Random Assignment

```javascript
// Simple random assignment
const variant = await ResyncBase.getVariant('simple-test');
```

#### Weighted Random Assignment

```javascript
// Weighted random assignment (configured in dashboard)
const variant = await ResyncBase.getVariant('weighted-test');
```

#### System Templates

ResyncBase provides built-in system templates for common use cases:

- **Time-based rollout**: Assigns a variant based on the specified time range.
- **Weighted Rollout**: Assignment based on Rollout percentage and variant weights
- **Feature Flag**: For feature flagging
- **Weighted Random**: Random assignment based on variant weights
- **Round Robin**: Assigns variants in a round-robin fashion
- **Bandit**: Assigns variants based on past performance using an epsilon-greedy bandit algorithm.

### Advanced Features

#### Real-time Logic Updates

```javascript
// Your assignment function can be updated in real-time
// No code deployment required - changes take effect immediately
function updatedAssignment(userId, userData) {
  // New logic here - updated via dashboard
  const newRules = ResyncConfig.experimentRules;
  
  if (newRules.enableNewFeature && userData.betaUser) {
    return 'new-feature';
  }
  
  return 'control';
}
```

#### Context-Aware Experiments

```javascript
// Access to experiment context and configuration
function contextAwareAssignment(userData, context) {
  const { experiment, timestamp, lastAssignedUserVariant, getLastAssignedVariant } = context;
 
  return 'Some Variant Value';
}
```

#### Conversion Tracking

```javascript
// Track conversions with rich metadata
ResyncBase.recordConversion('pricing-experiment', {
  revenue: 99.99,
  currency: 'USD',
  product: 'premium-plan',
  conversionType: 'purchase',
  userSegment: 'high-value'
});
```

### Best Practices

#### 1. **Enforcement of Pure Functions with Assertions and Admin Validation Settings**
```javascript
// ✅ Good: Pure function with no side effects
function goodAssignment(userId, userData) {
  return userData.plan === 'premium' ? 'premium' : 'standard';
}

// ❌ Bad: Functions with side effects are not allowed
function badAssignment(userId, userData) {
  console.log('User data:', userData); // Side effect
  return 'variant';
}
```

#### 2. **Handle Edge Cases**
```javascript
function robustAssignment(userData) {
  // Always provide fallback
  if (!userData || !userData.plan) {
    return 'default';
  }
  
  // Your logic here
  return userData.plan === 'premium' ? 'premium' : 'standard';
}
```

#### 3. **Use Configuration for Flexibility**
```javascript
function configurableAssignment(userData) {
  // Have access to your Config object
  const thresholds = ResyncConfig.experimentThresholds || {};
  
  const premiumThreshold = thresholds.premium || 1000;
  const highValueThreshold = thresholds.highValue || 500;
  
  if (userData.totalSpent > premiumThreshold) {
    return 'premium';
  } else if (userData.totalSpent > highValueThreshold) {
    return 'high-value';
  }
  
  return 'standard';
}
```

### Performance Considerations

- **Lightweight Execution**: Functions run in a sandboxed environment
- **Caching**: Variant assignments are cached for performance
- **Timeout Protection**: Functions have execution time limits
- **Memory Management**: Automatic cleanup of execution context

This custom logic approach gives you unprecedented control over your A/B testing strategy, allowing you to create sophisticated experiments that traditional platforms simply cannot support.
```

## API Reference

### ResyncBase Class

#### Static Methods

##### `init(options: InitOptions): ResyncBase`

Initializes the ResyncBase library.

```javascript
ResyncBase.init({
  key: 'your-api-key',
  appId: 'your-app-id',
  ttl: 1800000, // 30 minutes
  callback: (config) => console.log('Config loaded'),
  storage: localStorage
});
```

##### `getConfig(key: string): *`

Gets a configuration value by key.

```javascript
const featureFlag = ResyncBase.getConfig('new-feature');
const apiUrl = ResyncBase.getConfig('api-url');
```

##### `executeFunction(functionName: string, ...args: *[]): Promise<*>`

Executes a remote function by name.

```javascript
const result = await ResyncBase.executeFunction('calculatePrice', 100, 'USD');
const userData = await ResyncBase.executeFunction('getUserProfile', userId);
```

##### `getVariant(experimentId: string, payload?: *): Promise<string|null>`

Gets a variant for an A/B test experiment.

```javascript
const variant = await ResyncBase.getVariant('pricing-experiment', { userId: '123' });
const colorVariant = await ResyncBase.getVariant('button-color-test');
```

##### `recordConversion(experimentId: string, metadata?: Object): *`

Records a conversion for an A/B test experiment.

```javascript
ResyncBase.recordConversion('pricing-experiment', { 
  revenue: 99.99,
  currency: 'USD'
});
```

##### `setUserId(userId: string|number): void`

Sets the user ID for tracking and variant assignment.

```javascript
ResyncBase.setUserId('user123');
ResyncBase.setUserId(12345);
```

##### `setClient(client: string): void`

Sets the client identifier for tracking.

```javascript
ResyncBase.setClient('web-app');
ResyncBase.setClient('mobile-app');
```

##### `setAttributes(attributes: Object): void`

Sets user attributes for tracking and targeting.

```javascript
ResyncBase.setAttributes({
  country: 'US',
  plan: 'premium',
  age: 25
});
```

#### Instance Methods

##### `subscribe(callback: Function): void`

Subscribes a callback function to configuration updates.

```javascript
ResyncBase.instance.subscribe((config) => {
  console.log('Configuration updated:', config);
});
```

##### `unsubscribe(callback: Function): void`

Unsubscribes a callback function from configuration updates.

```javascript
ResyncBase.instance.unsubscribe(myCallback);
```

### ResyncCache Class

#### Static Methods

##### `init(storage?: StorageInterface): void`

Initializes the ResyncCache with optional storage.

```javascript
// Initialize with localStorage
ResyncCache.init(localStorage);

// Note that the storage interface must implement the following methods
getItem, setItem, removeItem, clear.
```

## IDE Support

### VS Code

For the best experience with JSDoc types in VS Code:

1. Install the "TypeScript and JavaScript Language Features" extension
2. Add a `jsconfig.json` file to your project (already included)
3. Enable "Check JS" in your workspace settings

## Error Handling

The library provides comprehensive error handling with descriptive error messages:

```javascript
try {
  const config = ResyncBase.getConfig('non-existent-key');
} catch (error) {
  console.error('Configuration error:', error.message);
  // Output: "Configuration for key "non-existent-key" not found."
}

try {
  await ResyncBase.executeFunction('invalid-function');
} catch (error) {
  console.error('Function execution error:', error.message);
  // Output: "FunctionExecutor is not initialized. Please initialize ResyncBase first."
}
```

## Security Features

### Function Execution Sandboxing

- Code validation against banned keywords and patterns
- Timeout protection for long-running functions
- Limited access to global objects
- Parameters and parameter type checks
- Controlled fetch access with domain whitelisting

### Configuration Validation

- API key and App ID validation
- Storage interface validation
- Parameter type checking

## Contributing

When contributing to this library:

1. Add comprehensive JSDoc annotations for all new functions
2. Include type definitions for new data structures
3. Provide usage examples in the documentation
4. Follow the existing code style and patterns

## License

MIT License - see LICENSE file for details. 