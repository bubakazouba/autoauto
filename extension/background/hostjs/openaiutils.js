/**
 * Utility functions for processing OpenAI API responses and calculating confidence scores
 */

// const log = function(...args) {
//     console.log("  OPENAIUTILS", ...args);
// };

const { parseRobustly, extractActions } = require('./jsonutils');

// Confidence thresholds for prediction quality
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.85,    // High confidence (85% or higher)
    MEDIUM: 0.70,  // Medium confidence (70% to 85%)
    LOW: 0.50      // Low confidence (50% to 70%)
    // Below 50% is considered very low confidence
};

/**
 * Calculate confidence score from token logprobs
 * @param {Array} tokenLogprobs - Array of log probabilities for each token
 * @returns {Object} - Confidence metrics including score and level
 */
function calculateConfidence(tokenLogprobs) {
    if (!tokenLogprobs || tokenLogprobs.length === 0) {
        return { score: 0, level: "UNKNOWN" };
    }
    
    // Filter out null values and calculate average logprob
    const validLogprobs = tokenLogprobs.filter(lp => lp !== null);
    if (validLogprobs.length === 0) {
        return { score: 0, level: "UNKNOWN" };
    }
    
    const avgLogprob = validLogprobs.reduce((sum, lp) => sum + lp, 0) / validLogprobs.length;
    const confidenceScore = Math.exp(avgLogprob); // Convert from log space to probability
    
    // Determine confidence level based on thresholds
    let confidenceLevel;
    if (confidenceScore >= CONFIDENCE_THRESHOLDS.HIGH) {
        confidenceLevel = "HIGH";
    } else if (confidenceScore >= CONFIDENCE_THRESHOLDS.MEDIUM) {
        confidenceLevel = "MEDIUM";
    } else if (confidenceScore >= CONFIDENCE_THRESHOLDS.LOW) {
        confidenceLevel = "LOW";
    } else {
        confidenceLevel = "VERY_LOW";
    }
    
    return {
        score: confidenceScore,
        level: confidenceLevel,
        avgLogprob: avgLogprob
    };
}

/**
 * Process OpenAI response to extract prediction and confidence
 * @param {Object} response - The OpenAI API response
 * @param {number} limit - Maximum number of actions to extract
 * @returns {Object} - Object containing prediction, actions, and confidence
 */
function processOpenAIResponse(response, limit = Infinity) {
    if (!response || !response.choices || response.choices.length === 0) {
        return {
            success: false,
            error: "Invalid or empty response from OpenAI",
            confidence: { score: 0, level: "UNKNOWN" }
        };
    }
    
    const choice = response.choices[0];
    const prediction = choice.text;
    
    // Calculate confidence if logprobs are available
    let confidence = { score: 0, level: "UNKNOWN" };
    let leastConfidentTokens = [];
    
    if (choice.logprobs && choice.logprobs.token_logprobs) {
        confidence = calculateConfidence(choice.logprobs.token_logprobs);
        
        // Get the least confident tokens for debugging
        const tokens = choice.logprobs.tokens;
        const tokenLogprobs = choice.logprobs.token_logprobs;
        if (tokens && tokenLogprobs) {
            const tokenConfidencePairs = tokens.map((token, i) => ({
                token,
                logprob: tokenLogprobs[i] || -Infinity
            })).sort((a, b) => a.logprob - b.logprob);
            
            leastConfidentTokens = tokenConfidencePairs.slice(0, 3);
        }
    }
    
    // Try to parse the prediction as JSON
    try {
        const parsedPrediction = parseRobustly(prediction);
        const actions = extractActions(parsedPrediction, limit);
        
        return {
            success: true,
            rawPrediction: prediction,
            parsedPrediction: parsedPrediction,
            actions: actions,
            confidence: confidence,
            leastConfidentTokens: leastConfidentTokens
        };
    } catch (e) {
        return {
            success: false,
            error: "Failed to parse prediction as JSON",
            rawPrediction: prediction,
            errorDetails: e.message,
            confidence: confidence,
            leastConfidentTokens: leastConfidentTokens
        };
    }
}

module.exports = {
    calculateConfidence,
    processOpenAIResponse,
    CONFIDENCE_THRESHOLDS
};
