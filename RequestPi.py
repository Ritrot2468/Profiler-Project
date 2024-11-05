import openai
import json
	
openai.api_key = "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"
	
name = "Eric Jan"
organization = "UBC"
# send an API request to Open API
response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant for retrieving researcher profiles."},
        {"role": "user", "content": f"Provide information about {name} at {organization}, including 'address', 'faculty', 'research areas', 'recent publication names', and 'contact info'."}
    ],
    max_tokens=200,
    temperature=0.8
)	
	#note to optimize of temperature parameter in future?????
	
	# get the JSON response to parse with later on
structured_data = response.choices[0].message['content']
print(structured_data)

file_path = "researcher_profile.txt"

# Open the file in write mode
with open(file_path, "w") as text_file:
    # Write the string to the file
    text_file.write(structured_data)

