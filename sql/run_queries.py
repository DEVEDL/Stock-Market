import os
import sqlite3
import pandas as pd

def to_markdown_custom(df, include_index=True):
    if df.empty:
        return "*No rows returned.*"
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

def run_sql_analysis():
    base_dir = r"c:\Stock Market"
    db_path = os.path.join(base_dir, "data", "processed", "nifty50.db")
    schema_path = os.path.join(base_dir, "sql", "schema.sql")
    queries_path = os.path.join(base_dir, "sql", "business_queries.sql")
    report_path = os.path.join(base_dir, "sql", "sql_analysis_results.md")
    
    proc_hist_path = os.path.join(base_dir, "data", "processed", "nifty50_historical_data_cleaned.csv")
    proc_sum_path = os.path.join(base_dir, "data", "processed", "nifty50_summary_statistics_cleaned.csv")
    
    print(f"Connecting to SQLite database: {db_path}...")
    conn = sqlite3.connect(db_path)
    
    # 1. Initialize schema
    print("Initializing database schema...")
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    print("Schema initialized successfully.")
    
    # 2. Load cleaned data into database
    print("Loading historical daily price CSV into 'nifty50_historical' table...")
    df_hist = pd.read_csv(proc_hist_path)
    df_hist.to_sql('nifty50_historical', conn, if_exists='append', index=False)
    print(f"Loaded {len(df_hist)} rows into 'nifty50_historical'.")
    
    print("Loading summary statistics CSV into 'nifty50_summary' table...")
    df_sum = pd.read_csv(proc_sum_path)
    
    # Rename columns with '%' to match schema
    df_sum = df_sum.rename(columns={
        'Total_Return_%': 'Total_Return_Pct',
        'Avg_Daily_Return_%': 'Avg_Daily_Return_Pct',
        'Volatility_%': 'Volatility_Pct'
    })
    
    df_sum.to_sql('nifty50_summary', conn, if_exists='append', index=False)
    print(f"Loaded {len(df_sum)} rows into 'nifty50_summary'.")
    
    # Verify records in database
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM nifty50_historical")
    hist_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM nifty50_summary")
    sum_count = cursor.fetchone()[0]
    print(f"Verification: {hist_count} daily records and {sum_count} stock summary records in database.")
    
    # 3. Read and execute SQL queries
    print("Reading and executing business queries...")
    with open(queries_path, 'r') as f:
        sql_content = f.read()
        
    # Split queries by semicolon, keeping track of comments as titles
    # SQLite requires execution of individual SELECT statements
    raw_queries = sql_content.split(';')
    
    with open(report_path, 'w') as out_f:
        out_f.write("# Nifty 50 SQL Business Analysis Report\n\n")
        out_f.write("This document summarizes the results of running industry-standard analytical SQL queries on the Nifty 50 stock database.\n\n")
        
        query_idx = 1
        for q in raw_queries:
            q = q.strip()
            if not q:
                continue
                
            # Extract query title from comments
            lines = q.split('\n')
            title = f"Query {query_idx}"
            comments = []
            sql_lines = []
            
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('--'):
                    comment_text = stripped.lstrip('-').strip()
                    if comment_text:
                        comments.append(comment_text)
                else:
                    sql_lines.append(line)
                    
            if comments:
                title = " - ".join(comments)
                
            query_sql = '\n'.join(sql_lines).strip()
            if not query_sql:
                continue
                
            print(f"Running: {title}...")
            out_f.write(f"## {title}\n\n")
            out_f.write("### SQL Query\n")
            out_f.write("```sql\n" + q + "\n```\n\n")
            
            try:
                df_res = pd.read_sql_query(query_sql, conn)
                out_f.write("### Query Result\n\n")
                out_f.write(to_markdown_custom(df_res, include_index=False) + "\n\n")
                out_f.write("---\n\n")
                query_idx += 1
            except Exception as e:
                print(f"Error executing {title}: {e}")
                out_f.write(f"### Error running query\n```\n{str(e)}\n```\n\n---\n\n")
                
    conn.close()
    print(f"SQL analysis completed. Report saved to {report_path}")

if __name__ == "__main__":
    run_sql_analysis()
