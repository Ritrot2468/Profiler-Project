// routes.js
const express = require("express");
const { parseAndSaveFundingAmounts } = require("../src/util");
const { queryOpenAI } = require("../src/services/OpenAIService");

const router = express.Router();


router.get('/search/:accountName', async (req, res) => {
    const { accountName } = req.params;
    const { productCode, segment } = req.query;

    if (!accountName || !productCode || !segment) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        console.log("about to request")
        const accountData = await parseAndSaveFundingAmounts(accountName,productCode,segment)
        res.status(200).json(accountData);
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

router.get("/", (req, res) => {
    res.send("Welcome to the Search API! Use /search/:accountName to perform a search.");
});

router.post("chat", async (req, res) => {

    const {prompt} = req.body;
    console.log(prompt)
    try {
        const response = await queryOpenAI(prompt); // Call your function
        res.status(200).send(response);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Something went wrong' });
    }
})

module.exports = router;