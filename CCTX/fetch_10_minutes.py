import csv
import os
import time
import argparse
from datetime import datetime
from tqdm import tqdm
from utils.deepcoin_custom_exchange import DeepcoinCustom

def get_latest_timestamp(filename):
    try:
        with open(filename, mode='r', newline='') as file:
            reader = csv.reader(file, delimiter='|')
            max_timestamp = None
            for row in reader:
                if not row or not row[0]:
                    continue  # Skip empty lines or rows without a timestamp
                try:
                    timestamp = int(row[0])
                    if max_timestamp is None or timestamp > max_timestamp:
                        max_timestamp = timestamp
                except ValueError:
                    continue  # Skip rows with invalid timestamp
            return max_timestamp
    except FileNotFoundError:
        return None  # File does not exist

def fetch_last_minutes(iterations):
    # Initialize DeepcoinCustom object
    deepcoin = DeepcoinCustom()
    
    # Define the CSV file path
    filename = './csv/solana_10min_data.csv'
    
    # Get the latest timestamp from the existing CSV file
    latest_timestamp_in_file = get_latest_timestamp(filename)
    if latest_timestamp_in_file is not None:
        # Convert to milliseconds for comparison with API data
        latest_timestamp_in_file_ms = latest_timestamp_in_file * 1000
    else:
        latest_timestamp_in_file_ms = None

    # Initialize 'after' parameter to current timestamp in milliseconds
    after = int(datetime.utcnow().timestamp() * 1000)

    # Collect all batches
    all_batches = []

    for i in tqdm(range(iterations), desc="Fetching data", bar_format="{l_bar}%s{bar}%s{r_bar}" % ('\x1b[32m', '\x1b[0m')):
        try:
            # Fetch candlestick data with specified bar interval and between parameters
            response = deepcoin.fetch_candlesticks(
                symbol="SOL-USDT", bar="1m", after=after, between='1,1'
            )
            
            # Extract the data field
            data = response.get('data', [])
            
            # Sort data in ascending order if needed
            data = sorted(data, key=lambda x: int(x[0]))  # Sort by timestamp

            # Filter out data that is already in the file
            if latest_timestamp_in_file_ms is not None:
                data = [entry for entry in data if int(entry[0]) > latest_timestamp_in_file_ms]
            
            # If no new data, break
            if not data:
                print("No new data to append.")
                break

            # Process and store data if data is available
            if data:
                all_batches.append(data)
                # Update 'after' to the earliest timestamp in the data, minus 1 ms to avoid duplicates
                earliest_timestamp = int(data[0][0])
                after = earliest_timestamp - 1
            else:
                print("No data returned from API.")
                break  # Exit the loop if no data is returned

        except Exception as e:
            # Handle any errors that occur during the API request
            print(f"Error fetching data: {e}")

    if all_batches:
        # After fetching all batches, write them in reverse order
        write_batches_to_csv(all_batches)
    else:
        print("No new data to write.")

def write_batches_to_csv(all_batches):
    # Define the CSV file path
    filename = './csv/solana_10min_data.csv'
    
    # Define placeholders for missing values
    placeholders = [None] * 10
    
    # Open CSV file in append mode
    with open(filename, mode='a', newline='') as file:
        writer = csv.writer(file, delimiter='|')  # Use '|' as the delimiter
        
        # Write batches in reverse order
        for data in reversed(all_batches):
            # Write each candlestick entry to the CSV
            for entry in data:
                try:
                    # Parse each entry safely, converting strings to appropriate types if necessary
                    timestamp = int(entry[0])  # Convert timestamp to int if it's a string
                    open_price = float(entry[1]) if entry[1] else None
                    high = float(entry[2]) if entry[2] else None
                    low = float(entry[3]) if entry[3] else None
                    close = float(entry[4]) if entry[4] else None
                    volume = float(entry[5]) if entry[5] else None

                    # Format the timestamp
                    timestamp_formatted = int(timestamp / 1000)  # Convert to seconds since epoch

                    # Row structure based on required format with placeholders for missing values
                    row = [
                        timestamp_formatted,
                        open_price, high, low, close,
                        volume,
                        *placeholders  # Add placeholders for remaining fields
                    ]
                    
                    # Write row
                    writer.writerow(row)

                except (ValueError, TypeError) as e:
                    print(f"Error processing entry {entry}: {e}")
            
            # Add an empty line after each batch
            writer.writerow([])  # Write an empty row to separate batches
        
    print(f"Data written to {filename}")

if __name__ == "__main__":
    # Define the CSV file path
    filename = './csv/solana_10min_data.csv'
    
    # Empty the file contents
    open(filename, 'w').close()
    print(f"{filename} has been emptied.")
    
    # Initial fetch of 60 iterations
    fetch_last_minutes(iterations=60)
    
    # Enter an infinite loop to run a single iteration every 35 seconds
    while True:
        fetch_last_minutes(iterations=1)
        time.sleep(35)  # Wait for 35 seconds before the next fetch
