const express = require("express");
const axios = require("axios");
const xlsx = require("xlsx");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const { log } = require("console");

// Load environment variables
dotenv.config();

const app = express();
const BACKEND_URL = process.env.BACKEND_URL;
const allowedOrigins = [
  "http://127.0.0.1:3000", 
  "http://localhost:3000", 
  BACKEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// app.use(cors({
//   origin: BACKEND_URL, 
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }))
const PORT = process.env.PORT || 5000;

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;



if (!API_KEY || !SEARCH_ENGINE_ID || !BACKEND_URL) {
    console.error("Missing required environment variables: GOOGLE_API_KEY or SEARCH_ENGINE_ID");
    process.exit(1);
  }
  
  const filePath = "product_scores.json";
const productScores = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Segment score mapping
const segmentScoreMap = {
  ACAD: 1,
  BTCH: 10,
  APPL: 2,
  DX: 10,
  HOSP: 2,
  REF: 10,
  "LIFE SCI": 2,
  "unclassified": 0
};


/**
 * Fetches and parses Google Custom Search API response
 * @param {string} query - Search query
 * @returns {Array} Parsed search results
 */
const sendGoogleSearchResponse = async (query) => {
  //const refinedQuery = `${query} funding`;
  const refinedQuery = `'${query}' funding`
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    refinedQuery
  )}&num=7&key=${API_KEY}&cx=${SEARCH_ENGINE_ID}`;
  try {
    const response = await axios.get(url );
    console.log(response)
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
      PageMap: item.pagemap || {},
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

const parseFundingAmounts = (response) => {
  if (!response) {
    console.error("Invalid response format.");
    return [];
  }

  console.log("Funding results: ", response)
  // Regex pattern to capture funding amounts
  //const fundingRegex = /[$£]?(\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)/i;
 // const fundingRegex = /^[$£](\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)/i;
  const fundingRegex = /[$£](\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)/i;


  //const fundingRegex = /([$£])(\d+(?:\.\d+)?)\s?(million|billion|M|B|k|K)|(\d+(?:\.\d+)?)([$£])\s?(million|billion|M|B|k|K)/i;


 // const fundingRegex = /\$?\d+(\.\d+)?\s?(million|billion|M|B|k|K|£)/i;

  // Keywords indicating funding
  //const fundingKeywords = ["funding", "grant", "investment", "round", "raised"];
  //console.log(response)
  const fundingResults = response
    .map((result) => {
      const { Title, Link, Snippet, PageMap } = result;

      // Combine fields to search for funding information
      const content = [Title, Snippet, PageMap?.metatags?.[0]?.["og:description"]]
        .filter(Boolean)
        .join(" ");

        console.log(content)
      // Check for funding amount
      const match = content.match(fundingRegex);
      console.log(match)
      if (match) {
        // Normalize the funding amount
        const [fullMatch, amount, multiplier] = match;
        let normalizedAmount = parseFloat(amount);
        if (multiplier.toLowerCase().includes("million") || multiplier.toLowerCase() === "M") {
          normalizedAmount *= 1e6;
        } else if (multiplier.toLowerCase().includes("billion") || multiplier.toLowerCase() === "B") {
          normalizedAmount *= 1e9;
        }
        console.log(normalizedAmount);
        return {
          Title,
          Link,
          Snippet,
          FundingAmount: `$${normalizedAmount.toLocaleString()}`,
        };
      }

      return null;
    })
    .filter(Boolean); // Remove null results

  return fundingResults;
};

// Helper function to calculate funding score
const calculateFundingScore = (fundingAmount) => {
  if (fundingAmount > 100_000_000) {
    return 10;
  } else if (fundingAmount >= 10_000_000 && fundingAmount <= 100_000_000) {
    return 5;
  } else {
    return 0;
  }
};


app.get('/search/:accountName', async (req, res) => {
  const { accountName } = req.params;
  const { productCode, segment } = req.query;

  if (!accountName || !productCode || !segment) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const response = await sendGoogleSearchResponse(accountName);
    const fundingResults = parseFundingAmounts(response);
    const uniqueFundingAmounts = new Set(
      fundingResults.map((result) => {
        const parsedAmount = parseFloat(result.FundingAmount.replace(/[$,]/g, ""));
        return parsedAmount;
      })
    );

    const fundingAmount = Array.from(uniqueFundingAmounts).reduce((sum, amount) => sum + amount, 0);

    // const fundingAmount = fundingResults.reduce(
    //   (sum, result) => sum + parseFloat(result.FundingAmount.replace(/[$,]/g, "")),
    //   0
    // );
    const fundingScore = calculateFundingScore(fundingAmount);

    const productScore =
      productScores.find(
        (ps) =>
          ps.product === productCode || ps.part_number === productCode
      )?.product_score || 0;

    const segmentScore = segmentScoreMap[segment] || 0;

    const totalScore = productScore + segmentScore + fundingScore;
    const priority = totalScore >= 12 ? "Multiple Contacts" : "Single Contact";

    const accountData = {
      account_name: accountName,
      product_or_part_number: productCode,
      segment,
      funding_amount: fundingAmount,
      product_score: productScore,
      segment_score: segmentScore,
      funding_score: fundingScore,
      total_score: totalScore,
      priority,
    };
    const outputFilePath = `${accountName}_search_results.xlsx`;
    saveToExcel(response, outputFilePath);

    res.status(200).json(accountData);
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});


// app.get("/", (req, res) => {
//     res.send("Welcome to the Search API! Use /search/:accountName to perform a search.");
//   });


// Search endpoint
// app.get("/search/:accountName", async (req, res) => {
//   const accountName = req.params.accountName;
//   const productCode = req.params.productCode;
//   const accountSegment = req.params.accountSegment;

//   if (!accountName) {
//     return res.status(400).json({ error: "Account name is required" });
//   }
//   // }
//   // if (!productCode || productCode.length != 6) {
//   //   return res.status(400).json({ error: "Invalid Product Code" });
//   // }
//   // if (!accountSegment) {
//   //   return res.status(400).json({ error: "Missing or Invalid account segment" });
//   // }

//   try {
//     // Fetch search results
//     let sum = 0
//     const response = await sendGoogleSearchResponse(accountName);
//     console.log(response);
//     const results = await parseFundingAmounts(response);
//     results.map(result => {
//       sum += parseFloat(result.FundingAmount.replace(/[$,]/g, ""));
//     })
  

//     if (results.length === 0) {
//       return res.status(404).json({ error: "No results found" });
//     }

//     // Save results to Excel
//     const outputFilePath = `${accountName}_search_results.xlsx`;
//     saveToExcel(results, outputFilePath);

//     // Send response
//     res.status(200).json({ sum: sum });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ error: "An unexpected error occurred" });
//   }
// });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
