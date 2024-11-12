import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# Define the symbol and time range
symbol = "MSTU"
end_time = datetime.now()
start_time = end_time - timedelta(days=2)

# Download 1-minute historical data for MSTU
data = yf.download(
    tickers=symbol,
    start=start_time.strftime('%Y-%m-%d'),
    end=end_time.strftime('%Y-%m-%d'),
    interval="1m",
    group_by='ticker'  # Ensure data is grouped by ticker
)

# Check if data is empty
if data.empty:
    print(f"No data found for symbol {symbol} in the given date range.")
    exit()

# Reset index to access the datetime column
data = data.reset_index()

# Handle MultiIndex columns
if isinstance(data.columns, pd.MultiIndex):
    # Flatten MultiIndex columns
    data.columns = [' '.join(col).strip() for col in data.columns.values]

# Print the column names with their indices to verify positions
print("Column names and their indices:")
for idx, col in enumerate(data.columns):
    print(f"{idx}: {col}")

# Convert the 'Datetime' column to UNIX timestamp in seconds
if 'Datetime' in data.columns:
    data['Timestamp'] = data.iloc[:, 0].apply(lambda x: int(x.timestamp()))
elif 'Date' in data.columns:
    data['Timestamp'] = data.iloc[:, 0].apply(lambda x: int(x.timestamp()))
else:
    print("Datetime column not found in data.")
    exit()

# Create placeholders for the missing columns
data['Placeholder1'] = 0.00
data['Placeholder2'] = 0.00
data['Placeholder3'] = 0.00
data['Placeholder4'] = 0.00

# Now, arrange the columns using their index positions
# Assuming the columns are in the following order after reset_index and flattening:
# 0: 'Datetime'
# 1: 'Adj Close MSTU'
# 2: 'Close MSTU'
# 3: 'High MSTU'
# 4: 'Low MSTU'
# 5: 'Open MSTU'
# 6: 'Volume MSTU'
# 7: 'Timestamp'
# 8: 'Placeholder1'
# 9: 'Placeholder2'
# 10: 'Placeholder3'
# 11: 'Placeholder4'

# We will select the columns by their positions
# 'Timestamp' at index 7
# 'Open MSTU' at index 5
# 'High MSTU' at index 3
# 'Low MSTU' at index 4
# 'Close MSTU' at index 2
# Placeholders at indices 8 to 11
# 'Volume MSTU' at index 6

# Create the formatted_data DataFrame by selecting columns by index
formatted_data = data.iloc[:, [7, 5, 3, 4, 2, 8, 9, 10, 11, 6]]

# Format the data as per your requirement
def format_row(row):
    return f"{int(row.iloc[0])}|{row.iloc[1]:.4f}|{row.iloc[2]:.4f}|{row.iloc[3]:.4f}|{row.iloc[4]:.4f}|{row.iloc[5]:.2f}|{row.iloc[6]:.2f}|{row.iloc[7]:.2f}|{row.iloc[8]:.2f}|{int(row.iloc[9])}"

formatted_data = formatted_data.apply(format_row, axis=1)

# Save the formatted data to a CSV file without headers and index
formatted_data.to_csv("mstu_data_formatted.csv", index=False, header=False)

# Print the formatted data
print("Formatted data:")
print(formatted_data.to_string(index=False))
