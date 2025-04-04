const ScoreCalculator = require('../../src/helpers/ScoreCalculator');

const mockProductScores = [
    {
        part_number: "A1071",
        product: "Eluator(TM) Vacuum Elution Device, 4 each",
        product_score: 3
    },
    {
        part_number: "A1120",
        product: "Wizard(R) Genomic DNA Purification Kit, 100 Isolations",
        product_score: 2
    },
    {
        part_number: "A1125",
        product: "Wizard(R) Genomic DNA Purification Kit, 500 Isolations",
        product_score: 2
    },
    // Random nonexistent product to test 0 fallback
    {
        part_number: "Z9999",
        product: "Nonexistent Product XYZ",
        product_score: 0
    }
];


describe("ScoreCalculator", () => {
    describe("getFundingScore", () => {
        test("returns 10 for > $100M", () => {
            expect(ScoreCalculator.getFundingScore(150_000_000)).toBe(10);
        });

        test("returns 5 for $10M - $100M", () => {
            expect(ScoreCalculator.getFundingScore(50_000_000)).toBe(5);
        });

        test("returns 0 for < $10M", () => {
            expect(ScoreCalculator.getFundingScore(5_000_000)).toBe(0);
        });
    });

    describe("getProductScore", () => {
        test("returns correct score by product", () => {
            expect(ScoreCalculator.getProductScore("Eluator(TM) Vacuum Elution Device, 4 each", mockProductScores)).toBe(5);
        });

        test("returns zero score by incorrect product name", () => {
            expect(ScoreCalculator.getProductScore("Eluator Vacuum Elution Device, 4 each", mockProductScores)).toBe(0);
        });

        test("returns correct score by part_number", () => {
            expect(ScoreCalculator.getProductScore("A1120", mockProductScores)).toBe(7);
        });

        test("returns 0 for unknown product", () => {
            expect(ScoreCalculator.getProductScore("UNKNOWN", mockProductScores)).toBe(0);
        });
    });

    describe("getSegmentScore", () => {
        test("returns correct segment score", () => {
            expect(ScoreCalculator.getSegmentScore("BTCH")).toBe(10);
            expect(ScoreCalculator.getSegmentScore("ACAD")).toBe(1);
        });

        test("returns 0 for unknown segment", () => {
            expect(ScoreCalculator.getSegmentScore("XYZ")).toBe(0);
        });
    });

    describe("total", () => {
        test("sums all scores correctly", () => {
            expect(ScoreCalculator.total(3, 4, 2)).toBe(9);
        });
    });

    describe("priority", () => {
        test("returns 'Multiple Contacts' for score >= 12", () => {
            expect(ScoreCalculator.priority(15)).toBe("Multiple Contacts");
        });

        test("returns 'Single Contact' for score < 12", () => {
            expect(ScoreCalculator.priority(8)).toBe("Single Contact");
        });
    });
});
