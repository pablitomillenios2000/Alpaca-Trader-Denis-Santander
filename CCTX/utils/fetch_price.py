# fetch_price.py

from deepcoin_custom_exchange import DeepcoinCustom

def main():
    # Initialize the Deepcoin instance
    deepcoin = DeepcoinCustom()

    # Fetch and print the BTC price data
    btc_price = deepcoin.fetch_market_ticker()
    print("BTC Market Ticker:", btc_price)

if __name__ == "__main__":
    main()
