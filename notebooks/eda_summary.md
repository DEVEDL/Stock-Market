# Exploratory Data Analysis (EDA) Summary

This document summarizes the insights derived from the Nifty 50 historical stock dataset.

## Dataset Overview
- **Time Period**: 1999-01-01 to 2026-01-30 (approx. 25 Years)
- **Total Rows**: 287,263
- **Unique Stocks Analyzed**: 49

## Key Sector Insights
Here is a summary of Nifty 50 performance across different sectors:

| Sector | Company_Count | Avg_Return_Pct | Avg_Volatility_Pct | Total_Market_Cap_Billion_INR |
| --- | --- | --- | --- | --- |
| Financials | 10.0 | 45943.321714632366 | 16.921409926657464 | 55428.722458624 |
| IT | 6.0 | 9174.967652417352 | 3.024692051915429 | 28325.519294464 |
| Energy | 3.0 | 12824.174146316383 | 4.769095835487144 | 23848.188772352 |
| FMCG | 5.0 | 5205.84678315895 | 1.8527136244977789 | 14714.818265088 |
| Automobile | 5.0 | 210142.6360966606 | 4.286953495062334 | 14450.820120576 |
| Telecom | 1.0 | 13557.259556545108 | 2.2506132232509333 | 11992.28059648 |
| Infrastructure | 3.0 | 1348688.5096166646 | 6.0172704236990695 | 11292.214034432 |
| Metals | 4.0 | 6083.7188881043 | 9.315543672103681 | 10243.775791104 |
| Pharma | 4.0 | 47022.23477354445 | 9.853209939787863 | 7517.662478336 |
| Cement | 3.0 | 36925.759636063034 | 3.994421749103902 | 6619.850080256 |
| Consumer Durables | 2.0 | 57970.85621462444 | 2.1914232464682777 | 5855.888277504 |
| Power | 2.0 | 849.8734270484765 | 1.8221527881463326 | 5837.618151424 |
| Healthcare | 1.0 | 12873.50422270034 | 2.1713017865370223 | 1000.813101056 |

## Top 5 Performing Stocks by Total Return
| Ticker | Company_Name | Sector | Total_Return_% |
| --- | --- | --- | --- |
| ADANIENT.NS | Adani Enterprises Ltd. | Infrastructure | 4032380.415992792 |
| EICHERMOT.NS | Eicher Motors Ltd. | Automobile | 998972.8018231768 |
| BAJFINANCE.NS | Bajaj Finance Ltd. | Financials | 236755.5810625992 |
| TITAN.NS | Titan Company Ltd. | Consumer Durables | 101005.1484981219 |
| SHREECEM.NS | Shree Cement Ltd. | Cement | 99028.07443984722 |

## Top 5 Cumulative Dividend-Paying Stocks
| Ticker | Company_Name | Sector | Total_Dividends_Paid |
| --- | --- | --- | --- |
| HEROMOTOCO.NS | Hero MotoCorp Ltd. | Automobile | 1613.0 |
| BAJAJ-AUTO.NS | Bajaj Auto Ltd. | Automobile | 1331.0 |
| SHREECEM.NS | Shree Cement Ltd. | Cement | 1081.5 |
| MARUTI.NS | Maruti Suzuki India Ltd. | Automobile | 871.0 |
| TCS.NS | Tata Consultancy Services Ltd. | IT | 756.25 |

## Visualizations Generated
The following plots have been saved in `notebooks/images/`:
1. **Sector Distribution (`sector_distribution.png`)**: Representation of Nifty 50 index composition.
2. **Sector Average Returns (`sector_average_returns.png`)**: Shows long-term average gains by sector.
3. **Market Cap vs P/E Ratio (`market_cap_vs_pe.png`)**: Highlighting valuations relative to company size.
4. **P/E vs Volatility (`pe_vs_volatility.png`)**: Regressing current valuation against price fluctuations.
5. **Correlation Heatmap (`correlation_heatmap.png`)**: Multi-variable correlation coefficients.
6. **Historical Index Trend (`historical_nifty_trend.png`)**: Average stock price performance trajectory.
