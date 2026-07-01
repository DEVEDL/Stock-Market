# Nifty 50 SQL Business Analysis Report

This document summarizes the results of running industry-standard analytical SQL queries on the Nifty 50 stock database.

## SQL Business Queries for Nifty 50 Dataset - Query 1: Top 5 Performing Stocks over 1, 5, and 10 Years - Anchor date: 2026-01-30 (last date of dataset) - (A) 1-Year Returns (from 2025-01-30 to 2026-01-30)

### SQL Query
```sql
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
LIMIT 5
```

### Query Result

| Ticker | Company_Name | Sector | Start_Close | End_Close | Return_1Y_Pct |
| --- | --- | --- | --- | --- | --- |
| HINDALCO.NS | Hindalco Industries Ltd. | Metals | 583.5703735351562 | 962.5999755859376 | 64.95011043050275 |
| TATASTEEL.NS | Tata Steel Ltd. | Metals | 128.1318817138672 | 193.1300048828125 | 50.727517850782355 |
| BPCL.NS | Bharat Petroleum Corporation Ltd. | Energy | 248.1715087890625 | 364.5 | 46.87423297644245 |
| SBIN.NS | State Bank of India | Financials | 747.5887451171875 | 1077.1500244140625 | 44.083231783433945 |
| EICHERMOT.NS | Eicher Motors Ltd. | Automobile | 5098.24365234375 | 7122.5 | 39.70497460876874 |

---

## (B) 5-Year Returns (from 2021-01-30 to 2026-01-30)

### SQL Query
```sql
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
LIMIT 5
```

### Query Result

| Ticker | Company_Name | Sector | Start_Close | End_Close | Return_5Y_Pct |
| --- | --- | --- | --- | --- | --- |
| COALINDIA.NS | Coal India Ltd. | Metals | 83.37433624267578 | 440.75 | 428.63989071783317 |
| NTPC.NS | NTPC Ltd. | Power | 74.93738555908203 | 356.0 | 375.0632776203848 |
| M&M.NS | Mahindra & Mahindra Ltd. | Automobile | 758.5704956054688 | 3431.800048828125 | 352.40357603006464 |
| HINDALCO.NS | Hindalco Industries Ltd. | Metals | 232.7263336181641 | 962.5999755859376 | 313.61884605859984 |
| ONGC.NS | Oil & Natural Gas Corporation Ltd. | Energy | 66.91131591796875 | 268.9599914550781 | 301.96488107454786 |

---

## (C) 10-Year Returns (from 2016-01-30 to 2026-01-30)

### SQL Query
```sql
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
LIMIT 5
```

### Query Result

| Ticker | Company_Name | Sector | Start_Close | End_Close | Return_10Y_Pct |
| --- | --- | --- | --- | --- | --- |
| ADANIENT.NS | Adani Enterprises Ltd. | Infrastructure | 39.379615783691406 | 2020.4000244140625 | 5030.573227306059 |
| BAJFINANCE.NS | Bajaj Finance Ltd. | Financials | 58.106571197509766 | 929.8499755859376 | 1500.2492599766197 |
| HINDALCO.NS | Hindalco Industries Ltd. | Metals | 66.717529296875 | 962.5999755859376 | 1342.799194950142 |
| JSWSTEEL.NS | JSW Steel Ltd. | Metals | 94.33966827392578 | 1214.4000244140625 | 1187.2634032249468 |
| TITAN.NS | Titan Company Ltd. | Consumer Durables | 346.03594970703125 | 3977.39990234375 | 1049.4181184675135 |

---

## Query 2: Dividend Analysis - (A) Top 10 cumulative dividend-paying stocks

### SQL Query
```sql
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
LIMIT 10
```

### Query Result

| Ticker | Company_Name | Sector | Cumulative_Dividends_INR |
| --- | --- | --- | --- |
| HEROMOTOCO.NS | Hero MotoCorp Ltd. | Automobile | 1613.0 |
| BAJAJ-AUTO.NS | Bajaj Auto Ltd. | Automobile | 1331.0 |
| SHREECEM.NS | Shree Cement Ltd. | Cement | 1081.5 |
| MARUTI.NS | Maruti Suzuki India Ltd. | Automobile | 871.0 |
| TCS.NS | Tata Consultancy Services Ltd. | IT | 756.25 |
| BRITANNIA.NS | Britannia Industries Ltd. | FMCG | 560.666667 |
| HINDUNILVR.NS | Hindustan Unilever Ltd. | FMCG | 452.05 |
| LTIM.NS | LTIMindtree Ltd. | IT | 401.05 |
| ULTRACEMCO.NS | UltraTech Cement Ltd. | Cement | 379.0 |
| INFY.NS | Infosys Ltd. | IT | 345.585942 |

