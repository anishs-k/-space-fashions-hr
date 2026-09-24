import urllib.request
import json
import pandas as pd

SUPABASE_URL = "https://imuozlqorndfrcwdwphf.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

def fetch_all_supabase(table_name):
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=id,data&limit={page_size}&offset={offset}"
        req = urllib.request.Request(url, headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        })
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if not data:
                    break
                all_rows.extend(data)
                if len(data) < page_size:
                    break
                offset += page_size
        except Exception as e:
            print(f"Error fetching {table_name}: {e}")
            break
    return all_rows

print("=== Fetching from Supabase ===")
sb_employees = fetch_all_supabase("employees")
sb_non_employees = fetch_all_supabase("non_employees")

print(f"Supabase 'employees' count: {len(sb_employees)}")
print(f"Supabase 'non_employees' count: {len(sb_non_employees)}")

print("\n=== Reading final2.xlsx ===")
excel_path = r"C:\Anish\clg\indestry\inter\2projet\space-fashions-hr-database\final2.xlsx"
xl = pd.ExcelFile(excel_path)
print(f"Sheets in final2.xlsx: {xl.sheet_names}")

excel_dfs = {}
for sheet in xl.sheet_names:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    excel_dfs[sheet] = df
    print(f"Sheet '{sheet}': {len(df)} rows, Columns: {list(df.columns[:8])}...")

# Comparison logic
# Extract employee codes / IDs from Supabase
sb_emp_ids = set(r['id'] for r in sb_employees)
sb_emp_codes = set()
for r in sb_employees:
    d = r.get('data') or {}
    code = d.get('employeeCode') or r['id']
    sb_emp_codes.add(str(code).strip())

print(f"\nTotal unique Supabase Employee IDs: {len(sb_emp_ids)}")

for sheet, df in excel_dfs.items():
    print(f"\n--- Detailed Analysis for Sheet '{sheet}' ({len(df)} rows) ---")
    print("Columns in Excel:", list(df.columns))
    
    # Try finding ID/Code column
    id_col = None
    for col in df.columns:
        col_str = str(col).lower()
        if 'code' in col_str or 'emp' in col_str or 'id' in col_str or 'sr' in col_str:
            id_col = col
            break
    if id_col is None:
        id_col = df.columns[0]
    
    print(f"Using ID column: '{id_col}'")
    excel_ids = set()
    for val in df[id_col].dropna():
        s = str(val).strip()
        if s.endswith('.0'):
            s = s[:-2]
        excel_ids.add(s)
        # Also try with EMP- prefix
        if not s.startswith('EMP-'):
            excel_ids.add(f"EMP-{s}")
    
    print(f"Unique IDs in Excel sheet '{sheet}': {len(excel_ids)}")
    
    # Check intersection
    matched_ids = excel_ids.intersection(sb_emp_ids).union(excel_ids.intersection(sb_emp_codes))
    print(f"Matched records with Supabase: {len(matched_ids)}")
    
    # Missing in Supabase
    missing_in_sb = [x for x in excel_ids if x not in sb_emp_ids and x not in sb_emp_codes and f"EMP-{x}" not in sb_emp_ids]
    print(f"Count of Excel IDs not in Supabase: {len(missing_in_sb)}")
    if missing_in_sb[:10]:
        print("Sample missing in Supabase:", missing_in_sb[:10])
    
    # Extra in Supabase
    extra_in_sb = [x for x in sb_emp_ids if x not in excel_ids and x.replace('EMP-', '') not in excel_ids]
    print(f"Count of Supabase records not in this Excel sheet: {len(extra_in_sb)}")
    if extra_in_sb[:10]:
        print("Sample extra in Supabase:", extra_in_sb[:10])

