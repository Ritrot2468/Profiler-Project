const axios = require("axios");
const GoogleSearchService = require("../../src/services/GoogleSearchService");

jest.mock("axios");

describe("GoogleSearchService", () => {
    const service = new GoogleSearchService("FAKE_API_KEY", "FAKE_CX");

    test("should return parsed search results", async () => {
        axios.get.mockResolvedValue({
            data: {
                items: [
                    { title: "T1", link: "L1", snippet: "S1", pagemap: {} }
                ]
            }
        });

        const results = await service.search("test");
        expect(results[0].Title).toBe("T1");
        expect(results[0].Link).toBe("L1");
        expect(results[0].Snippet).toBe("S1");
    });

    test("should handle missing items gracefully", async () => {
        axios.get.mockResolvedValue({ data: {} });
        const results = await service.search("test");
        expect(results).toEqual([]);
    });

    test("should handle API errors", async () => {
        axios.get.mockRejectedValue(new Error("API failed"));
        const results = await service.search("test");
        expect(results).toEqual([]);
    });
});
