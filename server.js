const express = require("express");
const axios = require("axios");
const xlsx = require("xlsx");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;


if (!API_KEY || !SEARCH_ENGINE_ID) {
    console.error("Missing required environment variables: GOOGLE_API_KEY or SEARCH_ENGINE_ID");
    process.exit(1);
  }
  
  console.log("Environment variables loaded successfully!");

/**
 * Fetches and parses Google Custom Search API response
 * @param {string} query - Search query
 * @returns {Array} Parsed search results
 */
const sendGoogleSearchResponse = async (query) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query + " funding"
  )}&key=${API_KEY}&cx=${SEARCH_ENGINE_ID}`;

  try {
    const response = await axios.get(url );
    const data = response.data;

    if (!data.items) {
      console.log("No 'items' found in the response.");
      return [];
    }

    // Parse and return results
    return data.items.map((item) => ({
      Title: item.title || "No Title",
      Link: item.link || "No Link",
      Snippet: item.snippet || "No Snippet",
    }));
  } catch (error) {
    console.error("Error during API request:", error.message);
    throw new Error("Failed to fetch data from Google API.");
  }
};

/**
 * Save search results to an Excel file
 * @param {Array} data - Parsed search results
 * @param {string} outputPath - Path to save the Excel file
 */
const saveToExcel = (data, outputPath) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Search Results");
  xlsx.writeFile(workbook, outputPath);
  console.log(`Data saved to ${outputPath}`);
};

app.get("/", (req, res) => {
    res.send("Welcome to the Search API! Use /search/:accountName to perform a search.");
  });

// Search endpoint
app.get("/search/:accountName", async (req, res) => {
  const accountName = req.params.accountName;

  if (!accountName) {
    return res.status(400).json({ error: "Account name is required" });
  }

  try {
    // Fetch search results
    const results = await sendGoogleSearchResponse(accountName);

    if (results.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    // Save results to Excel
    const outputFilePath = `${accountName}_search_results.xlsx`;
    saveToExcel(results, outputFilePath);

    // Send response
    res.status(200).json({ message: "Search completed", results });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Start the server
app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
