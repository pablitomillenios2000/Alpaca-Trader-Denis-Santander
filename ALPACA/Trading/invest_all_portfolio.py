from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce


# Get our account information.
account = trading_client.get_account()

real_buying_power = float(account.buying_power)/2

print ("Without margin you have {}".format(real_buying_power))


# preparing market order
market_order_data = MarketOrderRequest(
                    symbol="MSTU",
                    notional=real_buying_power,
                    side=OrderSide.BUY,
                    time_in_force=TimeInForce.DAY
                    )

# Market order
market_order = trading_client.submit_order(
                order_data=market_order_data
               )

print(market_order)
