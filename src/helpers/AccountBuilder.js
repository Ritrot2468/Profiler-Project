
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