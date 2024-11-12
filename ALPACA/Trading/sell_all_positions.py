from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce

# Initialize the TradingClient

# Fetch all positions
positions = trading_client.get_all_positions()

# Sell all positions
for position in positions:
    symbol = position.symbol
    quantity = position.qty

    # Create a market sell order request
    order_request = MarketOrderRequest(
        symbol=symbol,
        qty=quantity,
        side=OrderSide.SELL,
        time_in_force=TimeInForce.GTC
    )

    # Place the market sell order
    trading_client.submit_order(order_request)
    print(f"Sell order placed for {quantity} shares of {symbol}")

print("All positions have been sold.")
