/**
 * Test file to demonstrate using logprobs parameter with OpenAI API
 * This helps in getting confidence levels from completions
 */

const { OpenAI } = require('openai');
const config = require('./config.js');

// Initialize OpenAI client with API key from config
const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
});

// Sample action history from host.js - CASE 1: Normal sequence
const action_groups_normal = [
    [
        { "type": "click", "selector": "#submit-button" },
        { "type": "input", "selector": "#username", "value": "testuser" }
    ],
    [
        { "type": "input", "selector": "#password", "value": "password123" },
        { "type": "click", "selector": "#login-button" }
    ]
];

// CASE 2: Limited context (just one element) - should have lower confidence
const action_groups_limited = [
    [
        { "type": "click", "selector": "#some-random-button" }
    ]
];

// Function to get prediction with logprobs
async function getPredictionWithConfidence(action_groups, case_name) {
    console.log(`\n\n========== TESTING ${case_name} ==========`);
    console.log("Action groups:", JSON.stringify(action_groups));
    console.log("Getting prediction with confidence using logprobs...");
    
    // Create a prompt similar to what's used in host.js
    const prompt = "You are a JSON generator. Your only job is to return valid JSON with no explanations. Given the action history, predict the next likely actions in the same format.\n\nGiven this action history: " + 
                   JSON.stringify(action_groups) + 
                   ", predict the next likely actions in the same format. Return only valid JSON.";
    
    try {
        // Make API call with logprobs parameter
        // Note: logprobs is only available with certain models like davinci
        const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",  // This model supports logprobs
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.1,
            logprobs: 5,  // Return top 5 token probabilities
            echo: false    // Don't include prompt in the response
        });
        
        if (response.choices && response.choices.length > 0) {
            const choice = response.choices[0];
            
            console.log("\n=== COMPLETION TEXT ===");
            console.log(choice.text);
            
            // Extract and analyze logprobs
            if (choice.logprobs) {
                // Get the tokens and their logprobs
                const tokens = choice.logprobs.tokens;
                const tokenLogprobs = choice.logprobs.token_logprobs;
                
                // Calculate average logprob as a simple confidence measure
                const validLogprobs = tokenLogprobs.filter(lp => lp !== null);
                const avgLogprob = validLogprobs.reduce((sum, lp) => sum + lp, 0) / validLogprobs.length;
                const confidence = Math.exp(avgLogprob); // Convert from log space to probability
                
                console.log("\n=== CONFIDENCE METRICS ===");
                console.log(`Average LogProb: ${avgLogprob}`);
                console.log(`Confidence Score (exp of avg logprob): ${confidence}`);
                
                // Find the tokens with lowest confidence (highest uncertainty)
                const tokenConfidencePairs = tokens.map((token, i) => ({
                    token,
                    logprob: tokenLogprobs[i] || -Infinity
                }));
                
                // Sort by logprob (ascending = least confident first)
                tokenConfidencePairs.sort((a, b) => a.logprob - b.logprob);
                
                console.log("\n=== LEAST CONFIDENT TOKENS (TOP 5) ===");
                for (let i = 0; i < Math.min(5, tokenConfidencePairs.length); i++) {
                    const pair = tokenConfidencePairs[i];
                    console.log(`Token: "${pair.token}", LogProb: ${pair.logprob}`);
                }
                
                return { confidence, text: choice.text };
            } else {
                console.log("No logprobs returned in the response");
                return { confidence: 0, text: choice.text };
            }
        }
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return { confidence: 0, text: null };
    }
}

// Run both test cases and compare
async function runTests() {
    const result1 = await getPredictionWithConfidence(action_groups_normal, "NORMAL CASE");
    const result2 = await getPredictionWithConfidence(action_groups_limited, "LIMITED CONTEXT CASE");
    
    console.log("\n\n========== COMPARISON ==========");
    console.log(`Normal case confidence: ${result1.confidence}`);
    console.log(`Limited context confidence: ${result2.confidence}`);
    console.log(`Confidence difference: ${result1.confidence - result2.confidence}`);
    
    if (result1.confidence > result2.confidence) {
        console.log("As expected, the normal case has higher confidence than the limited context case.");
    } else {
        console.log("Interestingly, the limited context case has higher or equal confidence compared to the normal case.");
    }
}

// Run the tests
runTests();
