// script.js

// Variables for start and end dates (YYYY-MM-DD format)
var startDate = '2020-12-10';
var endDate = '2021-01-10';

// Variable for trailing stop-loss percentage (e.g., 1.5 for 1.5%)
var trailingSLValue = 1.5 / 100; // Convert to decimal immediately

// Variable for initial portfolio value (initial margin)
var initialPortfolioValue = 466000;

// Variable for trading direction: 1 for short, 2 for long
var tradingDirection = 2; // Change to 1 for short, 2 for long

// Variable for leverage
var leverage = 2; // Adjust leverage as needed
//3x best for sol

// Variable for SpreadCost (added by me)
var spreadCostPercent = 1.11;

// Variable for trading fees (as a percentage, e.g., 0.04 for 0.04%)
var tradingFeeRatePercent = 0.04;

// Variable for funding rate (as a percentage, e.g., 0.01 for 0.01%)
// Funding rates are typically applied every 8 hours
var fundingRatePercent = 0.01;

// Variable for slippage (as a percentage, e.g., 0.05 for 0.05%)
// Slippage affects entry and exit prices
var slippageRatePercent = 0.05;

// Variable to control whether to show the no-stop-loss line
var showNoStopLossLine = true; // Set to true to display the line, false to hide

// Convert percentage rates to decimal format
var tradingFeeRate = tradingFeeRatePercent / 100;
var fundingRate = fundingRatePercent / 100;
var slippageRate = slippageRatePercent / 100;

// Create a div with id 'plot' and append it to the body
var plotDiv = document.createElement('div');
plotDiv.id = 'plot';
document.body.appendChild(plotDiv);

// Set the div to fill the viewport height
plotDiv.style.height = '98vh';

// Set the background gradient from gray to black
plotDiv.style.background = 'linear-gradient(to bottom, gray, black)';

// Parse the CSV file and plot the graph

