import requests
import passwords

api_key = passwords.api_key()

def get_quote(ticker):
  url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={api_key}"
  r = requests.get(url)
  if r.status_code == 200:
    response = r.json()
    
