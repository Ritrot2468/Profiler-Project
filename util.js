// utils.js
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const axios = require("axios");
const {BACKEND_URL} = require("./config");
const fs = require('fs')
const {sendDataToOpenAI} = require("./openai");

const filePath = 'product_scores.json';
const productScores = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const segmentScoreMap = {
    ACAD: 1,
    BTCH: 10,
    APPL: 2,
    DX: 10,
    HOSP: 2,
    REF: 10,
    "LIFE SCI": 2,
};

/**
 * Fetches and parses Google Custom Search API response
 * @param {string} query - Search query
 * @returns {Array} Parsed search results
 */
const sendGoogleSearchResponse = async (query) => {
    const refinedQuery = `'${query}' funding`
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
        refinedQuery
    )}&num=7&key=${API_KEY}&cx=${SEARCH_ENGINE_ID}`;
    try {
        const response = await axios.get(url);
       // console.log(response)
        const data = response.data;

        if (!data.items) {
            console.log("No 'items' found in the response.");
            return [];
        }

        // Parse and return results
        return parseSearchResults(data.items);
    } catch (error) {
        console.error("Error during API request:", error.message);
        throw new Error("Failed to fetch data from Google API.");
    }
};

const parseSearchResults = (items) => {
   // console.log(items)
    return items.map((item) => ({
        Title: item.title || "No Title",
        Link: item.link || "No Link",
        Snippet: item.snippet || "No Snippet",
        PageMap: item.pagemap || {},
    }));
};

const parseFundingAmounts = (response) => {
    console.log("fUNDING", response)
    if (!response) {
        console.error("Invalid response format.");
        return [];
    }

    const fundingRegex = /[$£](\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)/i;
    return response.map((result) => extractFundingDetails(result, fundingRegex)).filter(Boolean);
};

/**
 * Extracts funding details from a search result
 * @param {Object} result - Individual search result
 * @param {RegExp} regex - Regular expression for finding funding amounts
 * @returns {Object|null} Parsed funding details or null if none found
 */
const extractFundingDetails = (result, regex) => {
    const { Title, Link, Snippet, PageMap } = result;
    //console.log(result)
    const content = [Title, Snippet, PageMap?.metatags?.[0]?.["og:description"]]
        .filter(Boolean)
        .join(" ");

    const match = content.match(regex);
    if (match) {
        const [fullMatch, amount, multiplier] = match;
        const normalizedAmount = normalizeFundingAmount(amount, multiplier);
        console.log(Title, Link, Snippet, normalizedAmount )
        return { Title, Link, Snippet, FundingAmount: normalizedAmount };
    }
    return null;
};

/**
 * Normalizes a funding amount based on its multiplier
 * @param {string} amount - The amount before normalization
 * @param {string} multiplier - The multiplier (e.g., million, billion)
 * @returns {number} Normalized funding amount
 */
const normalizeFundingAmount = (amount, multiplier) => {
    let normalizedAmount = parseFloat(amount);
    if (multiplier.toLowerCase().includes("million") || multiplier.toLowerCase() === "M") {
        normalizedAmount *= 1e6;
    } else if (multiplier.toLowerCase().includes("billion") || multiplier.toLowerCase() === "B") {
        normalizedAmount *= 1e9;
    }
    return normalizedAmount;
};

// Utility function for saving data to Excel
// const saveToExcel = (data, outputPath) => {
//     const worksheet = xlsx.utils.json_to_sheet(data);
//     const workbook = xlsx.utils.book_new();
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Search Results");
//     xlsx.writeFile(workbook, outputPath);
//     console.log(`Data saved to ${outputPath}`);
// };

// Utility function to calculate funding score
const calculateFundingScore = (fundingAmount) => {
    if (fundingAmount > 100_000_000) {
        return 10;
    } else if (fundingAmount >= 10_000_000 && fundingAmount <= 100_000_000) {
        return 5;
    } else {
        return 0;
    }
};

async function parseAndSaveFundingAmounts(accountName, productCode, segment) {
    console.log("can parse here")
    const response = await sendGoogleSearchResponse(accountName)
    console.log("Calling parseFundingAmounts with response:", response);  // Log before the call
    // TODO: May have to alter now that gpt-40 web search is done _> sending accountName instead of response
    const gptResponse = await sendDataToOpenAI(accountName)

    console.log("GPT Response: ", gptResponse)
    const fundingResults = parseFundingAmounts(response, accountName);
    console.log("Funding Results:", fundingResults)
    const uniqueFundingAmounts = getUniqueFundingAmounts(fundingResults);
    const fundingAmount = calculateTotalFunding(uniqueFundingAmounts);
    const fundingScore = calculateFundingScore(fundingAmount);

    const productScore = getProductScore(productCode);
    const segmentScore = getSegmentScore(segment);

    const totalScore = calculateTotalScore(productScore, segmentScore, fundingScore);
    const totalScoreNoFund = totalScore - fundingScore;
   // const priority = determinePriority(totalScore);

    const accountData = createAccountData(
        accountName, productCode, segment, fundingAmount, productScore, segmentScore, fundingScore, totalScore, totalScoreNoFund,
        gptResponse.choices[0].message.content
    );
    console.log(accountData)

    //const outputFilePath = `${accountName}_search_results.xlsx`;
    //saveToExcel(accountData, outputFilePath);
    return accountData;
}

/**
 * Extracts and returns unique funding amounts.
 * @param {Array} fundingResults - Results containing funding data
 * @returns {Set} Set of unique funding amounts
 */
function getUniqueFundingAmounts(fundingResults) {
    return new Set(
        fundingResults.map(result => {
            const parsedAmount = parseFloat(result.FundingAmount);
            return parsedAmount;
        })
    );
}

/**
 * Calculate the total funding amount from unique amounts.
 * @param {Set} uniqueFundingAmounts - Set of unique funding amounts
 * @returns {number} Total funding amount
 */
function calculateTotalFunding(uniqueFundingAmounts) {
    return Array.from(uniqueFundingAmounts).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Simulate function for getting product score.
 * @param {string} productCode - Product or part number.
 * @returns {number} Product score.
 */
function getProductScore(productCode) {
    return productScores.find(
        (ps) => ps.product === productCode || ps.part_number === productCode
    )?.product_score || 0;
}

/**
 * Simulate function for getting segment score.
 * @param {string} segment - Segment name.
 * @returns {number} Segment score.
 */
function getSegmentScore(segment) {
    return segmentScoreMap[segment] || 0;
}

/**
 * Calculate total score from various factors.
 * @param {number} productScore - The score of the product.
 * @param {number} segmentScore - The score of the segment.
 * @param {number} fundingScore - The score of the funding.
 * @returns {number} Total score.
 */
function calculateTotalScore(productScore, segmentScore, fundingScore) {
    return productScore + segmentScore + fundingScore;
}

/**
 * Determine priority based on total score.
 * @param {number} totalScore - Calculated total score.
 * @returns {string} Priority level ("Multiple Contacts" or "Single Contact").
 */
function determinePriority(totalScore) {
    return totalScore >= 12 ? "Multiple Contacts" : "Single Contact";
}

/**
 * Create data object for the account
 * @returns {object} - Complete account data for saving
 */
function createAccountData(accountName, productCode, segment, fundingAmount, productScore,
                           segmentScore, fundingScore, totalScore, totalScoreNoFund,
                           gptResponse) {
    return {
        account_name: accountName,
        product_or_part_number: productCode,
        segment,
        funding_amount: fundingAmount,
        product_score: productScore,
        segment_score: segmentScore,
        funding_score: fundingScore,
        total_score: totalScore,
        total_score_no_fund: totalScoreNoFund,
        gptResponse: gptResponse
    };
}

module.exports = {
    //saveToExcel,
    calculateFundingScore,
    sendGoogleSearchResponse,
    parseFundingAmounts,
    parseAndSaveFundingAmounts
};
