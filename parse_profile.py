import re
import json

# Define the path to the text file
file_path = "researcher_profile.txt"

# Define regex patterns for extracting information with multiline support
patterns = {
    "address": r"Address:\s*((?:.*\n?)+?)\n\s*[-*]",  # Captures multiline address until next section
    "faculty": r"Faculty:\s*((?:.*\n?)+?)\n\s*[-*]",  # Captures multiline faculty until next section
    "research_areas": r"Research Areas:\s*((?:.*\n?)+?)\n\s*[-*]",  # Captures multiline research areas
    "recent_publications": r"Recent Publication Names:\s*((?:.*\n?)+?)\n\s*[-*]?",  # Captures publications until end
}

# Initialize a dictionary to store extracted information
extracted_data = {}

with open(file_path, "r") as txt_file:
    data = txt_file.read()

# Parse the data into a dictionary
data_dict = json.loads(data)

# Save as a JSON file
with open("data.json", "w") as json_file:
    json.dump(data_dict, json_file, indent=4)


# Read the content of the text file
with open(file_path, "r") as file:
    content = file.read()

    # Search for each pattern and store the result
    for key, pattern in patterns.items():
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            # Clean and format the extracted text
            extracted_text = match.group(1).strip()
            #extracted_text = re.sub(r'\n\s+', ' ', extracted_text)  # Replace newlines with spaces for readability
            extracted_data[key] = extracted_text
        else:
            extracted_data[key] = None

# Print the extracted data
print("Extracted Data:", extracted_data)

# Optional: Save the parsed data to a JSON file
with open("parsed_researcher_profile.json", "w") as json_file:
    json.dump(extracted_data, json_file, indent=4)

print("Parsed data saved to parsed_researcher_profile.json")