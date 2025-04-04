const automation = require("./automation.js");
// const ActionsGrouper = require("./actionsgrouper.js").ActionsGrouper;
const { OpenAI } = require('openai');
const openaiUtils = require("./openaiutils.js");
const config = require("../../config.js");

// Constants
const DEBOUNCE_DELAY_MS = 3000;
const LAST_N_ACTIONS = 40;
const MIN_ACTIONS_FOR_PREDICTION = 3;
const OPENAI_CONFIG = {
    model: "chatgpt-4o-latest",
    max_tokens: 10000,
    temperature: 0.1,
};

// State variables
// const actions_grouper = new ActionsGrouper();
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
// const createPrompt = (actions) =>
//     "You are a JSON generator. Your only job is to return valid JSON with no explanations. " +
//     "Given the action history, predict the next 10 likely actions in the same format.\n\n" +
//     `Given this action history: ${JSON.stringify(actions)}, predict the next likely actions in the same format. Return only valid JSON.`;
const SYSTEM_PROMPT = `
You are a repetitive action predictor.

You will be provided with a user action history where they are potentially doing a repetitive task.

Either return {'result': 'no_repetition'} if you don't think there was any repetitiveness. Or return a JSON with the following schema if you detect repetitiveness:
    {"success": "true", "confidence": <your confidence level here as a float from 0 to 1>,
    "actions": <a json array with the schema provided below>}

Given the action history provided by the user, predict the next likely sequence of actions. Predict as many actions as necessary to complete the user's objective.
Note: The user is probably doing a data entry task. Pay attention to where data is being retrieved from and where it's going and what data manipulation is happening. Differentiate between read-only actions and manipulation actions. (e.g. a meta+c is a copy action which is a read-ony action)
Note: the user will also provide you with some context of the page where they are doing these actions. this could be a csv if it's a spreadsheet or an HTML document for any web page. So for example, the user might complete the data entry task for a few rows in a spreadsheet, and you are basically asked to complete the rest of the rows.

"actions" json array schema:
{
    "tab": {
        id: <int>
        index: <int>
    }
    "action": {
        "element_id": "0.2.7",
        "type": "CLICK",
        "element_node": "button"
    }
}
or
{
    "tab": {
        id: <int>
        index: <int>
    }
    "action": {
        "element_id": "C4", // Refers to a cell in a spreadsheet
        "keyGroup": "73", // Enter the value "73" into the cell "C4"
        "type": "KEY_GROUP_INPUT", // KEY_GROUP_INPUT is the preferred approach
        "element_node": "0"
    }
}

Return only valid JSON.`;

const createUserPrompt = (actions) => {
    let tabIds = [...new Set(actions.map(a => a.tab.id))];
    let actionsPart = new Promise((resolve) => {
        resolve({ data: JSON.stringify(actions) });
    });
    let tabIdsPromises = tabIds.map(tabId => getPageContent(tabId));
    return Promise.all([actionsPart, ...tabIdsPromises]).then(values => {
        return values[0].data + "\n\n" + values.slice(1).map(v => "<CSV>"+v.data+"</CSV>");
    });
};

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
        const response = await openai.chat.completions.create({
            ...OPENAI_CONFIG,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: await createUserPrompt(limitedActionGroups) }
            ]
        });

        const result = openaiUtils.processOpenAIResponse(response);
        lastPredictionResult = result;
        log(lastPredictionResult);

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
    // const action_group = actions_grouper.append(msg["action"]);
    // if (!action_group || action_group.length === 0) return;

    // action_groups.push(action_group);
    action_groups.push(msg["action"]);

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

function getPageContent(tabId) {
    let request = { action: 'GET_PAGE_DATA', params: {} };
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, request, response => {
            resolve(response);
        });
    });
}

module.exports = {
    handleAction,
    handleUserPressedStart,
    haltAutomation: automation.haltAutomation,
    changeSpeed: automation.changeSpeed,
};
