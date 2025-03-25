const automation = require("./automation.js");
const ActionsGrouper = require("./actionsgrouper.js").ActionsGrouper;
const { OpenAI } = require('openai');
const openaiUtils = require("./openaiutils.js");
const config = require("../../config.js");

// Constants
const DEBOUNCE_DELAY_MS = 3000;
const LAST_N_ACTIONS = 20;
const MIN_ACTIONS_FOR_PREDICTION = 3;
const OPENAI_CONFIG = {
    model: "gpt-3.5-turbo-instruct",
    max_tokens: 2048,
    temperature: 0.1,
    logprobs: 5
};

// State variables
const actions_grouper = new ActionsGrouper();
const action_groups = [];
let lastPredictionResult = null;
let debounceTimer = null;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
});

const log = (...args) => console.log("  HOST", ...args);

/**
 * Creates a prompt for OpenAI based on action history
 * @param {Array} actions - Action groups to include in the prompt
 * @returns {string} Formatted prompt
 */
const createPrompt = (actions) =>
    "You are a JSON generator. Your only job is to return valid JSON with no explanations. " +
    "Given the action history, predict the next 10 likely actions in the same format.\n\n" +
    `Given this action history: ${JSON.stringify(actions)}, predict the next likely actions in the same format. Return only valid JSON.`;

/**
 * Determines if we have enough confidence to be "sure" about a prediction
 * @param {string} level - Confidence level
 * @returns {boolean} True if confidence is high enough
 */
const isConfidentPrediction = (level) => ["HIGH", "MEDIUM"].includes(level);

/**
 * Makes a prediction using OpenAI API
 * @returns {Promise<Object>} Result object with event and optional data
 */
async function debouncedOpenAIPrediction() {
    const limitedActionGroups = action_groups.slice(-LAST_N_ACTIONS);
    log("Requesting autocomplete with the following actionGroups", limitedActionGroups);

    try {
        const response = await openai.completions.create({
            ...OPENAI_CONFIG,
            prompt: createPrompt(limitedActionGroups)
        });

        const result = openaiUtils.processOpenAIResponse(response);
        lastPredictionResult = result;

        if (!result.success) {
            log("Error processing OpenAI response:", result.error);
            return { "event": "IM NOT SURE" };
        }

        // Log usage stats if available
        if (response.usage) {
            const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
            log(`Token usage - Prompt: ${prompt_tokens} | Completion: ${completion_tokens} | Total: ${total_tokens}`);
        }

        log("Extracted", result.actions.length, "actions from prediction");

        return isConfidentPrediction(result.confidence.level)
            ? { "event": "IM SURE", "sureness": result.confidence }
            : { "event": "IM NOT SURE" };

    } catch (error) {
        log("Error calling OpenAI API:", error);
        return { "event": "OPENAI_ERROR", "error": error.message };
    }
}

/**
 * Handles a new action from the user
 * @param {Object} msg - Message containing the action
 * @returns {Promise<Object>} Result of prediction or status
 */
async function handleAction(msg) {
    const action_group = actions_grouper.append(msg["action"]);
    if (!action_group || action_group.length === 0) return;

    action_groups.push(action_group);

    if (action_groups.length < MIN_ACTIONS_FOR_PREDICTION) {
        log(`Not enough actions yet, need at least ${MIN_ACTIONS_FOR_PREDICTION} actions to make a prediction`);
        return { "event": "NOT_ENOUGH_ACTIONS" };
    }

    // Clear existing timer and set a new one
    clearTimeout(debounceTimer);

    return new Promise(resolve => {
        debounceTimer = setTimeout(async() => {
            resolve(await debouncedOpenAIPrediction());
        }, DEBOUNCE_DELAY_MS);
    });
}

/**
 * Handles user pressing start in the UI
 * @param {number} repetitions - Number of repetitions requested
 * @returns {Promise<Object>} Result of automation attempt
 */
async function handleUserPressedStart(repetitions) {
    // TODO: use this
    repetitions;
    try {
        // Force immediate prediction if we're in the middle of debouncing
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;

            if (action_groups.length >= MIN_ACTIONS_FOR_PREDICTION) {
                await debouncedOpenAIPrediction();
            }
        }

        // Validate prediction
        if (!lastPredictionResult?.success || !lastPredictionResult?.actions) {
            log("No valid prediction available");
            return { "event": "NO_VALID_PREDICTION" };
        }

        // Log warnings for low confidence
        const { confidence, actions } = lastPredictionResult;
        if (["LOW", "VERY_LOW"].includes(confidence.level)) {
            log("WARNING: Low confidence prediction. Consider reviewing actions before execution.");
        }

        // Log execution details
        log(`Triggering ${actions.length} actions with confidence ${confidence.score.toFixed(4)} (${confidence.level})`);

        // Execute automation
        return await automation.triggerActions(actions);
    } catch (error) {
        log("Error in handleUserPressedStart:", error);
        return { "event": "ERROR", "error": error.message };
    }
}

module.exports = {
    handleAction,
    handleUserPressedStart,
    haltAutomation: automation.haltAutomation,
    changeSpeed: automation.changeSpeed,
};
