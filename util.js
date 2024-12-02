// utils.js
const xlsx = require("xlsx");
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const axios = require("axios");
const {BACKEND_URL} = require("./config");
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
        const response = await axios.get(url );
        console.log(response)
        const data = response.data;

        if (!data.items) {
            console.log("No 'items' found in the response.");
            return [];
        }

        // Parse and return results
        return data.items.map((item) => ({
            Title: item.title || "No Title",
            Link: item.link || "No Link",
            Snippet: item.snippet || "No Snippet",
            PageMap: item.pagemap || {},
        }));
    } catch (error) {
        console.error("Error during API request:", error.message);
        throw new Error("Failed to fetch data from Google API.");
    }
};

const parseFundingAmounts = (response) => {
    if (!response) {
        console.error("Invalid response format.");
        return [];
    }

    console.log("Funding results: ", response)
    const fundingRegex = /[$£](\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)/i;
    const fundingResults = response
        .map((result) => {
            const { Title, Link, Snippet, PageMap} = result;

            // Combine fields to search for funding information
            const content = [Title, Snippet, PageMap?.metatags?.[0]?.["og:description"]]
                .filter(Boolean)
                .join(" ");

            console.log(content)
            // Check for funding amount
            const match = content.match(fundingRegex);
            console.log(match)
            if (match) {
                // Normalize the funding amount
                const [fullMatch, amount, multiplier] = match;
                let normalizedAmount = parseFloat(amount);
                if (multiplier.toLowerCase().includes("million") || multiplier.toLowerCase() === "M") {
                    normalizedAmount *= 1e6;
                } else if (multiplier.toLowerCase().includes("billion") || multiplier.toLowerCase() === "B") {
                    normalizedAmount *= 1e9;
                }
                console.log(normalizedAmount);
                return {
                    Title,
                    Link,
                    Snippet,
                    FundingAmount: `$${normalizedAmount.toLocaleString()}`
                };
            }

            return null;
        })
        .filter(Boolean); // Remove null results

    return fundingResults;
};

// Utility function for saving data to Excel
const saveToExcel = (data, outputPath) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Search Results");
    xlsx.writeFile(workbook, outputPath);
    console.log(`Data saved to ${outputPath}`);
};

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



module.exports = {
    saveToExcel,
    calculateFundingScore,
    sendGoogleSearchResponse,
    parseFundingAmounts
};