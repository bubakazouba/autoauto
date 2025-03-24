/**
 * Utility functions for handling JSON parsing with special handling for incomplete or malformed responses
 */

// const log = function(...args) {
//     console.log("  JSONUTILS", ...args);
// };

/**
 * Extract actions from various prediction formats
 * @param {Object|Array} parsedPrediction - The parsed prediction object or array
 * @returns {Array} - Array of actions
 */
function extractActions(actionsToTrigger) {
    // Check if we have an array of arrays and flatten it
    if (!actionsToTrigger.length) {
        return [];
    }
    if (Array.isArray(actionsToTrigger[0])) {
        // Flatten the array of arrays into a single array
        actionsToTrigger = actionsToTrigger.flatMap(item => item);
    }
    
    return actionsToTrigger;
}

/**
 * Parse potentially malformed or incomplete JSON responses
 * Handles:
 * - Empty arrays
 * - Cut-off responses due to token limits
 * - Arrays not properly wrapped in outer array
 * 
 * @param {string} jsonString - The raw JSON string to parse
 * @param {boolean} filterEmptyArrays - Whether to filter out empty arrays from the result
 * @returns {Object|Array} - The parsed JSON object or array
 * @throws {Error} - If parsing fails completely
 */
function parseRobustly(jsonString, filterEmptyArrays = true) {
    // Clean up the response
    let cleanedPrediction = jsonString.trim();
    let parsedPrediction;
    
    // First attempt: Try to parse as-is
    try {
        parsedPrediction = JSON.parse(cleanedPrediction);
    } catch (e) {
        // Second attempt: Try to extract valid arrays using regex
        try {
            const arrayPattern = /\[\s*\{.*?\}\s*\]/gs;
            const matches = [...jsonString.matchAll(arrayPattern)];
            
            if (matches && matches.length > 0) {
                // Extract all valid arrays
                const validArrays = matches.map(match => {
                    try {
                        return JSON.parse(match[0]);
                    } catch (e) {
                        return null;
                    }
                }).filter(arr => arr !== null);
                
                if (validArrays.length > 0) {
                    parsedPrediction = validArrays;
                } else {
                    throw new Error("No valid arrays found in response");
                }
            } else {
                // Special case for the example with empty arrays
                if (jsonString.includes('[],')) {
                    const parts = jsonString.split('[],');
                    if (parts.length > 1) {
                        // Try to extract valid arrays from the remaining parts
                        const remainingJson = '[' + parts.slice(1).join('[],');
                        try {
                            return parseRobustly(remainingJson, filterEmptyArrays);
                        } catch (specialError) {
                            // If that fails too, just return an empty array rather than throwing
                            return [];
                        }
                    }
                }
                
                // For incomplete JSON like '[{"complete": true},{"incomplete":'
                // Try to extract the complete part
                if (jsonString.includes('{') && jsonString.includes('}')) {
                    const objectPattern = /\{[^{}]*\}/g;
                    const objectMatches = [...jsonString.matchAll(objectPattern)];
                    
                    if (objectMatches && objectMatches.length > 0) {
                        // Extract all valid objects
                        const validObjects = objectMatches.map(match => {
                            try {
                                return JSON.parse(match[0]);
                            } catch (e) {
                                return null;
                            }
                        }).filter(obj => obj !== null);
                        
                        if (validObjects.length > 0) {
                            // Return the valid objects wrapped in an array
                            return validObjects;
                        }
                    }
                }
                
                // If all else fails, return an empty array
                return [];
            }
        } catch (innerError) {
            // If we get here, we've tried everything and failed
            // Just return an empty array instead of throwing
            return [];
        }
    }
    
    // Skip empty arrays if requested
    if (filterEmptyArrays && Array.isArray(parsedPrediction)) {
        if (Array.isArray(parsedPrediction[0])) {
            // Handle array of arrays
            parsedPrediction = parsedPrediction.filter(item => {
                return Array.isArray(item) ? item.length > 0 : true;
            });
        }
        
        // Don't throw on empty arrays, just return an empty array
        if (parsedPrediction.length === 0) {
            return [];
        }
    }
    
    return parsedPrediction;
}



module.exports = {
    parseRobustly,
    extractActions
};
