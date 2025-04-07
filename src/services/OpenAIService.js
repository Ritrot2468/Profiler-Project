
//const dotenv = require("dotenv");
const OpenAI = require('openai');
const config = require("../config");

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});


/**
 * Query OpenAI with a prompt and stream the completion.
 * @param {string} prompt - The company or input to analyze
 * @returns {Promise<Object>} The full response including streamed text and structured completion
 */
async function queryOpenAI(prompt) {
    try {
        const stream = await openai.beta.chat.completions.stream({
            model: 'gpt-4o-search-preview',
            web_search_options: {},
            messages: [
                {
                    role: "user",
                    content: `You are an assistant that summarizes relevant funding data and research news for the company named ${prompt}`
                }
            ]
        });

        let fullResponse = "";

        stream.on('content', (delta) => {
            fullResponse += delta;
        });

        const chatCompletion = await stream.finalChatCompletion();

        return {
            text: fullResponse,
            completion: chatCompletion
        };
    } catch (error) {
        console.error("❌ Error querying OpenAI:", error);
        throw error;
    }
}

/**
 * External interface to query OpenAI for company data.
 * @param {string} accountName - Company or organization name
 * @returns {Promise<Object>} OpenAI result object
 */
async function sendDataToOpenAI(accountName) {
    return await queryOpenAI(accountName);
}

module.exports = {
    queryOpenAI,
    sendDataToOpenAI
};