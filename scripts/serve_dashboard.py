import os
import json
import http.server
import socketserver
import webbrowser
import threading
import time
import pandas as pd
import numpy as np

def clean_nans(obj):
    if isinstance(obj, list):
        return [clean_nans(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, float) and (obj != obj or np.isnan(obj)):
        return None
    return obj

def generate_web_data():
    base_dir = r"c:\Stock Market"
    hist_path = os.path.join(base_dir, "data", "processed", "nifty50_historical_data_cleaned.csv")
    sum_path = os.path.join(base_dir, "data", "processed", "nifty50_summary_statistics_cleaned.csv")
    web_data_path = os.path.join(base_dir, "powerbi", "web", "data.json")
    
    print("Generating web dataset...")
    
    # 1. Load summary stats
    df_sum = pd.read_csv(sum_path)
    
    # 2. Load historical data and downsample to monthly (to keep the payload under 1MB)
    df_hist = pd.read_csv(hist_path)
    df_hist['Date'] = pd.to_datetime(df_hist['Date'])
    
    # Sort and group by Ticker and Year-Month, getting the last record of each month
    df_monthly = df_hist.sort_values(['Ticker', 'Date']).groupby(
        ['Ticker', df_hist['Date'].dt.to_period('M')]
    ).last()
    df_monthly = df_monthly.reset_index(level=0).reset_index(drop=True)
    
    # Convert dates to string format
    df_monthly['Date'] = df_monthly['Date'].dt.strftime('%Y-%m-%d')
    
    # Rename columns to match JavaScript expectations
    df_sum_renamed = df_sum.rename(columns={
        'Total_Return_%': 'Total_Return_Pct',
        'Avg_Daily_Return_%': 'Avg_Daily_Return_Pct',
        'Volatility_%': 'Volatility_Pct'
    })
    
    # Convert dataframes to dictionaries
    summary_data = df_sum_renamed.to_dict(orient='records')
    
    # Keep only necessary fields for historical charting to reduce size
    historical_cols = ['Ticker', 'Date', 'Close', 'MA_50', 'MA_200', 'Volume']
    historical_data = df_monthly[historical_cols].to_dict(orient='records')
    
    # 3. Query crossovers from database
    import sqlite3
    db_path = os.path.join(base_dir, "data", "processed", "nifty50.db")
    crossovers = []
    if os.path.exists(db_path):
        try:
            print("Connecting to DB to extract recent crossovers...")
            conn = sqlite3.connect(db_path)
            query = """
            WITH MA_Prev AS (
                SELECT 
                    Date, Ticker, Company_Name, Sector, MA_50, MA_200,
                    LAG(MA_50, 1) OVER (PARTITION BY Ticker ORDER BY Date) as MA_50_Prev,
                    LAG(MA_200, 1) OVER (PARTITION BY Ticker ORDER BY Date) as MA_200_Prev
                FROM nifty50_historical
            )
            SELECT 
                Date, Ticker, Company_Name, Sector,
                CASE 
                    WHEN MA_50_Prev <= MA_200_Prev AND MA_50 > MA_200 THEN 'Golden Cross'
                    WHEN MA_50_Prev >= MA_200_Prev AND MA_50 < MA_200 THEN 'Death Cross'
                END as Cross_Type
            FROM MA_Prev
            WHERE 
                (MA_50_Prev <= MA_200_Prev AND MA_50 > MA_200) OR
                (MA_50_Prev >= MA_200_Prev AND MA_50 < MA_200)
            ORDER BY Date DESC
            LIMIT 15;
            """
            df_cross = pd.read_sql_query(query, conn)
            crossovers = df_cross.to_dict(orient='records')
            conn.close()
            print(f"Extracted {len(crossovers)} crossovers.")
        except Exception as e:
            print("Error extracting crossovers:", e)
            
    # Save combined JSON
    web_data = {
        'summary': summary_data,
        'historical': historical_data,
        'crossovers': crossovers
    }
    
    # Clean NaNs to prevent invalid JSON
    web_data_clean = clean_nans(web_data)
    
    # Ensure folder exists
    os.makedirs(os.path.dirname(web_data_path), exist_ok=True)
    
    with open(web_data_path, 'w') as f:
        json.dump(web_data_clean, f, indent=2)
        
    print(f"Web dataset written to {web_data_path}")

def start_server():
    PORT = 8000
    base_dir = r"c:\Stock Market"
    
    # Change working directory to root so we can access all files (markdown, images, web files)
    os.chdir(base_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Avoid port in use errors on restart
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Local server started at http://localhost:{PORT}/")
        
        # Open browser in a separate thread after a short delay
        def open_browser():
            time.sleep(1.5)
            url = f"http://localhost:{PORT}/powerbi/web/index.html"
            print(f"Opening dashboard in browser: {url}")
            webbrowser.open(url)
            
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    generate_web_data()
    
    # Generate quant backtest data
    try:
        import subprocess
        print("Running quant strategy backtester...")
        subprocess.run(["python", "scripts/quant_backtester.py"], check=True)
    except Exception as e:
        print("Error running quant backtester:", e)
        
    start_server()
