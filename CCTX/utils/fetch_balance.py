# fetch_balance.py

from deepcoin_custom_exchange import DeepcoinCustom

def main():
    # Initialize custom Deepcoin exchange instance
    deepcoin = DeepcoinCustom()

    # Fetch and print account balance
    balance = deepcoin.fetch_balance()
    print("Account Balance:", balance)

if __name__ == "__main__":
    main()
