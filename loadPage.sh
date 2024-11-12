#!/bin/bash

while true; do
    # Run Google Chrome in the background by spawning it in a subshell
    (
        /usr/bin/google-chrome --headless --disable-gpu --remote-debugging-port=9222 --no-sandbox http://localhost:8000 2>/dev/null
    ) &
    
    # Get the process ID of the background command
    CHROME_PID=$!

    # Initialize progress bar
    echo -ne "\033[1;35mProgress:\033[0m "  # Set text color to pink (magenta)
    
    # Display a 35-second progress bar
    for i in {1..35}; do
        echo -ne "\033[1;35m▮\033[0m"  # Display a pink block
        sleep 1
    done
    echo  # Move to the next line after the progress bar is complete

    # Kill the process if it's still running
    if ps -p $CHROME_PID > /dev/null; then
        kill $CHROME_PID
        echo "Chrome process killed after 35 seconds"
    fi

    # Display message
    echo "A new entry should be in the protocol the moment the next progress bar starts..."

    # Wait for an additional 5 seconds to complete the 40-second interval
    sleep 5
done
