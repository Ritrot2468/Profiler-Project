// routes.js
const express = require("express");
const { calculateFundingScore, saveToExcel, sendGoogleSearchResponse, parseFundingAmounts } = require("./util");
const fs = require("fs");
const queryOpenAI = require("./openai");
const axios = require("axios");
const {BACKEND_URL} = require("./config");

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

router.get('/search/:query', async (req, res) => {
    const query = req.params.query;

    try {
        const response = await sendGoogleSearchResponse(query);
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: "An unexpected error occurred" });
    }
})
router.get('/search/:accountName', async (req, res) => {
    const { accountName } = req.params;
    const { productCode, segment } = req.query;

    if (!accountName || !productCode || !segment) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const response = await sendGoogleSearchResponse(accountName);
        const gptResponse = await axios.post(`${BACKEND_URL}/query`, {
            prompt: response + `What is the funding amount for ${query}`
        })
        const fundingResults = parseFundingAmounts(response);
        const uniqueFundingAmounts = new Set(
            fundingResults.map((result) => {
                const parsedAmount = parseFloat(result.FundingAmount.replace(/[$,]/g, ""));
                return parsedAmount;
            })
        );

        const fundingAmount = Array.from(uniqueFundingAmounts).reduce((sum, amount) => sum + amount, 0);
        const fundingScore = calculateFundingScore(fundingAmount);

        // search for product score
        const productScore =
            productScores.find(
                (ps) =>
                    ps.product === productCode || ps.part_number === productCode
            )?.product_score || 0;

        const segmentScore = segmentScoreMap[segment] || 0;

        const totalScore = productScore + segmentScore + fundingScore;
        const priority = totalScore >= 12 ? "Multiple Contacts" : "Single Contact";

        const accountData = {
            account_name: accountName,
            product_or_part_number: productCode,
            segment,
            funding_amount: fundingAmount,
            product_score: productScore,
            segment_score: segmentScore,
            funding_score: fundingScore,
            total_score: totalScore,
            priority,
            gptResponse: gptResponse.data.text
        };
        const outputFilePath = `${accountName}_search_results.xlsx`;
        saveToExcel(response, outputFilePath);

        res.status(200).json(accountData);
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

router.get("/", (req, res) => {
    res.send("Welcome to the Search API! Use /search/:accountName to perform a search.");
});

router.post("/chat", async (req, res) => {

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