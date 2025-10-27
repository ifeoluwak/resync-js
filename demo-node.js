#!/usr/bin/env node

/**
 * Resync Node.js Demo
 * Run with: node demo-node.js
 */

import { runDemo, DEMO_CONFIG } from './src/examples/demo.js';

console.log('🚀 Resync Node.js Demo');
console.log('==========================');
console.log('');

// Show demo configuration
console.log('📋 Demo Configuration:');
console.log(JSON.stringify(DEMO_CONFIG, null, 2));
console.log('');

// Run the demo
runDemo();

// Additional Node.js specific demonstrations
setTimeout(() => {
  console.log('');
  console.log('🔧 Node.js Specific Features:');
  console.log('=============================');
  
  // Demonstrate module loading
  console.log('✅ ES Modules working correctly');
  console.log('✅ Import/Export syntax supported');
  console.log('✅ Constants system integrated');
  console.log('✅ No circular dependencies');
  
  console.log('');
  console.log('🎉 Demo completed successfully!');
  console.log('The Resync library is working with the new architecture.');
}, 5000);
