const FundingParser = require("../../src/helpers/FundingParser");

describe("FundingParser", () => {
    test("extractOne returns normalized funding object", () => {
        const input = {
            Title: "Company raises $10 million",
            Link: "http://example.com",
            Snippet: "Funding secured",
            PageMap: {
                metatags: [{ "og:description": "More than $10 million secured" }]
            }
        };

        const result = FundingParser.extractFundingDetails(input);
        expect(result).toHaveProperty("FundingAmount");
        expect(result.FundingAmount).toBeGreaterThan(9_000_000);
    });

    test("normalizeAmount handles USD, million", () => {
        const result = FundingParser.normalizeFundingAmount("10", "million", "$");
        expect(result).toBe(10_000_000);
    });

    test("getTotal returns sum of unique amounts", () => {
        const mockData = [
            { FundingAmount: 5_000_000 },
            { FundingAmount: 10_000_000 },
            { FundingAmount: 5_000_000 }
        ];
        const total = FundingParser.calculateTotalFunding(mockData);
        expect(total).toBe(15_000_000);
    });
});
