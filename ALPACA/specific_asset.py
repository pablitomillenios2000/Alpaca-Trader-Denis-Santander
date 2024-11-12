from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetAssetsRequest


# search for AAPL
aapl_asset = trading_client.get_asset('MSTR')

if aapl_asset.tradable:
    print('We can trade this')
else:
    print("We can't trade this exact instrument")