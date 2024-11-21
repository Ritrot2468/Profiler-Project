from flask import Flask, request, jsonify
import requests
import json
import pandas as pd
from dotenv import load_dotenv
import os


app = Flask(__name__)

headers = {
  "User-Agent":
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582"
}

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID") 



def send_google_search_response(query):
    """
    Parses a Google Custom Search API response and writes the results into an Excel file.
    
    Args:
    query (str): name of google search
    Returns:
    None
    """
    # Check if 'items' are present in the response
    url = f"https://www.googleapis.com/customsearch/v1?q={query + " funding"}&key={API_KEY}&cx={SEARCH_ENGINE_ID}"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for HTTP issues
        response_json = response.json()
        print(response_json)
    except requests.exceptions.RequestException as e:
        print(f"Error during API request: {e}")
        return

    if 'items' in response_json:
        items = response_json['items']
        
        # Create a list of dictionaries to store parsed data
        parsed_data = []
        for item in items:
            # Extract title, link, and snippet from each search result
            title = item.get('title', 'No Title')
            link = item.get('link', 'No Link')
            snippet = item.get('snippet', 'No Snippet')
            
            # Append the parsed data
            parsed_data.append({
                'Title': title,
                'Link': link,
                'Snippet': snippet
            })
        
        # Convert the list of dictionaries into a DataFrame
        df = pd.DataFrame(parsed_data)
        output_file_path = "google_search_results.xlsx"
        # Write the DataFrame to an Excel file
        df.to_excel(output_file_path, index=False)
        
        print(f"Data has been successfully parsed and saved to {output_file_path}")
    else:
        print("No 'items' found in the response.")


@app.route('/search', methods=['POST'])
def search():
    """
    Handle search requests via the `/search` endpoint.
    
    Query parameters:
        - account_name (str): The account name to search for.
    
    Returns:
        JSON: Search results or an error message.
    """
    account_name = request.args.get('account_name')
    if not account_name:
        return jsonify({"error": "Account name is required"}), 400

    try:
        # Fetch search results
        results = send_google_search_response(account_name)
        if not results:
            return jsonify({"error": "No results found"}), 404

        # Optionally save results to an Excel file (for debugging or logging purposes)
        output_file_path = f"{account_name}_search_results.xlsx"
        pd.DataFrame(results).to_excel(output_file_path, index=False)
        print(f"Results saved to {output_file_path}")

        return jsonify(results), 200
    except Exception as err:
        return jsonify({"error": f"An unexpected error occurred: {str(err)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)