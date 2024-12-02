
const dotenv = require("dotenv");
const fetch = require('node-fetch');

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
            messages: [ {role: "system", content: "You are an assistant that summarizes funding data for the given account."},
                { role: 'user', content: prompt }],
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

// Your array of data
const data = [ /* your JSON data here */ ];

// Function to send data to OpenAI
async function sendDataToOpenAI(data) {
    const formattedContent = data.map((item, index) => {
        return `Entry ${index + 1}:\nTitle: ${item.Title}\nLink: ${item.Link}\nSnippet: ${item.Snippet}`;
    }).join('\n\n');

    console.log("formattedContent: ", formattedContent)

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are an assistant that summarizes web search results." },
                { role: "user", content: `Here is a set of web search results. Please summarize their main themes:\n\n${formattedContent}` }
            ]
        })
    });

    return await apiResponse.json();
}
//
// sendDataToOpenAI(
//     [
//         {
//             "Title": "Amgen Foundation Grants | Amgen",
//             "Link": "https://www.amgen.com/responsibility/healthy-society/community-investment/amgen-foundation/amgen-foundation-grants",
//             "Snippet": "Each year, the Foundation awards grants to local, regional, and international nonprofit organizations whose programs are replicable, scalable and designed to ..."
//
//         },
//         {
//             "Title": "Amgen Foundation Community Grants: Supporting Local Change",
//             "Link": "https://www.amgenfoundation.org/community/community-grants",
//             "Snippet": "The Amgen Foundation helps strengthen communities in the US and Puerto Rico where Amgen staff live and work."
//
//         },
//         {
//             "Title": "Independent Medical Education Funding | Amgen",
//             "Link": "https://www.amgen.com/responsibility/healthy-society/community-investment/independent-medical-education-funding",
//             "Snippet": "Amgen supports IME that address: · Alignment of the proposed IME program to established educational goals focused on unmet clinical, educational or professional ...",
//         },
//         {
//             "Title": "The Amgen Foundation - Promoting Science Education & Literacy",
//             "Link": "https://www.amgenfoundation.org/",
//             "Snippet": "The Amgen Foundation is working to reimagine science education, improve science literacy and empower diverse thinkers to solve the world's greatest ...",
//
//         },
//         {
//             "Title": "Amgen Foundation Grant Guidelines | Amgen",
//             "Link": "https://www.amgen.com/responsibility/healthy-society/community-investment/amgen-foundation/amgen-foundation-grants/amgen-foundation-grant-guidelines",
//             "Snippet": "Amgen Foundation Grant Guidelines · Organizations may only submit one request a year for funding. · The Foundation's review committees meet quarterly. · U.S., ...",
//
//         },
//         {
//             "Title": "Grants and Giving | Amgen Australia",
//             "Link": "https://www.amgen.com.au/en/responsibility/grants-and-giving",
//             "Snippet": "Australian staff members receive two paid charity leave days each year enabling them to help strengthen and enrich our local communities. In addition, Amgen ...",
//         },
//     ]
// );


// // Example usage
// (async () => {
//     const result = await queryOpenAI("What is the capital of India?");
//     console.log("\nAggregated Response:", result.text);
//     console.log("Structured Completion Object:", result.completion);
// })();

module.exports = {queryOpenAI,
    sendDataToOpenAI};
