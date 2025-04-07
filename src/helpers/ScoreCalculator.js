const fs = require("fs");
const segmentScoreMap = {
    ACAD: 1,
    BTCH: 10,
    APPL: 2,
    DX: 10,
    HOSP: 2,
    REF: 10,
    "LIFE SCI": 2,
};

const filePath = 'src/data/product_scores.json';
const productScores = JSON.parse(fs.readFileSync(filePath, 'utf-8'));


/**
 * Score Logic for product scores, funding scores and ...
 */
class ScoreCalculator {
 
    // Utility function to calculate funding score
    static calculateFundingScore(fundingAmount) {
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
    static getProductScore(productCode) {
        return productScores.find(
            (ps) => ps.product === productCode || ps.part_number === productCode
        )?.product_score || 0;
    }
    
    /**
     * Simulate function for getting segment score.
     * @param {string} segment - Segment name.
     * @returns {number} Segment score.
     */
    static getSegmentScore(segment) {
        return segmentScoreMap[segment] || 0;
    }
    
    /**
     * Calculate total score from various factors.
     * @param {number} productScore - The score of the product.
     * @param {number} segmentScore - The score of the segment.
     * @param {number} fundingScore - The score of the funding.
     * @returns {number} Total score.
     */
    static calculateTotalScore(productScore, segmentScore, fundingScore) {
        return productScore + segmentScore + fundingScore;
    }
    
    /**
     * Determine priority based on total score.
     * @param {number} totalScore - Calculated total score.
     * @returns {string} Priority level ("Multiple Contacts" or "Single Contact").
     */
    static determinePriority(totalScore) {
        return totalScore >= 12 ? "Multiple Contacts" : "Single Contact";
    }

}
