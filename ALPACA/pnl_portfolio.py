from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetAssetsRequest


# Get our account information.
account = trading_client.get_account()

# Check our current balance vs. our balance at the last market close
balance_change = float(account.equity) - float(account.last_equity)
print(f'Today\'s portfolio balance change: ${balance_change}')