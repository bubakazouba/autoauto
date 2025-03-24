const automation = require("./automation.js");
const ActionsGrouper = require("./actionsgrouper.js").ActionsGrouper;
const { OpenAI } = require('openai');
const openaiUtils = require("./openaiutils.js");
const config = require("../config.js");

const actions_grouper = new ActionsGrouper();
const log = function(...args) {
    console.log("  HOST", ...args);
};

// Initialize OpenAI client with API key from config file
const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
});

// Store the last prediction result for use in handleUserPressedStart
let lastPredictionResult = null;

const action_groups = [];
async function handleAction(msg) {
    let action_group = actions_grouper.append(msg["action"]);
    if (!action_group || action_group.length == 0) {
        return;
    }
    action_groups.push(action_group);
    
    // Check if we have at least 3 actions before making a prediction
    if (action_groups.length < 3) {
        log("Not enough actions yet, need at least 3 actions to make a prediction");
        return { "event": "NOT_ENOUGH_ACTIONS" };
    }
    
    // Limit to the last 20 actions to avoid token limits
    const limitedActionGroups = action_groups.slice(-20);
    
    log("./././action_groups=", limitedActionGroups);
    // Create a prompt for OpenAI to predict the next actions
    const prompt = "You are a JSON generator. Your only job is to return valid JSON with no explanations. Given the action history, predict the next 10 likely actions in the same format.\n\nGiven this action history: " + JSON.stringify(limitedActionGroups) + ", predict the next likely actions in the same format. Return only valid JSON.";
    
    try {
        // Make the API call to OpenAI using completions endpoint with logprobs
        const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: prompt,
            max_tokens: 2048,  // Increased from 1000 to 2048 to generate more tokens
            temperature: 0.1,
            logprobs: 5  // Request logprobs to calculate confidence
        });
        
        // Process the response using openaiUtils
        const result = openaiUtils.processOpenAIResponse(response);
        
        // Store the result for later use in handleUserPressedStart
        lastPredictionResult = result;
        
        if (result.success) {
            // Log token usage information from the OpenAI API response
            if (response.usage) {
                log("Token usage - Prompt:", response.usage.prompt_tokens, 
                    "| Completion:", response.usage.completion_tokens,
                    "| Total:", response.usage.total_tokens);
            }
            // Log the number of actions extracted
            log("Extracted", result.actions.length, "actions from prediction");
            
            // Return IM SURE or IM NOT SURE based on confidence level
            if (result.confidence.level === "HIGH" || result.confidence.level === "MEDIUM") {
                return { 
                    "event": "IM SURE", 
                    "sureness": result.confidence 
                };
            } else {
                return { 
                    "event": "IM NOT SURE" 
                };
            }
        } else {
            log("Error processing OpenAI response:", result.error, "Raw response:", result.rawPrediction);
            return { 
                "event": "IM NOT SURE"
            };
        }
    } catch (error) {
        log("Error calling OpenAI API:", error);
        return { "event": "OPENAI_ERROR", "error": error.message };
    }
}

async function handleUserPressedStart(repetitions) {
    repetitions; // We can't use this until we have some sort of control over the LLM in terms of it returning exactly 1 user story
    try {
        // Use the latest prediction result instead of making a new API call
        if (!lastPredictionResult || !lastPredictionResult.success || !lastPredictionResult.actions) {
            log("No valid prediction available");
            return { "event": "NO_VALID_PREDICTION" };
        }
    
        // Log warning for low confidence predictions
        if (lastPredictionResult.confidence.level === "LOW" || lastPredictionResult.confidence.level === "VERY_LOW") {
            log("WARNING: Low confidence prediction. Consider reviewing actions before execution.");
        }
        
        // Include confidence in the log before triggering actions
        log(`Triggering ${lastPredictionResult.actions.length} actions with confidence ${lastPredictionResult.confidence.score.toFixed(4)} (${lastPredictionResult.confidence.level})`);
        log("lastPredictionResult=", lastPredictionResult);
        
        // Trigger the actions using the automation module
        return await automation.triggerActions(lastPredictionResult.actions);
    } catch (error) {
        log("Error in handleUserPressedStart:", error);
        return { "event": "ERROR", "error": error.message };
    }
}

function haltAutomation() {
    return automation.haltAutomation();
}

function changeSpeed(mode) {
    return automation.changeSpeed(mode);
}

module.exports = {
    handleAction: handleAction,
    handleUserPressedStart: handleUserPressedStart,
    haltAutomation: haltAutomation,
    changeSpeed: changeSpeed,
};
