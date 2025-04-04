const GoogleSearchService = require("../services/GoogleSearchService");
const FundingParser = require("../helpers/FundingParser");
const ScoreCalculator = require("../helpers/ScoreCalculator");
const AccountBuilder = require("../helpers/AccountBuilder");
const { sendDataToOpenAI } = require("../services/OpenAIService");
const config = require("../config");
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;




async function parseAndSaveFundingAmounts(accountName, productCode, segment) {
    const GoogleSearchService = GoogleSearchService(API_KEY, SEARCH_ENGINE_ID);
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


module.exports = {
    parseAndSaveFundingAmounts,
};
