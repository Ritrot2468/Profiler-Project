import React, { useState } from "react";
import axios from "axios";
import "./App.css";

// Mapping of segments to their respective scores
const segmentScoreMap = {
  ACAD: 1,
  BTCH: 10,
  APPL: 2,
  DX: 10,
  HOSP: 2,
  REF: 10,
  "LIFE SCI": 2,
  unclassified: 0,
};

// Backend URL from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// Function to determine priority based on total score
function determinePriority(totalScore) {
  return totalScore >= 12 ? "Multiple Contacts" : "Single Contact";
}

function App() {
  // State variables
  const [accountName, setAccountName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [segment, setSegment] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handler to fetch search results
  const fetchResults = async () => {
    // Validate input fields
    if (!accountName.trim() || !productCode.trim() || !segment) {
      setError("Please fill in all fields.");
      return;
    }

    // Reset error and set loading state
    setError("");
    setLoading(true);

    try {
      // Construct the request URL with encoded parameters
      const url = `${BACKEND_URL}/search/${encodeURIComponent(
          accountName.trim()
      )}?productCode=${encodeURIComponent(productCode.trim())}&segment=${encodeURIComponent(segment)}`;

      const response = await axios.get(url);
      console.log("API Response:", response.data);

      // Initialize each result with a selected_total_score field
      const fetchedResults = [response.data].map((result) => ({
        ...result,
        selected_total_score: null, 
        priority: "", 
      }));

      setResults(fetchedResults);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler to update priority based on selected total score
  const handleTotalScoreChange = (index, selectedScore) => {
    const updatedResults = [...results];
    updatedResults[index].selected_total_score = selectedScore;
    updatedResults[index].priority = determinePriority(selectedScore);
    setResults(updatedResults);
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>Account Scoring System</h1>

          {/* Search Form */}
          <div className="form-container">
            <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
                className="input-field"
            />

            <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                placeholder="Enter product code"
                className="input-field"
            />

            <label htmlFor="segment" className="segment-label">
              Select a Segment:
            </label>
            <select
                id="segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="select-field"
            >
              <option value="" disabled>
                Select a segment
              </option>
              {Object.keys(segmentScoreMap).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
              ))}
            </select>

            <button onClick={fetchResults} className="search-button">
              Search
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && <p className="loading">Loading...</p>}

          {/* Error Message */}
          {error && <p className="error">{error}</p>}

          {/* Results Section */}
          <div className="results-container">
            {results.map((result, index) => (
                <div key={index} className="result-card">
                  <h2>{result.account_name}</h2>
                  <p>
                    <strong>Product Code:</strong> {result.product_or_part_number}
                  </p>
                  <p>
                    <strong>Segment:</strong> {result.segment}
                  </p>
                  <p>
                    <strong>Funding Amount:</strong> ${result.funding_amount}
                  </p>
                  <p>
                    <strong>Product Score:</strong> {result.product_score}
                  </p>
                  <p>
                    <strong>Segment Score:</strong> {result.segment_score}
                  </p>
                  <p>
                    <strong>Predicted Funding Score:</strong> {result.funding_score}
                  </p>

                  {result.googleResponses && result.googleResponses.length > 0 && (
                    <div className="google-responses">
                      <h3>Google Funding News</h3>
                      {result.googleResponses.map((response, i) => (
                        <div key={i} className="google-response-card">
                          <h4><a href={response.Link} target="_blank" rel="noopener noreferrer">{response.Title}</a></h4>
                          <p>{response.Snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Scores Side by Side */}
                  <div className="total-scores">
                    <div className="total-score-option">
                      <input
                          type="radio"
                          id={`predicted-${index}`}
                          name={`totalScore-${index}`}
                          value={result.total_score}
                          checked={result.selected_total_score === result.total_score}
                          onChange={() =>
                              handleTotalScoreChange(index, result.total_score)
                          }
                      />
                      <label htmlFor={`predicted-${index}`}>
                        Total Score (Predicted): {result.total_score}
                      </label>
                    </div>

                    <div className="total-score-option">
                      <input
                          type="radio"
                          id={`without-funding-${index}`}
                          name={`totalScore-${index}`}
                          value={result.total_score_no_fund}
                          checked={
                              result.selected_total_score === result.total_score_no_fund
                          }
                          onChange={() =>
                              handleTotalScoreChange(index, result.total_score_no_fund)
                          }
                      />
                      <label htmlFor={`without-funding-${index}`}>
                        Total Score Without Funding: {result.total_score_no_fund}
                      </label>
                    </div>
                  </div>

                  {/* Display Priority if a score is selected */}
                  {result.priority && (
                      <p>
                        <strong>Priority:</strong> {result.priority}
                      </p>
                  )}

                  <p>
                    <strong>GPT Response:</strong> {result.gptResponse}
                  </p>
                </div>
            ))}

          </div>

        </header>
      </div>

  );
}

export default App;
