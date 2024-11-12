import time
from datetime import datetime
from deepcoin_custom_exchange import DeepcoinCustom

def fetch_latest_solana_price():
    # Initialize DeepcoinCustom object
    deepcoin = DeepcoinCustom()

    while True:
        try:
            # Fetch the latest ticker information for Solana (SOL-USDT)
            ticker_data = deepcoin.fetch_market_ticker(symbol="SOL-USDT")
            
            # Extract the relevant price information
            current_price = ticker_data['data'][0]['last']  # Adjust if necessary
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')  # Add timestamp formatting
            
            # Print the latest price to the terminal
            print(f"{timestamp} UTC - Solana (SOL) Price: ${current_price}")

            # Countdown loop for 25 seconds
            for remaining in range(25, 0, -1):
                print(f"\rNext update in: {remaining} seconds", end="")
                time.sleep(1)
            print("\r", end="")  # Clear the line after countdown finishes

        except Exception as e:
            # Handle any errors that occur during the API request
            print(f"Error fetching price: {e}")
            time.sleep(25)  # Wait 25 seconds before retrying in case of an error

if __name__ == "__main__":
    fetch_latest_solana_price()
