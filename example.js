/**
 * Example usage of ResyncBase library with JSDoc type checking.
 * This file demonstrates how to use the library with proper type annotations.
 */

import { ResyncBase } from './index.js';
import ResyncCache from './cache.js';

/**
 * Example function that demonstrates configuration management.
 * @param {string} apiKey - The API key for authentication
 * @param {string} appId - The application ID
 * @returns {Promise<void>}
 */
async function exampleConfigurationManagement(apiKey, appId) {
  try {
    // Initialize ResyncBase with type-safe options
    /** @type {import('./index.js').InitOptions} */
    const initOptions = {
      key: apiKey,
      appId: appId,
      ttl: 1800000, // 30 minutes
      callback: (config) => {
        console.log('Configuration loaded:', config);
      },
      storage: localStorage
    };

    const instance = ResyncBase.init(initOptions);

    // Get configuration values with type checking
    const featureFlag = ResyncBase.getConfig('new-feature');
    const apiUrl = ResyncBase.getConfig('api-url');

    console.log('Feature flag:', featureFlag);
    console.log('API URL:', apiUrl);

  } catch (error) {
    console.error('Configuration error:', error.message);
  }
}

/**
 * Example function that demonstrates A/B testing.
 * @param {string} experimentId - The experiment ID
 * @param {Object} userData - User data for variant assignment
 * @returns {Promise<string|null>}
 */
async function exampleABTesting(experimentId, userData) {
  try {
    // Set user context for consistent variant assignment
    ResyncBase.setUserId(userData.userId);
    ResyncBase.setClient(userData.client);
    ResyncBase.setAttributes({
      country: userData.country,
      plan: userData.plan
    });

    // Get variant for the experiment
    const variant = await ResyncBase.getVariant(experimentId, userData);
    
    console.log(`User ${userData.userId} got variant: ${variant}`);

    // Record conversion when user takes action
    if (variant === 'treatment') {
      ResyncBase.recordConversion(experimentId, {
        revenue: 99.99,
        currency: 'USD',
        action: 'purchase'
      });
    }

    return variant;

  } catch (error) {
    console.error('A/B testing error:', error.message);
    return null;
  }
}

/**
 * Example function that demonstrates function execution.
 * @param {string} functionName - The name of the function to execute
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise<*>}
 */
async function exampleFunctionExecution(functionName, args) {
  try {
    // Execute a remote function with type checking
    const result = await ResyncBase.executeFunction(functionName, args);
    
    console.log(`Function ${functionName} returned:`, result);
    return result;

  } catch (error) {
    console.error('Function execution error:', error.message);
    throw error;
  }
}

/**
 * Example function that demonstrates cache management.
 * @param {import('./cache.js').StorageInterface} storage - Storage interface
 */
function exampleCacheManagement(storage) {
  try {
    // Initialize cache with custom storage
    ResyncCache.init(storage);

    // Save configuration data
    const configData = {
      featureFlags: {
        'new-ui': true,
        'beta-features': false
      },
      apiEndpoints: {
        'users': '/api/users',
        'products': '/api/products'
      }
    };

    ResyncCache.saveKeyValue('configs', configData);
    ResyncCache.saveKeyValue('lastFetchTimestamp', new Date().toISOString());

    // Retrieve cached data
    const cachedConfigs = ResyncCache.getKeyValue('configs');
    const lastFetch = ResyncCache.getKeyValue('lastFetchTimestamp');

    console.log('Cached configs:', cachedConfigs);
    console.log('Last fetch:', lastFetch);

  } catch (error) {
    console.error('Cache management error:', error.message);
  }
}

/**
 * Example function that demonstrates subscription to configuration updates.
 * @param {Function} callback - Callback function for configuration updates
 */
function exampleSubscription(callback) {
  try {
    // Subscribe to configuration updates
    ResyncBase.instance.subscribe(callback);

    // Later, unsubscribe when no longer needed
    // ResyncBase.instance.unsubscribe(callback);

  } catch (error) {
    console.error('Subscription error:', error.message);
  }
}

/**
 * Example usage of all features together.
 * @param {string} apiKey - The API key
 * @param {string} appId - The application ID
 * @param {Object} userData - User data for testing
 */
async function completeExample(apiKey, appId, userData) {
  console.log('Starting ResyncBase example...');

  // 1. Initialize and manage configuration
  await exampleConfigurationManagement(apiKey, appId);

  // 2. Run A/B test
  const variant = await exampleABTesting('pricing-experiment', userData);

  // 3. Execute function based on variant
  if (variant === 'treatment') {
    await exampleFunctionExecution('calculatePremiumPrice', [100, 'USD']);
  } else {
    await exampleFunctionExecution('calculateStandardPrice', [100, 'USD']);
  }

  // 4. Manage cache
  exampleCacheManagement(localStorage);

  // 5. Subscribe to updates
  exampleSubscription((config) => {
    console.log('Configuration updated:', config);
  });

  console.log('Example completed successfully!');
}

// Export functions for use in other modules
export {
  exampleConfigurationManagement,
  exampleABTesting,
  exampleFunctionExecution,
  exampleCacheManagement,
  exampleSubscription,
  completeExample
};

// Example usage (uncomment to run)
/*
completeExample(
  'your-api-key',
  'your-app-id',
  {
    userId: 'user123',
    client: 'web-app',
    country: 'US',
    plan: 'premium'
  }
);
*/ 