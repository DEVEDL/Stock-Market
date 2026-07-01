import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def run_eda():
    base_dir = r"c:\Stock Market"
    proc_hist_path = os.path.join(base_dir, "data", "processed", "nifty50_historical_data_cleaned.csv")
    proc_sum_path = os.path.join(base_dir, "data", "processed", "nifty50_summary_statistics_cleaned.csv")
    
    img_dir = os.path.join(base_dir, "notebooks", "images")
    summary_path = os.path.join(base_dir, "notebooks", "eda_summary.md")
    
    print("Loading processed data...")
    df_hist = pd.read_csv(proc_hist_path)
    df_sum = pd.read_csv(proc_sum_path)
    
    print("Setting up visualization styling...")
    sns.set_theme(style="darkgrid")
    plt.rcParams.update({
        'figure.facecolor': '#1E1E24',
        'axes.facecolor': '#1E1E24',
        'text.color': '#F5F5F7',
        'axes.labelcolor': '#F5F5F7',
        'xtick.color': '#F5F5F7',
        'ytick.color': '#F5F5F7',
        'axes.edgecolor': '#444444',
        'grid.color': '#333333'
    })
    
    # 1. Sector Distribution
    print("Generating Sector Distribution Chart...")
    plt.figure(figsize=(10, 6))
    sector_counts = df_sum['Sector'].value_counts()
    sns.barplot(x=sector_counts.values, y=sector_counts.index, palette="viridis", hue=sector_counts.index, legend=False)
    plt.title("Nifty 50 Sector Distribution", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Number of Companies", fontsize=12)
    plt.ylabel("Sector", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "sector_distribution.png"), dpi=150)
    plt.close()
    
    # 2. Sector Average Returns
    print("Generating Sector Average Returns Chart...")
    plt.figure(figsize=(10, 6))
    sector_returns = df_sum.groupby('Sector')['Total_Return_%'].mean().sort_values(ascending=False)
    sns.barplot(x=sector_returns.values, y=sector_returns.index, palette="mako", hue=sector_returns.index, legend=False)
    plt.title("Average Historical Return (%) by Sector (25 Years)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Average Total Return (%)", fontsize=12)
    plt.ylabel("Sector", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "sector_average_returns.png"), dpi=150)
    plt.close()
    
    # 3. Market Cap vs P/E Ratio
    print("Generating Market Cap vs PE Chart...")
    plt.figure(figsize=(10, 6))
    # Drop rows where P/E is null or extremely high for better visualization limits
    pe_filter = df_sum[(df_sum['Current_PE_Ratio'].notnull()) & (df_sum['Current_PE_Ratio'] < 100)]
    # Convert Market Cap to Trillions of INR
    mcap_trillions = pe_filter['Current_Market_Cap'] / 1e12
    scatter = plt.scatter(mcap_trillions, pe_filter['Current_PE_Ratio'], 
                          c=pe_filter['Volatility_%'], cmap='plasma', s=100, alpha=0.85, edgecolors='w')
    cbar = plt.colorbar(scatter)
    cbar.set_label('Historical Volatility (%)', color='#F5F5F7')
    cbar.ax.yaxis.set_tick_params(color='#F5F5F7', labelcolor='#F5F5F7')
    
    plt.title("Market Cap vs Current P/E Ratio (Colored by Volatility)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Current Market Capitalization (INR Trillions)", fontsize=12)
    plt.ylabel("Current P/E Ratio", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "market_cap_vs_pe.png"), dpi=150)
    plt.close()
    
    # 4. Beta vs Volatility
    print("Generating Beta vs Volatility Chart...")
    plt.figure(figsize=(10, 6))
    sns.regplot(x=df_sum['Current_PE_Ratio'].fillna(df_sum['Current_PE_Ratio'].median()), y=df_sum['Volatility_%'], 
                scatter_kws={'s':80, 'alpha':0.8, 'color':'#4CC9F0'}, line_kws={'color':'#F72585', 'linewidth':2})
    plt.title("Current P/E Ratio vs Volatility (%)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Current P/E Ratio", fontsize=12)
    plt.ylabel("Historical Volatility (%)", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "pe_vs_volatility.png"), dpi=150)
    plt.close()
    
    # 5. Correlation Heatmap
    print("Generating Correlation Heatmap...")
    plt.figure(figsize=(12, 10))
    numeric_cols = ['Open', 'High', 'Low', 'Close', 'Volume', 'Dividend', 
                    'Daily_Return', 'Volatility_20D', 'MA_50', 'MA_200', 
                    'Market_Cap', 'PE_Ratio', 'Dividend_Yield', 'Beta']
    # Sub-sample historical data to avoid memory issues and speed up calculation
    df_sample = df_hist[numeric_cols].dropna().sample(n=min(50000, len(df_hist)), random_state=42)
    corr_matrix = df_sample.corr()
    
    sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="coolwarm", 
                linewidths=.5, cbar_kws={"shrink": .8}, annot_kws={"size": 9})
    plt.title("Correlation Matrix of Historical Stock Features", fontsize=14, fontweight='bold', pad=15)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "correlation_heatmap.png"), dpi=150)
    plt.close()
    
    # 6. Historical Average Nifty 50 Close Trend
    print("Generating Historical Nifty Trend Chart...")
    plt.figure(figsize=(12, 6))
    df_hist['Date'] = pd.to_datetime(df_hist['Date'])
    df_yearly = df_hist.groupby(df_hist['Date'].dt.year)['Close'].mean()
    plt.plot(df_yearly.index, df_yearly.values, color='#4CC9F0', linewidth=3, marker='o', markersize=6)
    plt.title("Average Closing Price Trend of Nifty 50 Stocks (1999 - 2026)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Year", fontsize=12)
    plt.ylabel("Average Stock Closing Price (INR)", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(img_dir, "historical_nifty_trend.png"), dpi=150)
    plt.close()
    
    # 7. Generate EDA Summary Report
    print("Generating EDA Summary Report...")
    def to_markdown_custom(df, include_index=True):
        if df.empty:
            return ""
        cols = list(df.columns)
        if include_index:
            idx_name = df.index.name if df.index.name else "Index"
            headers = [idx_name] + cols
            rows = [[str(idx)] + [str(val) for val in row] for idx, row in zip(df.index, df.values)]
        else:
            headers = cols
            rows = [[str(val) for val in row] for row in df.values]
        header_line = "| " + " | ".join(headers) + " |"
        sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
        row_lines = ["| " + " | ".join(row) + " |" for row in rows]
        return "\n".join([header_line, sep_line] + row_lines)

    total_records = len(df_hist)
    date_min = df_hist['Date'].min().strftime('%Y-%m-%d')
    date_max = df_hist['Date'].max().strftime('%Y-%m-%d')
    unique_tickers = df_hist['Ticker'].nunique()
    
    # Top 5 performing stocks
    top_performers = df_sum.sort_values(by='Total_Return_%', ascending=False)[['Ticker', 'Company_Name', 'Sector', 'Total_Return_%']].head(5)
    
    # Top 5 highest dividend paying stocks (cumulative)
    top_div = df_sum.sort_values(by='Total_Dividends_Paid', ascending=False)[['Ticker', 'Company_Name', 'Sector', 'Total_Dividends_Paid']].head(5)
    
    # Sector summaries
    sector_summary = df_sum.groupby('Sector').agg(
        Company_Count=('Ticker', 'count'),
        Avg_Return_Pct=('Total_Return_%', 'mean'),
        Avg_Volatility_Pct=('Volatility_%', 'mean'),
        Total_Market_Cap_Billion_INR=('Current_Market_Cap', lambda x: x.sum() / 1e9)
    ).sort_values(by='Total_Market_Cap_Billion_INR', ascending=False)
    
    with open(summary_path, 'w') as f:
        f.write("# Exploratory Data Analysis (EDA) Summary\n\n")
        f.write("This document summarizes the insights derived from the Nifty 50 historical stock dataset.\n\n")
        
        f.write("## Dataset Overview\n")
        f.write(f"- **Time Period**: {date_min} to {date_max} (approx. 25 Years)\n")
        f.write(f"- **Total Rows**: {total_records:,}\n")
        f.write(f"- **Unique Stocks Analyzed**: {unique_tickers}\n\n")
        
        f.write("## Key Sector Insights\n")
        f.write("Here is a summary of Nifty 50 performance across different sectors:\n\n")
        f.write(to_markdown_custom(sector_summary))
        f.write("\n\n")
        
        f.write("## Top 5 Performing Stocks by Total Return\n")
        f.write(to_markdown_custom(top_performers, include_index=False))
        f.write("\n\n")
        
        f.write("## Top 5 Cumulative Dividend-Paying Stocks\n")
        f.write(to_markdown_custom(top_div, include_index=False))
        f.write("\n\n")
        
        f.write("## Visualizations Generated\n")
        f.write("The following plots have been saved in `notebooks/images/`:\n")
        f.write("1. **Sector Distribution (`sector_distribution.png`)**: Representation of Nifty 50 index composition.\n")
        f.write("2. **Sector Average Returns (`sector_average_returns.png`)**: Shows long-term average gains by sector.\n")
        f.write("3. **Market Cap vs P/E Ratio (`market_cap_vs_pe.png`)**: Highlighting valuations relative to company size.\n")
        f.write("4. **P/E vs Volatility (`pe_vs_volatility.png`)**: Regressing current valuation against price fluctuations.\n")
        f.write("5. **Correlation Heatmap (`correlation_heatmap.png`)**: Multi-variable correlation coefficients.\n")
        f.write("6. **Historical Index Trend (`historical_nifty_trend.png`)**: Average stock price performance trajectory.\n")
        
    print(f"EDA execution completed successfully. Summary saved to {summary_path}")

if __name__ == "__main__":
    run_eda()
