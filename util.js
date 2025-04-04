
const fs = require('fs');
const axios = require("axios");

const {BACKEND_URL} = require("./config");
const {sendDataToOpenAI} = require("./openai");

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

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
 * Service Class that fetches and parses Google Custom Search API response
 * @param {string} query - Search query
 * @returns {Array} Parsed search results
 */
class GoogleSearchService {
    static async search(query) {
        const refinedQuery = `'${query}' funding`;
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
            refinedQuery
        )}&num=7&key=${API_KEY}&cx=${SEARCH_ENGINE_ID}`;

        try {
            const response = await axios.get(url);
            return this.parseResults(response.data.items || []);
        } catch (error) {
            console.error("Google API Error:", error.message);
            return [];
        }
    }

    static parseResults(items) {
        return items.map((item) => ({
            Title: item.title || "No Title",
            Link: item.link || "No Link",
            Snippet: item.snippet || "No Snippet",
            PageMap: item.pagemap || {},
        }));
    }
}




class FundingParser {

    //TODO: need to make more dynamic for changing currency rates
    static CURRENCY_RATES = { "£": 1.22, "€": 1.08, "¥": 0.0077 };
    static CURRENCY_SYMBOLS = { USD: "$", GBP: "£", EUR: "€" };

    /**
     * Class concerned with parsing and normalizing funding information from Google Search fetches and parses Google Custom Search API response
     */
    static extractAll(response) {
        if (!response) {
            console.error("Invalid response format.");
            return [];
        }
    
        return response.map(this.extractFundingDetails).filter(Boolean);
    };

        /**
     * Extracts funding details from a search result
     * @param {Object} result - Individual search result
     * @param {RegExp} regex - Regular expression for finding funding amounts
     * @returns {Object|null} Parsed funding details or null if none found
     */
    static extractFundingDetails(result) {
        const { Title, Link, Snippet, PageMap } = result;
        const content = [Title, Snippet, PageMap?.metatags?.[0]?.["og:description"]]
            .filter(Boolean)
            .join(" ");
            const fundingRegex = /([$£€¥]|USD|GBP|EUR)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[\s-]*(\b(million|billion|thousand|mn|bn|M|B|k|K)\b)/gi;
            const matches = [...content.matchAll(fundingRegex)];
            
            if (matches.length === 0) return null;
        
            let maxFunding = 0;
            let bestMatch = null;
    
        for (const match of matches) {
            try {
                const [_, currency, amount, , multiplier] = match;
                const funding = normalizeFundingAmount(amount, multiplier, currency);
                
                if (funding > maxFunding) {
                    maxFunding = funding;
                    bestMatch = { 
                        Title, 
                        Link, 
                        Snippet, 
                        FundingAmount: funding,
                        Currency: currency.replace(/USD|GBP|EUR/, match => CURRENCY_SYMBOLS[match] || match)
                    };
                }
            } catch (e) {
                console.error('Error processing funding:', e);
            }
        }
    
        return bestMatch;
        
    };

    /**
     * Normalizes a funding amount based on its multiplier
     * @param {string} amount - The amount before normalization
     * @param {string} multiplier - The multiplier (e.g., million, billion)
     * @returns {number} Normalized funding amount
     */
    static normalizeFundingAmount(amount, multiplier, currency) {
        const MULTIPLIERS = {
            thousand: 1e3,
            k: 1e3,
            million: 1e6,
            m: 1e6,
            mn: 1e6,
            billion: 1e9,
            b: 1e9,
            bn: 1e9
        };
        const cleanedAmount = parseFloat(amount.replace(/,/g, ''));
        const lowerMultiplier = multiplier.toLowerCase();
        const multiplierValue = MULTIPLIERS[lowerMultiplier] || 1;
        const currencySymbol = currency.replace(/[^$£€¥]/g, '');
        const conversionRate = CURRENCY_RATES[currencySymbol] || 1;
        
        return cleanedAmount * multiplierValue * conversionRate;
    };

    /**
     * Calculate the total funding amount from unique amounts.
     * @param {Set} uniqueFundingAmounts - Set of unique funding amounts
     * @returns {number} Total funding amount
     */
    function calculateTotalFunding(uniqueFundingAmounts) {
        const unique = new Set(fundingResults.map(f => parseFloat(f.FundingAmount)));
        return Array.from(unique).reduce((sum, amount) => sum + amount, 0);
    }
}


/**
 * Score Logic for product scores, funding scores and ...
 */
class ScoreCalculator {
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

}


async function parseAndSaveFundingAmounts(accountName, productCode, segment) {
     const googleResults = await GoogleSearchService.search(accountName);
    const gptResponse = await sendDataToOpenAI(accountName);
    const fundingResults = FundingParser.extractAll(googleResults);

    const fundingAmount = FundingParser.getTotal(fundingResults);
    const fundingScore = ScoreCalculator.getFundingScore(fundingAmount);
    const productScore = ScoreCalculator.getProductScore(productCode);
    const segmentScore = ScoreCalculator.getSegmentScore(segment);
    const totalScore = ScoreCalculator.total(productScore, segmentScore, fundingScore);

    return AccountBuilder.build({
        accountName,
        productCode,
        segment,
        fundingAmount,
        productScore,
        segmentScore,
        fundingScore,
        totalScore,
        gptText: gptResponse.completion.choices[0].message.content,
        googleResults: fundingResults,
    });
}






/**
 * Create data object for the account
 * @returns {object} - Complete account data for saving
 */
class AccountBuilder {
    static build({
        accountName, productCode, segment,
        fundingAmount, productScore, segmentScore,
        fundingScore, totalScore, gptText, googleResults
    }) {
        return {
            account_name: accountName,
            product_or_part_number: productCode,
            segment,
            funding_amount: fundingAmount,
            product_score: productScore,
            segment_score: segmentScore,
            funding_score: fundingScore,
            total_score: totalScore,
            total_score_no_fund: totalScore - fundingScore,
            gptResponse: gptText,
            googleResponses: googleResults,
        };
    }
}

module.exports = {
    parseAndSaveFundingAmounts,
    GoogleSearchService,
    FundingParser,
    ScoreCalculator,
};
