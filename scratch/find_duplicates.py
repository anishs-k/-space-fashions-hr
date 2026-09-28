import urllib.request
import json
import collections

SUPABASE_URL = 'https://imuozlqorndfrcwdwphf.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg'

def fetch_all(table):
    rows = []
    limit = 1000
    offset = 0
    while True:
        url = f'{SUPABASE_URL}/rest/v1/{table}?select=id,data&limit={limit}&offset={offset}'
        req = urllib.request.Request(url, headers={'apikey': ANON_KEY, 'Authorization': f'Bearer {ANON_KEY}'})
        try:
            with urllib.request.urlopen(req) as r:
                data = json.loads(r.read().decode('utf-8'))
                if not data: break
                rows.extend(data)
                if len(data) < limit: break
                offset += limit
        except Exception as e:
            print(f'Error fetching {table}: {e}')
            break
    return rows

print("Fetching all employees from Supabase...")
emp = fetch_all('employees')
print(f"Total employees: {len(emp)}")

# 1. Suffix IDs created due to duplicate serial numbers in BIO DATA.xlsx
suffix_dups = [r for r in emp if '_' in r['id']]
print(f"\n1. Records with suffix ID (e.g., EMP-XXXX_2): {len(suffix_dups)}")

# 2. Check duplicates by (Name, Father Name, DOB)
by_name_father_dob = collections.defaultdict(list)
for r in emp:
    d = r.get('data') or {}
    name = str(d.get('name', '')).strip().lower()
    fname = str(d.get('fatherHusbandName', '')).strip().lower()
    dob = str(d.get('dob', '')).strip()
    if name and fname:
        key = (name, fname)
        by_name_father_dob[key].append(r)

name_father_dups = {k: v for k, v in by_name_father_dob.items() if len(v) > 1}
print(f"\n2. Duplicate by Name + Father Name: {len(name_father_dups)} groups (Total records: {sum(len(v) for v in name_father_dups.values())})")

# 3. Check duplicates by Contact No (if not dummy or empty)
by_contact = collections.defaultdict(list)
for r in emp:
    d = r.get('data') or {}
    c = str(d.get('contactNo', '')).strip().replace('-', '').replace(' ', '')
    if c and len(c) >= 10 and not c.startswith('00000'):
        by_contact[c].append(r)

contact_dups = {k: v for k, v in by_contact.items() if len(v) > 1}
print(f"\n3. Duplicate by Contact No: {len(contact_dups)} groups (Total records: {sum(len(v) for v in contact_dups.values())})")

# Sample examination
print("\n--- Sample Name+Father duplicates ---")
for k, group in list(name_father_dups.items())[:10]:
    print(f"Group {k}:")
    for item in group:
        d = item['data']
        print(f"   ID: {item['id']} | Code: {d.get('employeeCode')} | Name: {d.get('name')} | Father: {d.get('fatherHusbandName')} | DOB: {d.get('dob')} | Contact: {d.get('contactNo')} | Dept: {d.get('department')} | Pay: {d.get('officeUse', {}).get('basicPay')}")
