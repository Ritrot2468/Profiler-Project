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
        {"role": "user", "content": f"Provide information about {name} at {organization}, including 'address', 'faculty', 'research areas', 'recent publication names', and 'contact info' in JSON format."}
    ],
    max_tokens=300,
    temperature=0.9
)	
	#note to optimize of temperature parameter in future?????
	
	# get the JSON response to parse with later on
structured_data = response.choices[0].message['content']
print(structured_data)

file_path = "researcher_profile.txt"
json_file_path = "research_profile.json"

try:
    structured_json = json.loads(structured_data)
    print(structured_json)
    with open(json_file_path, "w") as text_file:
        text_file.write(structured_json)

except json.JSONDecodeError:
    print("Response is not in JSON format. Here is the raw content:")
    print(structured_data)


json_object = json.dumps(structured_data, indent=4)
 
# Writing to sample.json
with open(json_file_path, "w") as outfile:
    outfile.write(json_object)

