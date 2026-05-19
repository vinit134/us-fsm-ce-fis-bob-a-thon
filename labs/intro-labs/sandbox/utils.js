/**
 * Utility functions for the Sandbox Application
 */

/**
 * Formats a date object into a readable string format
 * @param {Date} date - The date object to format
 * @param {string} format - Format type: 'short', 'long', or 'iso' (default: 'short')
 * @returns {string} Formatted date string
 * 
 * Examples:
 *   formatDate(new Date(), 'short')  // "05/19/2026"
 *   formatDate(new Date(), 'long')   // "May 19, 2026"
 *   formatDate(new Date(), 'iso')    // "2026-05-19"
 */
function formatDate(date, format = 'short') {
  /**
   * ERROR HANDLING IMPORTANCE:
   * Date formatting is critical because:
   * 1. Invalid dates can crash the application if not caught
   * 2. User input or external data may provide unexpected values
   * 3. Graceful error handling improves user experience
   * 4. Clear error messages help developers debug issues quickly
   * 5. Prevents silent failures that are hard to trace
   */
  
  try {
    // Validate input - check if date parameter exists
    if (!date) {
      throw new Error('Date parameter is required');
    }

    // Validate that date is a Date object
    if (!(date instanceof Date)) {
      throw new Error('Parameter must be a Date object');
    }

    // Validate that date is valid (not NaN)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date provided - date is not valid');
    }

    // Validate format parameter
    const validFormats = ['short', 'long', 'iso'];
    if (format && !validFormats.includes(format)) {
      console.warn(`Invalid format '${format}' provided. Using 'short' as default.`);
      format = 'short';
    }

    // Format based on type
    switch (format) {
      case 'short':
        // MM/DD/YYYY format
        return date.toLocaleDateString('en-US');
      
      case 'long':
        // Month DD, YYYY format
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'iso':
        // YYYY-MM-DD format
        return date.toISOString().split('T')[0];
      
      default:
        return date.toLocaleDateString('en-US');
    }
  } catch (error) {
    // Catch and re-throw with more context
    throw new Error(`Date formatting failed: ${error.message}`);
  }
}

// Export for use in other modules
module.exports = { formatDate };

// Made with Bob