//Papa.parse('./CCTX/csv/solana_10min_data.csv', {
Papa.parse('SOLBUSD.csv', {
    download: true,
    delimiter: '|',
    complete: function (results) {
        var data = results.data;

        var dates = [];
        var closes = [];

        // Arrays to store markers for stop-losses and re-entries
        var stopLossDates = [];
        var stopLossPrices = [];
        var reEntryDates = [];
        var reEntryPrices = [];

        // Arrays for no-stop-loss calculation
        var datesNoSL = [];
        var portfolioValuesNoSL = [];

        // Convert startDate and endDate to timestamps
        var startTimestamp = new Date(startDate).getTime();
        var endTimestamp = new Date(endDate).getTime();

        // Variables for portfolio management
        var cashBalance = initialPortfolioValue; // Cash portion of the portfolio
        var positionValue = 0; // Value of the open position (0 when uninvested)
        var portfolioValue = cashBalance + positionValue;

        var position = null; // null when not in a position, else an object with position details

        var accumulatedFunding = 0;
        var lastFundingTimestamp = null;

        var positionSize = 0;
        var numberOfTokens = 0;
        var entryPrice = 0;

        var maxPrice = 0; // For trailing stop-loss
        var minPrice = Infinity;

        var invested = false;
        var previousInvestedStatus = invested;

        // Variables for no-stop-loss portfolio management
        var cashBalanceNoSL = initialPortfolioValue; // Cash portion of the portfolio
        var positionValueNoSL = 0; // Value of the open position
        var portfolioValueNoSL = cashBalanceNoSL + positionValueNoSL;

        var positionSizeNoSL = 0;
        var numberOfTokensNoSL = 0;
        var entryPriceNoSL = 0;

        var accumulatedFundingNoSL = 0;
        var lastFundingTimestampNoSL = null;

        var investedNoSL = false;

        // Array to hold segments for plotting
        var segments = [];
        var currentSegment = {
            dates: [],
            portfolioValues: [],
            invested: invested
        };

        // Variables to hold the end of the last invested period
        var lastInvestedEndDate = null;
        var lastInvestedEndValue = null;

        data.forEach(function (row, index) {
            // Skip empty rows
            if (row.length > 1) {
                var timestamp = parseInt(row[0]) * 1000; // Convert to milliseconds
                var close = parseFloat(row[4]);

                // Check if timestamp is within the specified date range
                if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
                    var date = new Date(timestamp);
                    dates.push(date);
                    closes.push(close);

                    // For the no-stop-loss calculation
                    datesNoSL.push(date);

                    // No-Stop-Loss calculation
                    if (!investedNoSL) {
                        // Enter position at the first timestamp
                        entryPriceNoSL = close * (tradingDirection === 2 ? (1 + slippageRate) : (1 - slippageRate));

                        // Calculate position size considering leverage
                        positionSizeNoSL = cashBalanceNoSL * leverage;

                        // Subtract opening trading fee from cash balance
                        var openingFeeNoSL = positionSizeNoSL * tradingFeeRate;
                        cashBalanceNoSL -= openingFeeNoSL;

                        // Calculate number of tokens
                        numberOfTokensNoSL = positionSizeNoSL / entryPriceNoSL;

                        investedNoSL = true;

                        // Set funding timestamp
                        lastFundingTimestampNoSL = timestamp;
                    }

                    if (investedNoSL) {
                        // Apply funding rate every 8 hours
                        if (lastFundingTimestampNoSL !== null && timestamp - lastFundingTimestampNoSL >= 8 * 60 * 60 * 1000) {
                            var fundingIntervalsNoSL = Math.floor((timestamp - lastFundingTimestampNoSL) / (8 * 60 * 60 * 1000));
                            var fundingFeeNoSL = (fundingRate * positionSizeNoSL) * fundingIntervalsNoSL * (tradingDirection === 2 ? -1 : 1);
                            accumulatedFundingNoSL += fundingFeeNoSL;
                            lastFundingTimestampNoSL += fundingIntervalsNoSL * 8 * 60 * 60 * 1000;
                        }

                        // Calculate PnL based on trading direction
                        var PnLNoSL;
                        if (tradingDirection === 2) {
                            // Long position
                            PnLNoSL = (close - entryPriceNoSL) * numberOfTokensNoSL;
                        } else if (tradingDirection === 1) {
                            // Short position
                            PnLNoSL = (entryPriceNoSL - close) * numberOfTokensNoSL;
                        } else {
                            // Invalid trading direction
                            PnLNoSL = 0;
                        }

                        // Update position value
                        positionValueNoSL = PnLNoSL + accumulatedFundingNoSL;

                        // Calculate total portfolio value
                        portfolioValueNoSL = cashBalanceNoSL + positionValueNoSL;

                        // Store portfolio value
                        portfolioValuesNoSL.push(portfolioValueNoSL);
                    }

                    // Existing code for re-entries, stop-losses, and invested segments...

                    // Check for re-entry when not invested
                    if (!invested) {
                        if (tradingDirection === 2) {
                            // Long position, wait for local minimum
                            if (index > 0 && index < data.length - 1) {
                                var prevClose = parseFloat(data[index - 1][4]);
                                var nextClose = parseFloat(data[index + 1][4]);

                                if (close < prevClose && close < nextClose) {
                                    // Local minimum found, re-enter position
                                    entryPrice = close * (1 + slippageRate); // Adjust entry price for slippage

                                    // Calculate position size considering leverage
                                    positionSize = cashBalance * leverage;

                                    // Subtract opening trading fee from cash balance
                                    var openingFee = positionSize * tradingFeeRate;
                                    cashBalance -= openingFee;

                                    // Calculate number of tokens
                                    numberOfTokens = positionSize / entryPrice;

                                    // Initialize variables for position
                                    position = {
                                        tradingDirection: tradingDirection,
                                    };

                                    invested = true;

                                    // Set funding timestamp
                                    lastFundingTimestamp = timestamp;

                                    // Initialize maxPrice
                                    maxPrice = entryPrice;

                                    // Mark re-entry point
                                    reEntryDates.push(date);
                                    reEntryPrices.push(close);

                                    // Record the start of the invested period
                                    var investedStartDate = date;
                                    var investedStartValue = cashBalance; // Portfolio value at re-entry

                                    // Create uninvested segment connecting last invested end to current invested start
                                    if (lastInvestedEndDate !== null) {
                                        segments.push({
                                            dates: [lastInvestedEndDate, investedStartDate],
                                            portfolioValues: [lastInvestedEndValue, investedStartValue],
                                            invested: false
                                        });
                                    }

                                    // Start a new invested segment
                                    currentSegment = {
                                        dates: [],
                                        portfolioValues: [],
                                        invested: true
                                    };
                                    previousInvestedStatus = invested;

                                    // Add the current point to the invested segment
                                    currentSegment.dates.push(date);
                                    currentSegment.portfolioValues.push(investedStartValue);

                                    // Continue to next iteration
                                    return;
                                }
                            }
                        } else if (tradingDirection === 1) {
                            // Short position, wait for local maximum
                            if (index > 0 && index < data.length - 1) {
                                var prevClose = parseFloat(data[index - 1][4]);
                                var nextClose = parseFloat(data[index + 1][4]);

                                if (close > prevClose && close > nextClose) {
                                    // Local maximum found, re-enter position
                                    entryPrice = close * (1 - slippageRate); // Adjust entry price for slippage

                                    // Calculate position size considering leverage
                                    positionSize = cashBalance * leverage;

                                    // Subtract opening trading fee from cash balance
                                    var openingFee = positionSize * tradingFeeRate;
                                    cashBalance -= openingFee;

                                    // Calculate number of tokens
                                    numberOfTokens = positionSize / entryPrice;

                                    // Initialize variables for position
                                    position = {
                                        tradingDirection: tradingDirection,
                                    };

                                    invested = true;

                                    // Set funding timestamp
                                    lastFundingTimestamp = timestamp;

                                    // Initialize minPrice
                                    minPrice = entryPrice;

                                    // Mark re-entry point
                                    reEntryDates.push(date);
                                    reEntryPrices.push(close);

                                    // Record the start of the invested period
                                    var investedStartDate = date;
                                    var investedStartValue = cashBalance; // Portfolio value at re-entry

                                    // Create uninvested segment connecting last invested end to current invested start
                                    if (lastInvestedEndDate !== null) {
                                        segments.push({
                                            dates: [lastInvestedEndDate, investedStartDate],
                                            portfolioValues: [lastInvestedEndValue, investedStartValue],
                                            invested: false
                                        });
                                    }

                                    // Start a new invested segment
                                    currentSegment = {
                                        dates: [],
                                        portfolioValues: [],
                                        invested: true
                                    };
                                    previousInvestedStatus = invested;

                                    // Add the current point to the invested segment
                                    currentSegment.dates.push(date);
                                    currentSegment.portfolioValues.push(investedStartValue);

                                    // Continue to next iteration
                                    return;
                                }
                            }
                        }
                    }

                    if (invested) {
                        // Apply funding rate every 8 hours
                        if (lastFundingTimestamp !== null && timestamp - lastFundingTimestamp >= 8 * 60 * 60 * 1000) {
                            var fundingIntervals = Math.floor((timestamp - lastFundingTimestamp) / (8 * 60 * 60 * 1000));
                            var fundingFee = (fundingRate * positionSize) * fundingIntervals * (position.tradingDirection === 2 ? -1 : 1);
                            accumulatedFunding += fundingFee;
                            lastFundingTimestamp += fundingIntervals * 8 * 60 * 60 * 1000;
                        }

                        // Update maxPrice or minPrice for trailing stop-loss
                        if (position.tradingDirection === 2) {
                            // Long position
                            if (close > maxPrice) {
                                maxPrice = close;
                            }

                            // Calculate trailing stop price
                            var trailingStopPrice = maxPrice * (1 - trailingSLValue);

                            // Check if trailing stop-loss is hit
                            if (close <= trailingStopPrice) {
                                // Adjust close price for slippage
                                var exitPrice = close * (1 - slippageRate);

                                // Calculate PnL
                                var PnL = (exitPrice - entryPrice) * numberOfTokens;

                                // Subtract closing trading fee from cash balance
                                var closingFee = positionSize * tradingFeeRate;
                                cashBalance += PnL + accumulatedFunding - closingFee;

                                // Reset position value
                                positionValue = 0;

                                // Mark stop-loss point
                                stopLossDates.push(date);
                                stopLossPrices.push(close);

                                // Record the end of the invested period
                                lastInvestedEndDate = date;
                                lastInvestedEndValue = cashBalance; // Portfolio value at exit

                                // Add the current point to the invested segment
                                currentSegment.dates.push(date);
                                currentSegment.portfolioValues.push(lastInvestedEndValue);

                                // Save the invested segment
                                segments.push(currentSegment);

                                // Reset variables for next trade
                                position = null;
                                invested = false;
                                accumulatedFunding = 0;
                                lastFundingTimestamp = null;
                                maxPrice = 0;
                                minPrice = Infinity;
                                previousInvestedStatus = invested;

                                // Continue to next iteration
                                return;
                            }
                        } else if (position.tradingDirection === 1) {
                            // Short position
                            if (close < minPrice) {
                                minPrice = close;
                            }

                            // Calculate trailing stop price
                            var trailingStopPrice = minPrice * (1 + trailingSLValue);

                            // Check if trailing stop-loss is hit
                            if (close >= trailingStopPrice) {
                                // Adjust close price for slippage
                                var exitPrice = close * (1 + slippageRate);

                                // Calculate PnL
                                var PnL = (entryPrice - exitPrice) * numberOfTokens;

                                // Subtract closing trading fee from cash balance
                                var closingFee = positionSize * tradingFeeRate;
                                cashBalance += PnL + accumulatedFunding - closingFee;

                                // Reset position value
                                positionValue = 0;

                                // Mark stop-loss point
                                stopLossDates.push(date);
                                stopLossPrices.push(close);

                                // Record the end of the invested period
                                lastInvestedEndDate = date;
                                lastInvestedEndValue = cashBalance; // Portfolio value at exit

                                // Add the current point to the invested segment
                                currentSegment.dates.push(date);
                                currentSegment.portfolioValues.push(lastInvestedEndValue);

                                // Save the invested segment
                                segments.push(currentSegment);

                                // Reset variables for next trade
                                position = null;
                                invested = false;
                                accumulatedFunding = 0;
                                lastFundingTimestamp = null;
                                maxPrice = 0;
                                minPrice = Infinity;
                                previousInvestedStatus = invested;

                                // Continue to next iteration
                                return;
                            }
                        }

                        // Calculate PnL based on trading direction
                        var PnL;
                        if (position.tradingDirection === 2) {
                            // Long position
                            PnL = (close - entryPrice) * numberOfTokens;
                        } else if (position.tradingDirection === 1) {
                            // Short position
                            PnL = (entryPrice - close) * numberOfTokens;
                        } else {
                            // Invalid trading direction
                            PnL = 0;
                        }

                        // Update position value
                        positionValue = PnL + accumulatedFunding;

                        // Calculate total portfolio value
                        portfolioValue = cashBalance + positionValue;

                        // Add the current point to the invested segment
                        currentSegment.dates.push(date);
                        currentSegment.portfolioValues.push(portfolioValue);
                    }
                }
            }
        });

        // If we are still invested at the end, save the last invested segment
        if (invested && currentSegment.dates.length > 0) {
            segments.push(currentSegment);
        }

        // If we are still invested in the no-stop-loss calculation, close the position
        if (investedNoSL && datesNoSL.length > 0) {
            // Use the last close price for exit
            var exitPriceNoSL = close * (tradingDirection === 2 ? (1 - slippageRate) : (1 + slippageRate));

            // Calculate PnL
            if (tradingDirection === 2) {
                // Long position
                PnLNoSL = (exitPriceNoSL - entryPriceNoSL) * numberOfTokensNoSL;
            } else if (tradingDirection === 1) {
                // Short position
                PnLNoSL = (entryPriceNoSL - exitPriceNoSL) * numberOfTokensNoSL;
            } else {
                // Invalid trading direction
                PnLNoSL = 0;
            }

            // Subtract closing trading fee from cash balance
            var closingFeeNoSL = positionSizeNoSL * tradingFeeRate;
            cashBalanceNoSL += PnLNoSL + accumulatedFundingNoSL - closingFeeNoSL;

            // Update final portfolio value
            portfolioValueNoSL = cashBalanceNoSL;

            // Adjust the last portfolio value
            portfolioValuesNoSL[portfolioValuesNoSL.length - 1] = portfolioValueNoSL;
        }

        var trace1 = {
            x: dates,
            y: closes,
            type: 'scatter',
            mode: 'lines',
            name: 'Closing Price',
            line: {
                color: 'orange',
                width: 2,
                opacity: 0.7,
            },
        };

        // Create traces for each segment (magenta line with stop losses)
        var portfolioTraces = segments.map(function (segment, index) {
            return {
                x: segment.dates,
                y: segment.portfolioValues,
                type: 'scatter',
                mode: 'lines',
                name: index === 0 ? 'Portfolio Value (With Stop Loss)' : undefined,
                line: {
                    color: 'magenta',
                    width: 2,
                },
                yaxis: 'y2',
                showlegend: index === 0, // Show legend only for the first segment
            };
        });

        // Trace for stop-loss points
        var traceStopLoss = {
            x: stopLossDates,
            y: stopLossPrices,
            type: 'scatter',
            mode: 'markers',
            name: 'Stop-Loss',
            marker: {
                color: 'red',
                size: 8,
                symbol: 'circle',
            },
        };

        // Trace for re-entry points
        var traceReEntry = {
            x: reEntryDates,
            y: reEntryPrices,
            type: 'scatter',
            mode: 'markers',
            name: 'Re-Entry',
            marker: {
                color: 'green',
                size: 8,
                symbol: 'circle',
            },
        };

        var layout = {
            title: `SOL/BUSD Closing Prices and Portfolio Value (${startDate} to ${endDate})`,
            xaxis: {
                title: 'Time',
                type: 'date',
            },
            yaxis: {
                title: 'Closing Price',
                titlefont: { color: 'orange' },
                tickfont: { color: 'orange' },
            },
            yaxis2: {
                title: 'Portfolio Value',
                titlefont: { color: 'magenta' },
                tickfont: { color: 'magenta' },
                overlaying: 'y',
                side: 'right',
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            autosize: true,
            margin: { t: 50, b: 50, l: 50, r: 50 },
            legend: {
                x: 0.01,
                y: 0.99,
            },
        };

        // Combine all traces
        var allTraces = [trace1];

        // Add portfolio traces (magenta line)
        allTraces = allTraces.concat(portfolioTraces);

        // Add stop-loss and re-entry markers
        allTraces.push(traceStopLoss, traceReEntry);

        // Add the purple line if the variable is true
        if (showNoStopLossLine) {
            var traceNoSL = {
                x: datesNoSL,
                y: portfolioValuesNoSL,
                type: 'scatter',
                mode: 'lines',
                name: 'Portfolio Value (No Stop Loss)',
                line: {
                    color: 'purple',
                    width: 2,
                },
                yaxis: 'y2',
            };

            allTraces.push(traceNoSL);
        }

        Plotly.newPlot(
            'plot',
            allTraces,
            layout,
            { responsive: true }
        );

        // Compare the last timestamps of stopLossDates and reEntryDates
        var lastStopLossDate = stopLossDates.length > 0 ? stopLossDates[stopLossDates.length - 1] : null;
        var lastReEntryDate = reEntryDates.length > 0 ? reEntryDates[reEntryDates.length - 1] : null;

        // Add the sendOrder function
        async function sendOrder(type, timestamp) {
            // Define the endpoint and data to send
            const url = 'http://localhost:9000/write_order';
            const data = {
                type: type,
                timestamp: parseInt(timestamp),  // Ensure timestamp is a number
                executed: false,
                humanOrderTime: new Date(timestamp).toLocaleString(),
                humanReceptionTime: new Date().toLocaleString()
            };

            try {
                // Send the POST request
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                // Check if the response is successful and log the result
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();
                console.log('Response from server:', result);

            } catch (error) {
                console.error('Error:', error);
            }
        }

        // Replace existing fetch calls with sendOrder

        if (lastStopLossDate && lastReEntryDate) {
            if (lastStopLossDate > lastReEntryDate) {
                // Latest event is a stop loss
                sendOrder('SELL', lastStopLossDate.getTime());
                console.log("Triggering SL: " + lastStopLossDate.getTime());
            } else if (lastReEntryDate > lastStopLossDate) {
                // Latest event is a re-entry
                sendOrder('BUY', lastReEntryDate.getTime());
                console.log("Triggering entry: " + lastReEntryDate.getTime());
            } else {
                // Both events happened at the same time (unlikely but possible)
                console.log('Both events occurred simultaneously.');
            }
        } else if (lastStopLossDate) {
            // Only stopLossDates has dates
            sendOrder('SELL', lastStopLossDate.getTime());
            console.log("Triggering SL: " + lastStopLossDate.getTime());

        } else if (lastReEntryDate) {
            // Only reEntryDates has dates
            sendOrder('BUY', lastReEntryDate.getTime());
            console.log("Triggering entry: " + lastReEntryDate.getTime());
        } else {
            // Neither array has dates; no action needed
            console.log('No stop-loss or re-entry events recorded.');
        }

    },
});
