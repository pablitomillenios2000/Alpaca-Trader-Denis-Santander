import ccxt
import hmac
import hashlib
import base64
import requests
from datetime import datetime

class DeepcoinCustom(ccxt.Exchange):

    def __init__(self):
        super().__init__({
            'apiKey': 'your_api_key_here',
            'secret': 'your_secret_here',
            'password': 'your_password_here',
            'urls': {
                'api': 'https://api.deepcoin.com'
            },
        })

    def sign(self, path, api='private', method='GET', params={}, headers=None, body=None):
        timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        request_path = f'/{path}'
        query_string = '?' + '&'.join([f"{key}={value}" for key, value in params.items()]) if params else ''
        prehash = f"{timestamp}{method}{request_path}{query_string}"
        signature = base64.b64encode(hmac.new(self.secret.encode(), prehash.encode(), hashlib.sha256).digest()).decode()

        headers = {
            'DC-ACCESS-KEY': self.apiKey,
            'DC-ACCESS-SIGN': signature,
            'DC-ACCESS-TIMESTAMP': timestamp,
            'DC-ACCESS-PASSPHRASE': self.password,
            'Content-Type': 'application/json'
        }

        url = self.urls['api'] + request_path + query_string
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

    def request(self, path, method='GET', params=None):
        signed_request = self.sign(path, method=method, params=params or {})
        url = signed_request['url']
        headers = signed_request['headers']
        
        try:
            response = requests.request(method, url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"HTTP error: {e}")
        except requests.exceptions.RequestException as e:
            print(f"Error during request: {e}")
    
    def fetch_balance(self, params={}):
        return self.request('deepcoin/account/balances', 'GET', params=params)
    
    def fetch_market_ticker(self, inst_type="SPOT", symbol="BTC-USDT"):
        path = 'deepcoin/market/tickers'
        params = {'instType': inst_type, 'instId': symbol}
        return self.request(path, 'GET', params=params)

    def fetch_candlesticks(self, symbol="SOL-USDT", bar="1m", before=None, after=None, between=None):
        path = 'deepcoin/market/candles'
        params = {
            "instId": symbol,   # Use instId instead of symbol
            "bar": bar,         # Replace 'interval' with 'bar'
            "before": before,
            "after": after,
        }
        # Add 'between' parameter if provided
        if between:
            params['between'] = between  # Use the string directly
        # Remove None values from params
        params = {k: v for k, v in params.items() if v is not None}
        return self.request(path, 'GET', params=params)
