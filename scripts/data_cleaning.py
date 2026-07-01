import os
import pandas as pd
import numpy as np

def clean_data():
    base_dir = r"c:\Stock Market"
    raw_hist_path = os.path.join(base_dir, "data", "raw", "nifty50_historical_data.csv")
    raw_sum_path = os.path.join(base_dir, "data", "raw", "nifty50_summary_statistics.csv")
    
    proc_hist_path = os.path.join(base_dir, "data", "processed", "nifty50_historical_data_cleaned.csv")
    proc_sum_path = os.path.join(base_dir, "data", "processed", "nifty50_summary_statistics_cleaned.csv")
    
    print("Loading raw datasets...")
    df_hist = pd.read_csv(raw_hist_path)
    df_sum = pd.read_csv(raw_sum_path)
    
    print(f"Raw Historical Data shape: {df_hist.shape}")
    print(f"Raw Summary Statistics shape: {df_sum.shape}")
    
    # --- 1. Clean Historical Data ---
    print("\nCleaning Historical Data...")
    
    # Trim whitespaces
    for col in ['Ticker', 'Company_Name', 'Sector']:
        df_hist[col] = df_hist[col].astype(str).str.strip()
        
    # Standardize Dates (from '1999-01-01 00:00:00+05:30' to '1999-01-01')
    df_hist['Date'] = pd.to_datetime(df_hist['Date'], errors='coerce')
    df_hist['Date'] = df_hist['Date'].dt.strftime('%Y-%m-%d')
    
    # Drop rows with invalid dates
    initial_rows = len(df_hist)
    df_hist = df_hist.dropna(subset=['Date'])
    print(f"Dropped {initial_rows - len(df_hist)} rows due to invalid dates.")
    
    # Handle negative and zero prices
    # We clip or drop rows where any of the core price columns are <= 0
    price_cols = ['Open', 'High', 'Low', 'Close']
    invalid_prices_mask = (df_hist[price_cols] <= 0).any(axis=1)
    num_invalid_prices = invalid_prices_mask.sum()
    if num_invalid_prices > 0:
        df_hist = df_hist[~invalid_prices_mask]
        print(f"Dropped {num_invalid_prices} rows with negative or zero prices.")
        
    # Correct High < Low anomalies
    # If High < Low, swap them
    high_low_anomaly = df_hist['High'] < df_hist['Low']
    num_anomalies = high_low_anomaly.sum()
    if num_anomalies > 0:
        print(f"Swapping High and Low for {num_anomalies} rows where High < Low.")
        temp_high = df_hist.loc[high_low_anomaly, 'High'].copy()
        df_hist.loc[high_low_anomaly, 'High'] = df_hist.loc[high_low_anomaly, 'Low']
        df_hist.loc[high_low_anomaly, 'Low'] = temp_high
        
    # Fill Stock_Split nulls with 0.0
    df_hist['Stock_Split'] = df_hist['Stock_Split'].fillna(0.0)
    
    # Fill Daily_Return nulls with 0.0 (the first day of listing)
    df_hist['Daily_Return'] = df_hist['Daily_Return'].fillna(0.0)
    
    # Drop PEG_Ratio as it is 100% null
    if 'PEG_Ratio' in df_hist.columns:
        df_hist = df_hist.drop(columns=['PEG_Ratio'])
        print("Dropped PEG_Ratio column (100% null).")
        
    # Fill rolling technical indicator nulls with NaN or keep them as NULLs in database, 
    # but let's make sure they are numeric
    for col in ['Volatility_20D', 'MA_50', 'MA_200']:
        df_hist[col] = pd.to_numeric(df_hist[col], errors='coerce')
        
    # Standardize Volume to integer
    df_hist['Volume'] = df_hist['Volume'].astype(int)
    
    # Sort data chronologically for each stock
    df_hist = df_hist.sort_values(by=['Ticker', 'Date']).reset_index(drop=True)
    
    # --- 2. Clean and Re-calculate Summary Statistics ---
    print("\nRe-calculating Summary Statistics from cleaned historical data...")
    summary_list = []
    for ticker, group in df_hist.groupby('Ticker'):
        group_sorted = group.sort_values('Date')
        
        first_row = group_sorted.iloc[0]
        last_row = group_sorted.iloc[-1]
        
        starting_price = first_row['Close']
        ending_price = last_row['Close']
        total_return_pct = ((ending_price - starting_price) / starting_price) * 100
        
        # Count split days
        num_splits = (group_sorted['Stock_Split'] > 0).sum()
        
        summary_list.append({
            'Ticker': ticker,
            'Company_Name': first_row['Company_Name'],
            'Sector': first_row['Sector'],
            'First_Date': first_row['Date'],
            'Last_Date': last_row['Date'],
            'Total_Trading_Days': len(group_sorted),
            'Starting_Price': starting_price,
            'Ending_Price': ending_price,
            'Total_Return_%': total_return_pct,
            'Highest_Price': group_sorted['High'].max(),
            'Lowest_Price': group_sorted['Low'].min(),
            'Avg_Daily_Volume': group_sorted['Volume'].mean(),
            'Total_Dividends_Paid': group_sorted['Dividend'].sum(),
            'Number_of_Splits': num_splits,
            'Avg_Daily_Return_%': group_sorted['Daily_Return'].mean() * 100,
            'Volatility_%': group_sorted['Daily_Return'].std() * 100,
            'Current_Market_Cap': last_row['Market_Cap'],
            'Current_PE_Ratio': last_row['PE_Ratio'],
            'Current_Dividend_Yield': last_row['Dividend_Yield']
        })
    df_sum = pd.DataFrame(summary_list)
    df_sum = df_sum.sort_values(by='Ticker').reset_index(drop=True)
    
    # --- 3. Verify Integrity ---
    print("\nVerifying Data Integrity...")
    
    # 1. No High < Low
    assert (df_hist['High'] >= df_hist['Low']).all(), "Assertion failed: High < Low found after cleaning!"
    # 2. No negative prices
    assert (df_hist[price_cols] > 0).all().all(), "Assertion failed: Non-positive prices found!"
    # 3. No negative volume
    assert (df_hist['Volume'] >= 0).all(), "Assertion failed: Negative volume found!"
    
    print("All basic assertions passed.")
    
    # Save cleaned files
    df_hist.to_csv(proc_hist_path, index=False)
    df_sum.to_csv(proc_sum_path, index=False)
    
    print(f"\nSaved cleaned historical data to {proc_hist_path}")
    print(f"Saved cleaned summary statistics to {proc_sum_path}")
    print(f"Final Historical Data shape: {df_hist.shape}")
    print(f"Final Summary Statistics shape: {df_sum.shape}")

if __name__ == "__main__":
    clean_data()
