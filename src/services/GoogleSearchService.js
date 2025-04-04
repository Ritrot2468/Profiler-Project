const {BACKEND_URL} = require("../config");
const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const axios = require("axios");   

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

