# deepcoin_auth.py

import hmac
import hashlib
import base64
from datetime import datetime

def create_deepcoin_signature(secret, method, request_path, body=''):
    timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    prehash = f"{timestamp}{method}{request_path}{body}"
    signature = base64.b64encode(hmac.new(secret.encode(), prehash.encode(), hashlib.sha256).digest()).decode()
    
    return timestamp, signature

# Example usage
if __name__ == "__main__":
    timestamp, signature = create_deepcoin_signature(
        method='GET',
        request_path='/deepcoin/account/balances'
    )
    print("Timestamp:", timestamp)
    print("Signature:", signature)
