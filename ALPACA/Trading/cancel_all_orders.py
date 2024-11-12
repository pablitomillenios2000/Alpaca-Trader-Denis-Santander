from alpaca.trading.client import TradingClient


# attempt to cancel all open orders
cancel_statuses = trading_client.cancel_orders()

print(cancel_statuses)