// routes.js
const express = require("express");
const { calculateFundingScore, saveToExcel, sendGoogleSearchResponse, parseFundingAmounts, parseAndSaveFundingAmounts} = require("./util");
const fs = require("fs");
const axios = require("axios");
const {BACKEND_URL} = require("./config");
const {sendDataToOpenAI, queryOpenAI} = require("./openai");

const router = express.Router();


const filePath = "product_scores.json";
const productScores = JSON.parse(fs.readFileSync(filePath, "utf-8"));
const segmentScoreMap = {
    ACAD: 1,
    BTCH: 10,
    APPL: 2,
    DX: 10,
    HOSP: 2,
    REF: 10,
    "LIFE SCI": 2,
    "unclassified": 0
};

router.get('search/:query', async (req, res) => {
    const query = req.params.query;

    try {
        const response = await sendGoogleSearchResponse(query);
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: "An unexpected error occurred" });
    }
})
router.get('search/:accountName', async (req, res) => {
    const { accountName } = req.params;
    const { productCode, segment } = req.query;

    if (!accountName || !productCode || !segment) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const response = sendGoogleSearchResponse(accountName);
        console.log(response)
        const gptResponse = await sendDataToOpenAI(response);
        console.log(gptResponse)
        const accountData = parseAndSaveFundingAmounts(response, accountName, productCode, segment, gptResponse);
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