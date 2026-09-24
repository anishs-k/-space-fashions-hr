import urllib.request
import json
import pandas as pd

SUPABASE_URL = "https://imuozlqorndfrcwdwphf.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/employees?select=id,data&limit=5", headers={
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
})
with urllib.request.urlopen(req) as resp:
    sample_sb = json.loads(resp.read().decode('utf-8'))

df = pd.read_excel(r"C:\Anish\clg\indestry\inter\2projet\space-fashions-hr-database\final2.xlsx")

print("Sample Supabase Employee Keys:")
print(list(sample_sb[0]['data'].keys()))

print("\nSample Excel Columns:")
print(list(df.columns))

# Verify matching row
sample_code = sample_sb[0]['data'].get('employeeCode')
print(f"\nChecking code {sample_code} in Excel:")
match_row = df[df['code_serial'].astype(str).str.contains(str(sample_code))]
if not match_row.empty:
    print("Found in Excel! Name in Excel:", match_row['name'].values[0])
    print("Name in Supabase:", sample_sb[0]['data'].get('name'))
    print("Department in Excel:", match_row['department'].values[0])
    print("Department in Supabase:", sample_sb[0]['data'].get('department'))
    print("Basic Pay in Excel:", match_row['basic_pay'].values[0])
    print("Basic Pay in Supabase:", sample_sb[0]['data']['officeUse'].get('basicPay'))
