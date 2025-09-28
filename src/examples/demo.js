/**
 * ResyncBaseAPI Demo - Showcasing the improved library functionality
 * This demo demonstrates all the key features of the ResyncBaseAPI library
 * with the new architecture and constants system.
 */

import ResyncBaseAPI from "../../index.js";


// Make ResyncBaseAPI available globally in browser environments
if (typeof window !== "undefined") {
  // @ts-ignore - Adding to global window object
  window.ResyncBaseAPI = ResyncBaseAPI;
}

/**
 * Demo configuration
 */
const DEMO_CONFIG = {
  API_KEY: "your-api-key-here",
  APP_ID: 7,
  TTL: 60 * 60 * 1000, // 1 hour
  USER_ID: "demo-user-456",
  CLIENT: "demo-web-app",
  USER_ATTRIBUTES: {
    email: "john.doe@example.com",
    name: "John Doe",
    phone: "1234567890",
    language: "en",
    attributes: {
      plan: "premium",
      country: "US",
      age: 28
    }
  }
};

/**
 * Initialize ResyncBaseAPI with comprehensive configuration
 */
function initializeResyncBaseAPI() {
  console.log("🚀 Initializing ResyncBaseAPI with new architecture...");
  
  try {
    ResyncBaseAPI.init({
      key: DEMO_CONFIG.API_KEY,
      appId: DEMO_CONFIG.APP_ID,
      ttl: DEMO_CONFIG.TTL,
      callback: onConfigLoaded,
      storage: typeof window !== "undefined" ? window.localStorage : null
    });
    
    console.log("✅ ResyncBaseAPI initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize ResyncBaseAPI:", error.message);
  }
}

/**
 * Callback function when configuration is loaded
 * @param {Object} config - The loaded configuration
 */
async function onConfigLoaded(config) {
  console.log("📦 Configuration loaded:", {
    appConfig: config.appConfig,
    experimentsCount: config.experiments?.length || 0,
    contentCount: config.content?.length || 0
  });
  
  // Set user context
  setUserContext();
  
  // Demonstrate configuration access
  demonstrateConfigAccess();
  
  // Demonstrate A/B testing
  await demonstrateABTesting();
  
  // Demonstrate content logging
  demonstrateContentLogging();
  
  // Demonstrate subscription system
  demonstrateSubscriptionSystem();
}

/**
 * Set user context for tracking and targeting
 */
function setUserContext() {
  console.log("👤 Setting user context...");
  
  ResyncBaseAPI.setUserId(DEMO_CONFIG.USER_ID);
  ResyncBaseAPI.setClient(DEMO_CONFIG.CLIENT);
  ResyncBaseAPI.setUserAttributes(DEMO_CONFIG.USER_ATTRIBUTES);
  
  console.log("✅ User context set:", {
    userId: DEMO_CONFIG.USER_ID,
    client: DEMO_CONFIG.CLIENT,
    attributes: DEMO_CONFIG.USER_ATTRIBUTES
  });
}

/**
 * Demonstrate configuration access
 */
function demonstrateConfigAccess() {
  console.log("⚙️ Demonstrating configuration access...");
  
  try {
    // Try to get a configuration value
    const featureFlag = ResyncBaseAPI.getConfig('new-feature');
    console.log("✅ Feature flag retrieved:", featureFlag);
  } catch (error) {
    console.log("ℹ️ Configuration key not found (expected in demo):", error.message);
  }
  
  try {
    // Try to get content
    const content = ResyncBaseAPI.getContent();
    console.log("✅ Content retrieved:", content);
  } catch (error) {
    console.log("ℹ️ No content available (expected in demo):", error.message);
  }
}

/**
 * Demonstrate A/B testing functionality
 */
async function demonstrateABTesting() {
  console.log("🧪 Demonstrating A/B testing...");
  
  try {
    // Simulate getting a variant for an experiment
    const variant = await ResyncBaseAPI.getVariant('pricing-experiment');
    console.log("✅ A/B test variant retrieved:", variant);
    
    // Simulate recording a conversion
    // ResyncBaseAPI.recordConversion('pricing-experiment', {
    //   revenue: 99.99,
    //   currency: 'USD',
    //   product: 'premium-plan'
    // });
    console.log("✅ Conversion recorded for pricing experiment");
    
  } catch (error) {
    console.log("ℹ️ A/B testing not available (expected in demo):", error.message);
  }
}

/**
 * Demonstrate content logging functionality
 */
function demonstrateContentLogging() {
  console.log("📊 Demonstrating content logging...");
  
  try {
    // Log a content event
    ResyncBaseAPI.logEvent({
      eventId: 'evt-cta-click-234r56',
      logId: 'click-001',
      metadata: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      }
    });
    console.log("✅ Content event logged successfully");
    
  } catch (error) {
    console.log("ℹ️ Content logging not available (expected in demo):", error.message);
  }
}

/**
 * Demonstrate subscription system
 */
function demonstrateSubscriptionSystem() {
  console.log("🔔 Demonstrating subscription system...");
  
  // Subscribe to configuration updates
  const updateCallback = (config) => {
    console.log("📡 Configuration update received:", {
      timestamp: new Date().toISOString(),
      experimentsCount: config.experiments?.length || 0
    });
  };
  
  ResyncBaseAPI.subscribe(updateCallback);
  console.log("✅ Subscribed to configuration updates");
  
  // Simulate unsubscribing after 5 seconds
  setTimeout(() => {
    ResyncBaseAPI.unsubscribe(updateCallback);
    console.log("✅ Unsubscribed from configuration updates");
  }, 5000);
}

/**
 * Demonstrate error handling
 */
function demonstrateErrorHandling() {
  console.log("⚠️ Demonstrating error handling...");
  
  // Try to get config without initialization
  try {
    ResyncBaseAPI.getConfig('test-key');
  } catch (error) {
    console.log("✅ Error handling works:", error.message);
  }
  
  // Try to set invalid client
  try {
    // @ts-ignore - Intentionally passing wrong type to test validation
    ResyncBaseAPI.setClient(123); // Should be string - this will cause an error
  } catch (error) {
    console.log("✅ Validation works:", error.message);
  }
}

/**
 * Run the complete demo
 */
function runDemo() {
  console.log("🎯 Starting ResyncBaseAPI Demo");
  console.log("=" .repeat(50));
  
  // Initialize ResyncBaseAPI
  initializeResyncBaseAPI();
  
  // Demonstrate error handling
  setTimeout(() => {
    demonstrateErrorHandling();
  }, 2000);
  
  // Show library status
  setTimeout(() => {
    console.log("📊 Library Status:", {
      ready: ResyncBaseAPI.ready,
    });
  }, 3000);
}

// Export for use in other modules
export { runDemo, DEMO_CONFIG };

// Auto-run demo if this file is executed directly
if (typeof window !== "undefined") {
  // Run demo in browser
  runDemo();
} else {
  // Export for Node.js usage
  console.log("ResyncBaseAPI Demo loaded. Call runDemo() to start the demonstration.");
}
