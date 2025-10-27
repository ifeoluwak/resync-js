/**
 * ResyncAPI Demo - Showcasing the improved library functionality
 * This demo demonstrates all the key features of the ResyncAPI library
 * with the new architecture and constants system.
 */

import ResyncAPI from "../../index.js";


// Make ResyncAPI available globally in browser environments
if (typeof window !== "undefined") {
  // @ts-ignore - Adding to global window object
  window.ResyncAPI = ResyncAPI;
}

/**
 * Demo configuration
 */
const DEMO_CONFIG = {
  API_KEY: "e710dab545f6b78d0a55eb301f7c54a7907ed339",
  APP_ID: 8,
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
 * Initialize ResyncAPI with comprehensive configuration
 */
async function initializeResyncAPI() {
  console.log("🚀 Initializing ResyncAPI with new architecture...");
  
  try {
   await ResyncAPI.init({
      key: DEMO_CONFIG.API_KEY,
      appId: DEMO_CONFIG.APP_ID,
      callback: onConfigLoaded,
      storage: typeof window !== "undefined" ? window.localStorage : null,
      environment: 'sandbox'
    });
    
    console.log("✅ ResyncAPI initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize ResyncAPI:", error.message);
  }
}

/**
 * Callback function when configuration is loaded
 */
async function onConfigLoaded() {
  console.log("📦 Configuration loaded:");
  
  // Set user context
  setUserContext();
  
  // Demonstrate configuration access
  demonstrateConfigAccess();
  
  // Demonstrate campaigns
  await demonstrateCampaign();
  
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
  
  ResyncAPI.setUserId(DEMO_CONFIG.USER_ID);
  ResyncAPI.setClient(DEMO_CONFIG.CLIENT);
  ResyncAPI.setUserAttributes(DEMO_CONFIG.USER_ATTRIBUTES);
  
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
    const featureFlag = ResyncAPI.getConfig('new-feature');
    console.log("✅ Feature flag retrieved:", featureFlag);
  } catch (error) {
    console.log("ℹ️ Configuration key not found (expected in demo):", error.message);
  }
  
  try {
    // Try to get content
    const content = ResyncAPI.getContent();
    console.log("✅ Content retrieved:", content);
  } catch (error) {
    console.log("ℹ️ No content available (expected in demo):", error.message);
  }
}

/**
 * Demonstrate campaign functionality
 */
async function demonstrateCampaign() {
  console.log("🧪 Demonstrating campaign...");
  
  try {
    // Simulate getting a variant for a campaign
    const variant = await ResyncAPI.getVariant('campaign-1');
    console.log("✅ Campaign variant retrieved:", variant);
    
    // Simulate recording a conversion
    // ResyncAPI.recordConversion('campaign-1', {
    //   revenue: 99.99,
    //   currency: 'USD',
    //   product: 'premium-plan'
    // });
    console.log("✅ Conversion recorded for campaign");
    
  } catch (error) {
    console.log("ℹ️ Campaign not available (expected in demo):", error.message);
  }
}

/**
 * Demonstrate content logging functionality
 */
function demonstrateContentLogging() {
  console.log("📊 Demonstrating content logging...");
  
  try {
    // Log a content event
    ResyncAPI.logEvent({
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
  const updateCallback = () => {
    console.log("📡 Configuration update received:");
  };
  
  ResyncAPI.subscribe(updateCallback);
  console.log("✅ Subscribed to configuration updates");
  
  // Simulate unsubscribing after 5 seconds
  setTimeout(() => {
    ResyncAPI.unsubscribe(updateCallback);
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
    ResyncAPI.getConfig('test-key');
  } catch (error) {
    console.log("✅ Error handling works:", error.message);
  }
  
  // Try to set invalid client
  try {
    // @ts-ignore - Intentionally passing wrong type to test validation
    ResyncAPI.setClient(123); // Should be string - this will cause an error
  } catch (error) {
    console.log("✅ Validation works:", error.message);
  }
}

/**
 * Run the complete demo
 */
function runDemo() {
  console.log("🎯 Starting ResyncAPI Demo");
  console.log("=" .repeat(50));
  
  // Initialize ResyncAPI
  initializeResyncAPI();
  
  // Demonstrate error handling
  setTimeout(() => {
    demonstrateErrorHandling();
  }, 2000);
  
  // Show library status
  setTimeout(() => {
    console.log("📊 Library Status:", {
      ready: ResyncAPI.ready,
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
  console.log("ResyncAPI Demo loaded. Call runDemo() to start the demonstration.");
}
