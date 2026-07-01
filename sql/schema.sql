-- Schema definition for Nifty 50 Stock Database (SQLite)

-- Drop tables if they exist to allow clean re-runs
DROP TABLE IF EXISTS nifty50_historical;
DROP TABLE IF EXISTS nifty50_summary;

-- 1. Daily Historical Stock Data Table
CREATE TABLE nifty50_historical (
    Date TEXT NOT NULL,
    Ticker TEXT NOT NULL,
    Company_Name TEXT NOT NULL,
    Sector TEXT NOT NULL,
    Open REAL NOT NULL,
    High REAL NOT NULL,
    Low REAL NOT NULL,
    Close REAL NOT NULL,
    Volume INTEGER NOT NULL,
    Dividend REAL DEFAULT 0.0,
    Stock_Split REAL DEFAULT 0.0,
    Daily_Return REAL DEFAULT 0.0,
    Volatility_20D REAL,
    MA_50 REAL,
    MA_200 REAL,
    Market_Cap REAL,
    PE_Ratio REAL,
    Forward_PE REAL,
    Price_to_Book REAL,
    Dividend_Yield REAL,
    EPS REAL,
    Beta REAL,
    "52Week_High" REAL,
    "52Week_Low" REAL,
    PRIMARY KEY (Ticker, Date)
);

-- 2. Stock Summary Statistics Table
CREATE TABLE nifty50_summary (
    Ticker TEXT PRIMARY KEY,
    Company_Name TEXT NOT NULL,
    Sector TEXT NOT NULL,
    First_Date TEXT NOT NULL,
    Last_Date TEXT NOT NULL,
    Total_Trading_Days INTEGER NOT NULL,
    Starting_Price REAL NOT NULL,
    Ending_Price REAL NOT NULL,
    Total_Return_Pct REAL NOT NULL,
    Highest_Price REAL NOT NULL,
    Lowest_Price REAL NOT NULL,
    Avg_Daily_Volume REAL NOT NULL,
    Total_Dividends_Paid REAL NOT NULL,
    Number_of_Splits INTEGER NOT NULL,
    Avg_Daily_Return_Pct REAL NOT NULL,
    Volatility_Pct REAL NOT NULL,
    Current_Market_Cap REAL,
    Current_PE_Ratio REAL,
    Current_Dividend_Yield REAL
);

-- Indexes for performance optimization
CREATE INDEX idx_historical_date ON nifty50_historical(Date);
CREATE INDEX idx_historical_sector ON nifty50_historical(Sector);
CREATE INDEX idx_summary_sector ON nifty50_summary(Sector);
CREATE INDEX idx_historical_ticker_date ON nifty50_historical(Ticker, Date);
