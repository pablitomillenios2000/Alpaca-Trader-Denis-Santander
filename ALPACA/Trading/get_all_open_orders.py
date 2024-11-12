from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetOrdersRequest
from alpaca.trading.enums import OrderSide, QueryOrderStatus


# params to filter orders by
request_params = GetOrdersRequest(
                    status=QueryOrderStatus.OPEN,
                    side=OrderSide.BUY
                 )

# orders that satisfy params
orders = trading_client.get_orders(filter=request_params)

print("hello {}".format(orders))