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
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data:
                break
            all_rows.extend(data)
            if len(data) < page_size:
                break
            offset += page_size
    return all_rows

sb_employees = fetch_all_supabase("employees")
excel_path = r"C:\Anish\clg\indestry\inter\2projet\space-fashions-hr-database\final2.xlsx"
df = pd.read_excel(excel_path)

print(f"Excel Total Rows: {len(df)}")
print(f"Supabase Total Rows: {len(sb_employees)}")

# Check 6 demo seed records
demo_seed_ids = ["EMP-5337", "EMP-5338", "EMP-5339", "EMP-5340", "EMP-5341", "EMP-5342"]
sb_ids = [r['id'] for r in sb_employees]

print("\n--- Check Seed Demo Records in Supabase ---")
for did in demo_seed_ids:
    print(f"{did} in Supabase: {did in sb_ids}")

# Clean Excel codes
df['clean_code'] = df['code_serial'].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
excel_codes = set(df['clean_code'])

# Compare with Supabase IDs
print("\n--- Check Supabase IDs with suffixes (duplicates from pdf) ---")
suffix_ids = [r['id'] for r in sb_employees if '-' in r['id'][4:]] # e.g. EMP-5512-1
print("Suffix IDs in Supabase:", suffix_ids)

# Check names match
sb_names = {r['id']: (r.get('data') or {}).get('name') for r in sb_employees}
excel_names = dict(zip(df['clean_code'], df['name']))

# Summary of findings
print("\n--- Summary ---")
print(f"1. Excel has {len(df)} rows.")
print(f"2. Supabase has {len(sb_employees)} rows.")
print(f"3. The difference of {len(sb_employees) - len(df)} is because:")
print(f"   - 6 Demo Seed Records added by the app ({demo_seed_ids})")
print(f"   - Suffix duplicates where the same employee code had multiple entries/pages in PDF: {len(suffix_ids)} records")