---

## (B) Sector-wise average dividend yield

### SQL Query
```sql
-- (B) Sector-wise average dividend yield
SELECT 
    Sector, 
    AVG(Current_Dividend_Yield) as Avg_Dividend_Yield_Pct,
    COUNT(Ticker) as Company_Count
FROM nifty50_summary
GROUP BY Sector
ORDER BY Avg_Dividend_Yield_Pct DESC
```

### Query Result

| Sector | Avg_Dividend_Yield_Pct | Company_Count |
| --- | --- | --- |
| Power | 4.1899999999999995 | 2 |
| Energy | 3.9933333333333336 | 3 |
| IT | 3.1300000000000003 | 6 |
| Metals | 2.155 | 4 |
| FMCG | 1.9460000000000002 | 5 |
| Automobile | 1.4380000000000002 | 5 |
| Telecom | 0.81 | 1 |
| Pharma | 0.7875 | 4 |
| Consumer Durables | 0.655 | 2 |
| Cement | 0.5166666666666666 | 3 |
| Financials | 0.5122222222222222 | 10 |
| Infrastructure | 0.47 | 3 |
| Healthcare | 0.29 | 1 |

---

## Query 3: Valuation Analysis - Sector-wise valuation metrics (P/E and P/B ratios) relative to growth (Total Return Pct)

### SQL Query
```sql
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
ORDER BY Avg_PE_Ratio DESC
```

### Query Result

| Sector | Company_Count | Avg_PE_Ratio | Avg_Total_Return_Pct | Avg_Market_Cap_Billion_INR |
| --- | --- | --- | --- | --- |
| Consumer Durables | 2 | 73.03170899999999 | 57970.85621462444 | 2927.944138752 |
| Healthcare | 1 | 59.849525 | 12873.50422270034 | 1000.813101056 |
| FMCG | 5 | 57.98281519999999 | 5205.84678315895 | 2942.9636530176 |
| Cement | 3 | 49.812353 | 36925.759636063034 | 2206.6166934186667 |
| Pharma | 4 | 35.67743625 | 47022.23477354445 | 1879.415619584 |
| Financials | 10 | 35.293055777777774 | 45943.321714632366 | 5542.872245862401 |
| Telecom | 1 | 30.674664 | 13557.259556545108 | 11992.28059648 |
| Automobile | 5 | 29.499272400000002 | 210142.6360966606 | 2890.1640241152004 |
| Infrastructure | 3 | 29.188730000000003 | 1348688.5096166646 | 3764.0713448106667 |
| IT | 6 | 27.391727166666666 | 9174.967652417352 | 4720.919882410667 |
| Metals | 4 | 24.00759325 | 6083.7188881043 | 2560.943947776 |
| Power | 2 | 18.082128 | 849.8734270484765 | 2918.809075712 |
| Energy | 3 | 12.7488392 | 12824.17414631638 | 7949.396257450667 |

---

## Query 4: Volume and Volatility Deep Dive - (A) Top 10 most volatile market-wide trading days (highest average intraday price spread)

### SQL Query
```sql
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
LIMIT 10
```

### Query Result

| Date | Avg_Intraday_Spread_Pct | Stocks_Traded |
| --- | --- | --- |
| 2008-01-22 | 28.332840665045417 | 45 |
| 2020-03-13 | 24.62357868892663 | 49 |
| 2008-10-27 | 18.648488676936793 | 45 |
| 2008-01-21 | 17.620692421040182 | 45 |
| 2009-05-19 | 16.49239277383244 | 45 |
| 2008-10-24 | 15.724690762558962 | 45 |
| 2008-10-10 | 15.365700253921755 | 45 |
| 2008-01-23 | 15.195261967075568 | 45 |
| 2020-03-23 | 14.044190293028183 | 49 |
| 2020-03-18 | 13.696872866290494 | 49 |

---

## (B) Top 10 stocks with the highest average daily trading volume

### SQL Query
```sql
-- (B) Top 10 stocks with the highest average daily trading volume
SELECT 
    Ticker, 
    Company_Name, 
    Sector, 
    AVG(Volume) as Avg_Daily_Volume
FROM nifty50_historical
GROUP BY Ticker
ORDER BY Avg_Daily_Volume DESC
LIMIT 10
```

### Query Result

