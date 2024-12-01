const axios = require('axios');
const dotenv = require("dotenv");

const OpenAI = require('openai');
dotenv.config();



const API_KEY = process.env.OPENAI_API_KEY;


const openai = new OpenAI({
    apiKey: API_KEY, // This is the default and can be omitted
});


// Function to query OpenAI
async function queryOpenAI(prompt) {
    const stream = await openai.beta.chat.completions.stream({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.9,
    });

    stream.on('content', (delta, snapshot) => {
        process.stdout.write(delta);
    });

    const chatCompletion = await stream.finalChatCompletion();
    console.log(chatCompletion); // {id: "…", choices: […], …}

}

queryOpenAI('What is the capital of France?');