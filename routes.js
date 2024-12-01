// routes.js
const express = require("express");
const { sendGoogleSearchResponse, parseFundingAmounts } = require("./apiClient"); // Assumed functions are moved to apiClient.js
const { calculateFundingScore, saveToExcel } = require("./utils");
const productScores = require("./productScores"); // Assuming product scores JSON/Logic is separated
const segmentScoreMap = require("./segmentScoreMap"); // Assuming segment scores are separated

const router = express.Router();

router.get('/search/:accountName', async (req, res) => {
    const { accountName } = req.params;
    const { productCode, segment } = req.query;

    if (!accountName || !productCode || !segment) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const response = await sendGoogleSearchResponse(accountName);
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

module.exports = router;