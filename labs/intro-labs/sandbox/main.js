/**
 * Main application file for Sandbox Application
 * Demonstrates usage of config and utility functions
 */

// Import configuration
const config = require('./config.json');

// Import utility functions
const { formatDate } = require('./utils');

/**
 * Main application entry point
 */
function main() {
  // Display application info from config
  console.log('='.repeat(50));
  console.log(`Application: ${config.appName}`);
  console.log(`Version: ${config.version}`);
  console.log(`Environment: ${config.environment}`);
  console.log('='.repeat(50));
  console.log();

  // Demonstrate date formatting utility
  const currentDate = new Date();
  
  console.log('Date Formatting Examples:');
  console.log(`Short format:  ${formatDate(currentDate, 'short')}`);
  console.log(`Long format:   ${formatDate(currentDate, 'long')}`);
  console.log(`ISO format:    ${formatDate(currentDate, 'iso')}`);
  console.log();

  // Example with a specific date
  const specificDate = new Date('2026-12-25');
  console.log('Specific Date (Christmas 2026):');
  console.log(`Short format:  ${formatDate(specificDate, 'short')}`);
  console.log(`Long format:   ${formatDate(specificDate, 'long')}`);
  console.log(`ISO format:    ${formatDate(specificDate, 'iso')}`);
}

// Run the application
if (require.main === module) {
  main();
}

// Export for testing or module usage
module.exports = { main };

// Made with Bob
