-- SQL Business Queries for Nifty 50 Dataset

-- Query 1: Top 5 Performing Stocks over 1, 5, and 10 Years
-- Anchor date: 2026-01-30 (last date of dataset)

-- (A) 1-Year Returns (from 2025-01-30 to 2026-01-30)
WITH StartEnd1Y AS (
    SELECT 
        Ticker,
        Company_Name,
        Sector,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date >= '2025-01-30' ORDER BY Date ASC LIMIT 1) as Start_Close,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date <= '2026-01-30' ORDER BY Date DESC LIMIT 1) as End_Close
    FROM nifty50_historical h1
    GROUP BY Ticker
)
SELECT 
    Ticker,
    Company_Name,
    Sector,
    Start_Close,
    End_Close,
    ((End_Close - Start_Close) / Start_Close) * 100 AS Return_1Y_Pct
FROM StartEnd1Y
WHERE Start_Close IS NOT NULL AND End_Close IS NOT NULL
ORDER BY Return_1Y_Pct DESC
LIMIT 5;

-- (B) 5-Year Returns (from 2021-01-30 to 2026-01-30)
WITH StartEnd5Y AS (
    SELECT 
        Ticker,
        Company_Name,
        Sector,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date >= '2021-01-30' ORDER BY Date ASC LIMIT 1) as Start_Close,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date <= '2026-01-30' ORDER BY Date DESC LIMIT 1) as End_Close
    FROM nifty50_historical h1
    GROUP BY Ticker
)
SELECT 
    Ticker,
    Company_Name,
    Sector,
    Start_Close,
    End_Close,
    ((End_Close - Start_Close) / Start_Close) * 100 AS Return_5Y_Pct
FROM StartEnd5Y
WHERE Start_Close IS NOT NULL AND End_Close IS NOT NULL
ORDER BY Return_5Y_Pct DESC
LIMIT 5;

-- (C) 10-Year Returns (from 2016-01-30 to 2026-01-30)
WITH StartEnd10Y AS (
    SELECT 
        Ticker,
        Company_Name,
        Sector,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date >= '2016-01-30' ORDER BY Date ASC LIMIT 1) as Start_Close,
        (SELECT Close FROM nifty50_historical h2 WHERE h2.Ticker = h1.Ticker AND h2.Date <= '2026-01-30' ORDER BY Date DESC LIMIT 1) as End_Close
    FROM nifty50_historical h1
    GROUP BY Ticker
)
SELECT 
    Ticker,
    Company_Name,
    Sector,
    Start_Close,
    End_Close,
    ((End_Close - Start_Close) / Start_Close) * 100 AS Return_10Y_Pct
FROM StartEnd10Y
WHERE Start_Close IS NOT NULL AND End_Close IS NOT NULL
ORDER BY Return_10Y_Pct DESC
LIMIT 5;


-- Query 2: Dividend Analysis
-- (A) Top 10 cumulative dividend-paying stocks
SELECT 
    Ticker, 
    Company_Name, 
    Sector, 
    SUM(Dividend) as Cumulative_Dividends_INR
FROM nifty50_historical
GROUP BY Ticker
ORDER BY Cumulative_Dividends_INR DESC
LIMIT 10;

-- (B) Sector-wise average dividend yield
SELECT 
    Sector, 
    AVG(Current_Dividend_Yield) as Avg_Dividend_Yield_Pct,
    COUNT(Ticker) as Company_Count
FROM nifty50_summary
GROUP BY Sector
ORDER BY Avg_Dividend_Yield_Pct DESC;


-- Query 3: Valuation Analysis
-- Sector-wise valuation metrics (P/E and P/B ratios) relative to growth (Total Return Pct)
SELECT 
    Sector,
    COUNT(Ticker) as Company_Count,
    AVG(Current_PE_Ratio) as Avg_PE_Ratio,
    AVG(Total_Return_Pct) as Avg_Total_Return_Pct,
    AVG(Current_Market_Cap) / 1e9 as Avg_Market_Cap_Billion_INR
FROM nifty50_summary
GROUP BY Sector
ORDER BY Avg_PE_Ratio DESC;


-- Query 4: Volume and Volatility Deep Dive
-- (A) Top 10 most volatile market-wide trading days (highest average intraday price spread)
SELECT 
    Date,
    AVG((High - Low) / Low) * 100 as Avg_Intraday_Spread_Pct,
    COUNT(Ticker) as Stocks_Traded
FROM nifty50_historical
GROUP BY Date
HAVING Stocks_Traded >= 45
ORDER BY Avg_Intraday_Spread_Pct DESC
LIMIT 10;

-- (B) Top 10 stocks with the highest average daily trading volume
SELECT 
    Ticker, 
    Company_Name, 
    Sector, 
    AVG(Volume) as Avg_Daily_Volume
FROM nifty50_historical
GROUP BY Ticker
ORDER BY Avg_Daily_Volume DESC
LIMIT 10;


-- Query 5: Technical Analysis - Moving Average Crossovers (Golden and Death Crosses)
-- Detect the 20 most recent crossovers across the index
WITH MA_Prev AS (
    SELECT 
        Date,
        Ticker,
        Company_Name,
        MA_50,
        MA_200,
        LAG(MA_50, 1) OVER (PARTITION BY Ticker ORDER BY Date) as MA_50_Prev,
        LAG(MA_200, 1) OVER (PARTITION BY Ticker ORDER BY Date) as MA_200_Prev
    FROM nifty50_historical
    WHERE MA_50 IS NOT NULL AND MA_200 IS NOT NULL
)
SELECT 
    Date,
    Ticker,
    Company_Name,
    MA_50,
    MA_200,
    CASE 
        WHEN MA_50_Prev <= MA_200_Prev AND MA_50 > MA_200 THEN 'Golden Cross (Bullish)'
        WHEN MA_50_Prev >= MA_200_Prev AND MA_50 < MA_200 THEN 'Death Cross (Bearish)'
    END as Cross_Type
FROM MA_Prev
WHERE 
    (MA_50_Prev <= MA_200_Prev AND MA_50 > MA_200) OR
    (MA_50_Prev >= MA_200_Prev AND MA_50 < MA_200)
ORDER BY Date DESC
LIMIT 20;
