const axios = require('axios');
const dotenv = require("dotenv");

const OpenAI = require('openai');
dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: API_KEY,
});

// Function to query OpenAI
async function queryOpenAI(prompt) {
    try {
        const stream = await openai.beta.chat.completions.stream({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.9,
        });

        let fullResponse = ""; // Accumulate the response text

        // Listen for content events
        stream.on('content', (delta) => {
            process.stdout.write(delta); // Optionally log each chunk
            fullResponse += delta; // Append each chunk to the full response
        });

        // Wait for the final chat completion object
        const chatCompletion = await stream.finalChatCompletion();

        console.log("\nFinal Response:", fullResponse);
        return {
            text: fullResponse, // Combined text from the stream
            completion: chatCompletion, // Full structured response object
        };
    } catch (error) {
        console.error("Error querying OpenAI:", error);
        throw error;
    }
}

// // Example usage
// (async () => {
//     const result = await queryOpenAI("What is the capital of India?");
//     console.log("\nAggregated Response:", result.text);
//     console.log("Structured Completion Object:", result.completion);
// })();

module.exports = queryOpenAI;
