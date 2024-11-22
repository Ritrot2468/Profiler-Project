import React, { useState } from "react";
import axios from "axios";
import "./App.css";

// Define the segmentScoreMap
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

function App() {
  const [accountName, setAccountName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [segment, setSegment] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch search results
  const fetchResults = async () => {
    if (!accountName || !productCode || !segment) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/search/${encodeURIComponent(accountName)}?productCode=${encodeURIComponent(
          productCode
        )}&segment=${encodeURIComponent(segment)}`
      );
      setResults([response.data]); // Wrap in array for consistent display
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Account Scoring System</h1>
        <div className="form-container">
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Enter account name"
          />
          <input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value.toUpperCase())}
            placeholder="Enter product code"
          />
          <label htmlFor="segment">Select a Segment:</label>
          <select
            id="segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
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
          <button onClick={fetchResults}>Search</button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <div className="results-container">
          {results.map((result, index) => (
            <div key={index} className="result-card">
              <h2>{result.account_name}</h2>
              <p>Product Code: {result.product_or_part_number}</p>
              <p>Segment: {result.segment}</p>
              <p>Funding Amount: ${result.funding_amount.toLocaleString()} Million </p>
              <p>Product Score: {result.product_score}</p>
              <p>Segment Score: {result.segment_score}</p>
              <p>Funding Score: {result.funding_score}</p>
              <p>Total Score: {result.total_score}</p>
              <p>Priority: {result.priority}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;

// import React, { useState } from "react";
// import axios from "axios";
// import "./App.css";

// function App() {
//   const [accountName, setAccountName] = useState("");
//   const [productCode, setProductCode] = useState("");
//   const [segment, setSegment] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Function to fetch search results
//   const fetchResults = async () => {
//     if (!accountName || !productCode || !segment) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     setError("");
//     setLoading(true);

//     try {
//       const response = await axios.get(
//         `http://localhost:5000/search/${encodeURIComponent(accountName)}?productCode=${encodeURIComponent(
//           productCode
//         )}&segment=${encodeURIComponent(segment)}`
//       );
//       setResults([response.data]); // Wrap in array for consistent display
//     } catch (err) {
//       setError("Failed to fetch results. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Account Scoring System</h1>
//         <div className="form-container">
//           <input
//             type="text"
//             value={accountName}
//             onChange={(e) => setAccountName(e.target.value)}
//             placeholder="Enter account name"
//           />
//           <input
//             type="text"
//             value={productCode}
//             onChange={(e) => setProductCode(e.target.value.toLocaleUpperCase)}
//             placeholder="Enter product code"
//           />
//           <input
//             type="text"
//             value={segment}
//             onChange={(e) => setSegment(e.target.value)}
//             placeholder="Enter segment"
//           />
//           <button onClick={fetchResults}>Search</button>
//         </div>
//         {loading && <p>Loading...</p>}
//         {error && <p className="error">{error}</p>}
//         <div className="results-container">
//           {results.map((result, index) => (
//             <div key={index} className="result-card">
//               <h2>{result.account_name}</h2>
//               <p>Product Code: {result.product_or_part_number}</p>
//               <p>Segment: {result.segment}</p>
//               <p>Funding Amount: ${result.funding_amount.toLocaleString()} Million </p>
//               <p>Product Score: {result.product_score}</p>
//               <p>Segment Score: {result.segment_score}</p>
//               <p>Funding Score: {result.funding_score}</p>
//               <p>Total Score: {result.total_score}</p>
//               <p>Priority: {result.priority}</p>
//             </div>
//           ))}
//         </div>
//       </header>
//     </div>
//   );
// }

// export default App;

// import React, { useState } from "react";
// import axios from "axios";
// import "./App.css";

// function App() {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Function to fetch search results
//   const fetchResults = async () => {
//     if (!query) {
//       setError("Please enter a search term.");
//       return;
//     }

//     setError("");
//     setLoading(true);

//     try {
//       const response = await axios.get(
//         `http://localhost:5000/search/${encodeURIComponent(query)}`
//       );
//       setResults(response.data.results || []);
//     } catch (err) {
//       setError("Failed to fetch results. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Google Search Results</h1>
//         <div className="search-container">
//           <input
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Enter company name"
//           />
//           <button onClick={fetchResults}>Search</button>
//         </div>
//         {loading && <p>Loading...</p>}
//         {error && <p className="error">{error}</p>}
//         <div className="results-container">
//           {results.map((result, index) => (
//             <div key={index} className="result-card">
//               <h2>{result.Title}</h2>
//               <a href={result.Link} target="_blank" rel="noopener noreferrer">
//                 {result.Link}
//               </a>
//               <p>{result.Snippet}</p>
//               <p>Funding Amount: {result.FundingAmount}</p>
//             </div>
//           ))}
//         </div>
//       </header>
//     </div>
//   );
// }

// export default App;

