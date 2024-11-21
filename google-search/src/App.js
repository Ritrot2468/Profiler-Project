import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch search results
  const fetchResults = async () => {
    if (!query) {
      setError("Please enter a search term.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/search/${encodeURIComponent(query)}`
      );
      setResults(response.data.results || []);
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Google Search Results</h1>
        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter company name"
          />
          <button onClick={fetchResults}>Search</button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <div className="results-container">
          {results.map((result, index) => (
            <div key={index} className="result-card">
              <h2>{result.Title}</h2>
              <a href={result.Link} target="_blank" rel="noopener noreferrer">
                {result.Link}
              </a>
              <p>{result.Snippet}</p>
              <p>Funding Amount: {result.FundingAmount}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;

