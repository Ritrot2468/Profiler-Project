const GoogleSearchService = require("../src/services/GoogleSearchService");
const FundingParser = require("../src/helpers/FundingParser");
const ScoreCalculator = require("../src/helpers/ScoreCalculator");
const AccountBuilder = require("../src/helpers/AccountBuilder");
const { sendDataToOpenAI } = require("../src/services/OpenAIService");
const config = require("../config");
//const API_KEY = process.env.GOOGLE_API_KEY;
//const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

const googleSearch = new GoogleSearchService(config.API_KEY, config.SEARCH_ENGINE_ID);

async function parseAndSaveFundingAmounts(accountName, productCode, segment) {
    //const GoogleSearchServiceClass = GoogleSearchService(API_KEY, SEARCH_ENGINE_ID);
    const googleResults = await googleSearch.search(accountName);
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
