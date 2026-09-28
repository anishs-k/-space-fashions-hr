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

emp = fetch_all('employees')
emp_map = {r['id']: r for r in emp}

print(f"Total employees fetched: {len(emp)}")

# Let's group all records by canonical identity:
# (Name, Father/Husband Name, DOB, Contact)
# If two records represent the exact same person:
# Criteria A: Exact same Name + Father Name + DOB (when both non-empty)
# Criteria B: Exact same Name + Contact (10 digit)
# Criteria C: Exact same Name + Father Name (when DOB missing or same)

groups = collections.defaultdict(list)
for r in emp:
    d = r.get('data') or {}
    name = str(d.get('name', '')).strip().lower()
    fname = str(d.get('fatherHusbandName', '')).strip().lower()
    dob = str(d.get('dob', '')).strip()
    contact = str(d.get('contactNo', '')).strip().replace('-', '').replace(' ', '')
    if contact.endswith('.0'): contact = contact[:-2]
    
    # Key normalization
    if name:
        if fname:
            key = (name, fname)
        elif contact and len(contact) >= 10:
            key = (name, f"contact:{contact}")
        else:
            key = (name, f"id:{r['id']}")
        groups[key].append(r)

duplicates_to_remove = []
duplicates_to_keep = []

print("\n--- Duplicate Analysis ---")
dup_groups = {k: v for k, v in groups.items() if len(v) > 1}
print(f"Total duplicate groups found: {len(dup_groups)}")

for k, records in dup_groups.items():
    # Sort records: prefer the one with richer data (higher basic pay, more filled fields, or earlier standard ID)
    def score_record(rec):
        d = rec.get('data') or {}
        score = 0
        if d.get('officeUse', {}).get('basicPay', 0) > 0: score += 10
        if d.get('fatherHusbandName'): score += 5
        if d.get('dob'): score += 5
        if d.get('contactNo'): score += 5
        if d.get('nominee', {}).get('name'): score += 5
        if d.get('permanentAddress'): score += 5
        if not '_' in rec['id']: score += 2
        return score

    sorted_records = sorted(records, key=score_record, reverse=True)
    keep = sorted_records[0]
    remove = sorted_records[1:]
    
    duplicates_to_keep.append(keep)
    duplicates_to_remove.extend(remove)
    
    print(f"\nGroup {k} ({len(records)} records):")
    print(f"  [KEEP]   ID={keep['id']}, Code={keep['data'].get('employeeCode')}, Name='{keep['data'].get('name')}', Dept='{keep['data'].get('department')}', Pay={keep['data'].get('officeUse', {}).get('basicPay')}, Score={score_record(keep)}")
    for rem in remove:
        print(f"  [REMOVE] ID={rem['id']}, Code={rem['data'].get('employeeCode')}, Name='{rem['data'].get('name')}', Dept='{rem['data'].get('department')}', Pay={rem['data'].get('officeUse', {}).get('basicPay')}, Score={score_record(rem)}")

print(f"\nTotal records to KEEP: {len(emp) - len(duplicates_to_remove)}")
print(f"Total duplicate records to REMOVE: {len(duplicates_to_remove)}")
