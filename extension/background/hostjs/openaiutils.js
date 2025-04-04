/**
 * Utility functions for processing OpenAI API responses and calculating confidence scores
 */

// const log = function(...args) {
//     console.log("  OPENAIUTILS", ...args);
// };

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
function createConfidenceObject(confidenceScore) {
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
    };
}

/**
 * Process OpenAI response to extract prediction and confidence
 * @param {Object} response - The OpenAI API response
 * @returns {Object} - Object containing prediction, actions, and confidence
 */
function processOpenAIResponse(response) {
    if (!response || !response.choices || response.choices.length === 0) {
        return {
            success: false,
            error: "Invalid or empty response from OpenAI",
            confidence: { score: 0, level: "UNKNOWN" }
        };
    }
    const choices = response.choices;
    const prediction = JSON.parse(choices[0].message.content);
    const actions = prediction.actions;
    const confidence = prediction.confidence;
    // const choice = choices[0];
    // const prediction = JSON.parse(choice.text);
    
    // Try to parse the prediction as JSON
    try {
        // const parsedPrediction = parseRobustly(prediction);
        // const actions = extractActions(parsedPrediction);
        
        return {
            success: true,
            rawPrediction: prediction,
            actions: actions,
            confidence: createConfidenceObject(confidence),
        };
    } catch (e) {
        return {
            success: false,
            error: "Failed to parse prediction as JSON",
            rawPrediction: prediction,
            errorDetails: e.message,
            confidence: createConfidenceObject(confidence),
        };
    }
}

module.exports = {
    processOpenAIResponse,
    CONFIDENCE_THRESHOLDS
};
