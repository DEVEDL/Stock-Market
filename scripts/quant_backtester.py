import os
import json
import pandas as pd
import numpy as np

def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    # Exponential moving average for wilder's smoothing
    avg_gain = gain.ewm(alpha=1/period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, adjust=False).mean()
    
    rs = avg_gain / (avg_loss + 1e-9)
    return 100 - (100 / (1 + rs))

def calculate_bollinger_bands(prices, period=20, num_std=2):
    sma = prices.rolling(window=period).mean()
    rstd = prices.rolling(window=period).std()
    upper_band = sma + (num_std * rstd)
    lower_band = sma - (num_std * rstd)
    return upper_band, sma, lower_band

def calculate_macd(prices, slow=26, fast=12, signal=9):
    exp1 = prices.ewm(span=fast, adjust=False).mean()
    exp2 = prices.ewm(span=slow, adjust=False).mean()
    macd_line = exp1 - exp2
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line

def run_backtests():
    base_dir = r"c:\Stock Market"
    hist_path = os.path.join(base_dir, "data", "processed", "nifty50_historical_data_cleaned.csv")
    output_path = os.path.join(base_dir, "powerbi", "web", "quant_data.json")
    
    print("Loading data for quant backtests...")
    df = pd.read_csv(hist_path)
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Sort data
    df = df.sort_values(['Ticker', 'Date']).reset_index(drop=True)
    
    quant_results = {}
    risk_free_rate = 0.06 # 6% Risk Free Rate for India
    
    # Group by Ticker
    for ticker, group in df.groupby('Ticker'):
        print(f"Backtesting Ticker: {ticker}...")
        group = group.copy().sort_values('Date').reset_index(drop=True)
        
        # Ensure we have enough data points to compute indicators
        if len(group) < 200:
            continue
            
        close = group['Close']
        
        # Calculate Technical Indicators
        group['RSI'] = calculate_rsi(close)
        bb_up, bb_mid, bb_low = calculate_bollinger_bands(close)
        group['BB_Upper'] = bb_up
        group['BB_Lower'] = bb_low
        group['BB_Middle'] = bb_mid
        
        macd_line, signal_line = calculate_macd(close)
        group['MACD'] = macd_line
        group['MACD_Signal'] = signal_line
        group['MACD_Hist'] = macd_line - signal_line
        
        # Standardize returns
        group['Stock_Return'] = group['Close'].pct_change().fillna(0.0)
        
        # Latest indicator values
        latest = group.iloc[-1]
        indicators = {
            "RSI": float(latest['RSI']) if not np.isnan(latest['RSI']) else 50.0,
            "BB_Upper": float(latest['BB_Upper']) if not np.isnan(latest['BB_Upper']) else float(latest['Close']),
            "BB_Lower": float(latest['BB_Lower']) if not np.isnan(latest['BB_Lower']) else float(latest['Close']),
            "BB_Middle": float(latest['BB_Middle']) if not np.isnan(latest['BB_Middle']) else float(latest['Close']),
            "MACD": float(latest['MACD']) if not np.isnan(latest['MACD']) else 0.0,
            "MACD_Signal": float(latest['MACD_Signal']) if not np.isnan(latest['MACD_Signal']) else 0.0,
            "MACD_Hist": float(latest['MACD_Hist']) if not np.isnan(latest['MACD_Hist']) else 0.0
        }
        
        ticker_strategies = {}
        
        # Define strategies
        # 1. SMA Crossover
        sma_pos = np.zeros(len(group))
        for i in range(1, len(group)):
            # If MA_50 > MA_200: Long (1), else: Cash (0)
            if group.loc[i, 'MA_50'] > group.loc[i, 'MA_200']:
                sma_pos[i] = 1.0
            else:
                sma_pos[i] = 0.0
        group['SMA_Position'] = sma_pos
        
        # 2. RSI Mean Reversion (Long only)
        rsi_pos = np.zeros(len(group))
        in_trade = False
        for i in range(1, len(group)):
            rsi_val = group.loc[i, 'RSI']
            if np.isnan(rsi_val):
                continue
            if rsi_val < 30: # Buy
                in_trade = True
            elif rsi_val > 70: # Sell/Exit
                in_trade = False
            rsi_pos[i] = 1.0 if in_trade else 0.0
        group['RSI_Position'] = rsi_pos
        
        # 3. Bollinger Bands Mean Reversion (Long only)
        bb_pos = np.zeros(len(group))
        in_trade_bb = False
        for i in range(1, len(group)):
            px = group.loc[i, 'Close']
            low_band = group.loc[i, 'BB_Lower']
            up_band = group.loc[i, 'BB_Upper']
            if np.isnan(low_band) or np.isnan(up_band):
                continue
            if px < low_band: # Buy
                in_trade_bb = True
            elif px > up_band: # Sell/Exit
                in_trade_bb = False
            bb_pos[i] = 1.0 if in_trade_bb else 0.0
        group['BB_Position'] = bb_pos
        
        # Backtest each strategy
        for strat_name, pos_col in [("SMA", "SMA_Position"), ("RSI", "RSI_Position"), ("BB", "BB_Position")]:
            # Strategy returns (shifted position to avoid lookahead bias)
            strat_pos = group[pos_col].shift(1).fillna(0.0)
            group['Strat_Return'] = strat_pos * group['Stock_Return']
            
            # Cumulative returns
            group['Cum_Strat_Return'] = (1.0 + group['Strat_Return']).cumprod() - 1.0
            group['Cum_Stock_Return'] = (1.0 + group['Stock_Return']).cumprod() - 1.0
            
            # Simulated trades list
            trades = []
            pos_diff = group[pos_col].diff().fillna(0.0)
            
            entry_idx = None
            for idx in range(len(group)):
                diff = pos_diff.iloc[idx]
                if diff == 1.0: # Buy
                    entry_idx = idx
                elif diff == -1.0 and entry_idx is not None: # Sell
                    entry_row = group.iloc[entry_idx]
                    exit_row = group.iloc[idx]
                    ret = ((exit_row['Close'] - entry_row['Close']) / entry_row['Close']) * 100.0
                    trades.append({
                        "entry_date": entry_row['Date'].strftime('%Y-%m-%d'),
                        "exit_date": exit_row['Date'].strftime('%Y-%m-%d'),
                        "entry_price": float(entry_row['Close']),
                        "exit_price": float(exit_row['Close']),
                        "return_pct": float(ret)
                    })
                    entry_idx = None
            
            # Performance metrics
            total_days = len(group)
            num_years = total_days / 252.0
            
            total_return = float(group['Cum_Strat_Return'].iloc[-1])
            ann_return = ((1.0 + total_return) ** (1.0 / max(num_years, 0.1))) - 1.0
            
            # Volatility
            strat_std = group['Strat_Return'].std()
            ann_vol = strat_std * np.sqrt(252.0)
            
            # Sharpe Ratio
            excess_return = ann_return - risk_free_rate
            sharpe = excess_return / ann_vol if ann_vol > 0 else 0.0
            
            # Drawdowns
            equity = (1.0 + group['Cum_Strat_Return'])
            running_max = equity.cummax()
            drawdowns = (equity - running_max) / running_max
            max_dd = float(drawdowns.min() * 100.0)
            
            # Trade Stats
            total_trades = len(trades)
            win_rate = 0.0
            profit_factor = 0.0
            
            if total_trades > 0:
                wins = [t for t in trades if t['return_pct'] > 0]
                losses = [t for t in trades if t['return_pct'] <= 0]
                win_rate = (len(wins) / total_trades) * 100.0
                
                gross_profits = sum([t['return_pct'] for t in wins])
                gross_losses = sum([abs(t['return_pct']) for t in losses])
                profit_factor = gross_profits / (gross_losses + 1e-9)
            
            # Downsample equity curve to monthly values for chart rendering
            df_monthly = group.groupby(group['Date'].dt.to_period('M')).last().reset_index(drop=True)
            equity_curve = []
            for _, r in df_monthly.iterrows():
                equity_curve.append({
                    "Date": r['Date'].strftime('%Y-%m-%d'),
                    "Strategy": float(r['Cum_Strat_Return'] * 100.0),
                    "Benchmark": float(r['Cum_Stock_Return'] * 100.0)
                })
                
            ticker_strategies[strat_name] = {
                "metrics": {
                    "total_return": float(total_return * 100.0),
                    "annualized_return": float(ann_return * 100.0),
                    "annualized_volatility": float(ann_vol * 100.0),
                    "sharpe_ratio": float(sharpe),
                    "max_drawdown": float(max_dd),
                    "win_rate": float(win_rate),
                    "profit_factor": float(profit_factor),
                    "total_trades": int(total_trades)
                },
                "equity_curve": equity_curve,
                # Store last 15 trades
                "trades": trades[-15:]
            }
            
        quant_results[ticker] = {
            "indicators": indicators,
            "strategies": ticker_strategies
        }
        
    print(f"Saving backtest dataset to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(quant_results, f, indent=2)
    print("Quant backtester execution complete.")

if __name__ == "__main__":
    run_backtests()
