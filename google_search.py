import requests
import json
import pandas as pd

API_KEY = "AIzaSyDeebI1LVNeZ8DjG4c2tTngNdWZUsEJ8fw"  # Replace with your actual API key
SEARCH_ENGINE_ID = "5345eb6f0995c43ff"  # You will need to provide your Programmable Search Engine CX ID
query = "Eric Jan UBC"

url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={API_KEY}&cx={SEARCH_ENGINE_ID}"

response = requests.get(url)
search_results = response.json()



def parse_google_search_response(response_json, output_file_path):
    """
    Parses a Google Custom Search API response and writes the results into an Excel file.
    
    Args:
    response_json (dict): The JSON response from the Google Custom Search API.
    output_file_path (str): The file path where the output Excel file will be saved.
    
    Returns:
    None
    """
    # Check if 'items' are present in the response
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
        
        # Write the DataFrame to an Excel file
        df.to_excel(output_file_path, index=False)
        
        print(f"Data has been successfully parsed and saved to {output_file_path}")
    else:
        print("No 'items' found in the response.")

parse_google_search_response(search_results, "promega_search_results_response.xlsx")
print(search_results)