| Ticker | Company_Name | Sector | Avg_Daily_Volume |
| --- | --- | --- | --- |
| TATASTEEL.NS | Tata Steel Ltd. | Metals | 67107570.29704579 |
| RELIANCE.NS | Reliance Industries Ltd. | Energy | 36796406.898477904 |
| SBIN.NS | State Bank of India | Financials | 23823491.954048462 |
| ITC.NS | ITC Ltd. | FMCG | 19003780.3234816 |
| ICICIBANK.NS | ICICI Bank Ltd. | Financials | 18579673.537568305 |
| INFY.NS | Infosys Ltd. | IT | 14741443.625258494 |
| WIPRO.NS | Wipro Ltd. | IT | 14723213.151698671 |
| KOTAKBANK.NS | Kotak Mahindra Bank Ltd. | Financials | 13622507.233899968 |
| HDFCBANK.NS | HDFC Bank Ltd. | Financials | 13280929.274002954 |
| POWERGRID.NS | Power Grid Corporation of India Ltd. | Power | 11930462.457945993 |

---

## Query 5: Technical Analysis - Moving Average Crossovers (Golden and Death Crosses) - Detect the 20 most recent crossovers across the index

### SQL Query
```sql
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
LIMIT 20
```

### Query Result

| Date | Ticker | Company_Name | MA_50 | MA_200 | Cross_Type |
| --- | --- | --- | --- | --- | --- |
| 2026-01-30 | HDFCBANK.NS | HDFC Bank Ltd. | 973.002998046875 | 974.0238250732422 | Death Cross (Bearish) |
| 2026-01-27 | HDFCLIFE.NS | HDFC Life Insurance Company Ltd. | 756.2529956054688 | 757.1143756103515 | Death Cross (Bearish) |
| 2026-01-22 | DRREDDY.NS | Dr. Reddy's Laboratories Ltd. | 1245.0039990234377 | 1245.5741436767578 | Death Cross (Bearish) |
| 2026-01-21 | TCS.NS | Tata Consultancy Services Ltd. | 3146.0986962890624 | 3145.9783288574217 | Golden Cross (Bullish) |
| 2026-01-09 | APOLLOHOSP.NS | Apollo Hospitals Enterprise Ltd. | 7290.5 | 7298.800844726563 | Death Cross (Bearish) |
| 2026-01-09 | CIPLA.NS | Cipla Ltd. | 1509.3300073242187 | 1511.2634210205078 | Death Cross (Bearish) |
| 2026-01-01 | HINDUNILVR.NS | Hindustan Unilever Ltd. | 2391.020751953125 | 2396.711462402344 | Death Cross (Bearish) |
| 2025-12-26 | WIPRO.NS | Wipro Ltd. | 244.07381744384764 | 243.7766714477539 | Golden Cross (Bullish) |
| 2025-12-22 | ULTRACEMCO.NS | UltraTech Cement Ltd. | 11814.32 | 11826.243090820311 | Death Cross (Bearish) |
| 2025-12-19 | TECHM.NS | Tech Mahindra Ltd. | 1484.51744140625 | 1483.0274536132813 | Golden Cross (Bullish) |
| 2025-12-15 | ADANIENT.NS | Adani Enterprises Ltd. | 2411.6278564453123 | 2414.688577880859 | Death Cross (Bearish) |
| 2025-12-15 | INFY.NS | Infosys Ltd. | 1516.8980004882812 | 1516.0592901611328 | Golden Cross (Bullish) |
| 2025-12-11 | INDUSINDBK.NS | IndusInd Bank Ltd. | 803.5900012207031 | 802.6910009765625 | Golden Cross (Bullish) |
| 2025-12-09 | HCLTECH.NS | HCL Technologies Ltd. | 1531.0885180664063 | 1530.584482421875 | Golden Cross (Bullish) |
| 2025-12-08 | NTPC.NS | NTPC Ltd. | 331.7698089599609 | 332.24387298583986 | Death Cross (Bearish) |
| 2025-11-27 | ICICIBANK.NS | ICICI Bank Ltd. | 1375.5700024414064 | 1376.0435369873046 | Death Cross (Bearish) |
| 2025-11-26 | SUNPHARMA.NS | Sun Pharmaceutical Industries Ltd. | 1683.7739990234377 | 1681.0295666503907 | Golden Cross (Bullish) |
| 2025-11-06 | SHREECEM.NS | Shree Cement Ltd. | 29324.304609375 | 29384.405029296875 | Death Cross (Bearish) |
| 2025-10-31 | ONGC.NS | Oil & Natural Gas Corporation Ltd. | 235.22953399658203 | 235.02113410949707 | Golden Cross (Bullish) |
| 2025-10-27 | KOTAKBANK.NS | Kotak Mahindra Bank Ltd. | 409.50240234375 | 409.159955444336 | Golden Cross (Bullish) |

---

