# test_api.py
import requests
import os
from dotenv import load_dotenv

load_dotenv()

token = os.getenv('INDIAN_KANOON_API_TOKEN')
print(f"Token: {token[:20] if token else 'NOT FOUND'}...")

# Test the API
url = "http://api.indiankanoon.org/search/"
response = requests.get(
    url,
    params={'formInput': 'IPC 302', 'pagenum': 0},
    headers={'Authorization': f'Token {token}'},
    timeout=30
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500]}")