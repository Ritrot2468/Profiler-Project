const AccountBuilder = require("../../src/helpers/AccountBuilder");

describe("AccountBuilder", () => {
    test("build returns correct account structure", () => {
        const result = AccountBuilder.build({
            accountName: "TestCo",
            productCode: "P001",
            segment: "BTCH",
            fundingAmount: 1_000_000,
            productScore: 3,
            segmentScore: 10,
            fundingScore: 5,
            totalScore: 18,
            gptText: "Summary here",
            googleResults: []
        });

        expect(result.account_name).toBe("TestCo");
        expect(result.total_score).toBe(18);
        expect(result.total_score_no_fund).toBe(13);
        expect(result.gptResponse).toBe("Summary here");
    });
});
