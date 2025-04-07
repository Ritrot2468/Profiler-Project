const GoogleSearchService = require("../src/services/GoogleSearchService");
const FundingParser = require("../src/helpers/FundingParser");
const ScoreCalculator = require("../src/helpers/ScoreCalculator");
const AccountBuilder = require("../src/helpers/AccountBuilder");
const { sendDataToOpenAI } = require("../src/services/OpenAIService");
const dotenv = require("dotenv");
dotenv.config();


async function parseAndSaveFundingAmounts(accountName, productCode, segment) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

    const googleSearch = new GoogleSearchService(GOOGLE_API_KEY, SEARCH_ENGINE_ID);
    //console.log("instantiated google search service");
    //const GoogleSearchServiceClass = GoogleSearchService(API_KEY, SEARCH_ENGINE_ID);
    //console.log("started google search");
    const googleResults = await googleSearch.search(accountName);
    console.log("finished google search results", googleResults);
    const gptResponse = await sendDataToOpenAI(accountName);
    const fundingResults = FundingParser.extractAll(googleResults);
    console.log("processed funding results", fundingResults);
    const fundingAmount = FundingParser.calculateTotalFunding(fundingResults);
    const fundingScore = ScoreCalculator.calculateFundingScore(fundingAmount);
    const productScore = ScoreCalculator.getProductScore(productCode);
    const segmentScore = ScoreCalculator.getSegmentScore(segment);
    const totalScore = ScoreCalculator.calculateTotalScore(productScore, segmentScore, fundingScore);

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
        googleResults: googleResults,
    });
}


module.exports = {
    parseAndSaveFundingAmounts,
};
