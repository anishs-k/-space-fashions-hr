import urllib.request
import json
import collections
import time

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

def delete_by_id(rec_id):
    url = f'{SUPABASE_URL}/rest/v1/employees?id=eq.{rec_id}'
    req = urllib.request.Request(url, headers={
        'apikey': ANON_KEY,
        'Authorization': f'Bearer {ANON_KEY}'
    }, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return True, resp.status
    except Exception as e:
        return False, str(e)

print("Fetching all employees from Supabase...")
emp = fetch_all('employees')
print(f"Total current employees in Supabase: {len(emp)}")

groups = collections.defaultdict(list)
for r in emp:
    d = r.get('data') or {}
    name = str(d.get('name', '')).strip().lower()
    fname = str(d.get('fatherHusbandName', '')).strip().lower()
    contact = str(d.get('contactNo', '')).strip().replace('-', '').replace(' ', '')
    if contact.endswith('.0'): contact = contact[:-2]
    
    if name:
        if fname:
            key = (name, fname)
        elif contact and len(contact) >= 10:
            key = (name, f"contact:{contact}")
        else:
            key = (name, f"id:{r['id']}")
        groups[key].append(r)

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

duplicates_to_remove = []
dup_groups = {k: v for k, v in groups.items() if len(v) > 1}

for k, records in dup_groups.items():
    sorted_records = sorted(records, key=score_record, reverse=True)
    remove = sorted_records[1:]
    duplicates_to_remove.extend(remove)

print(f"\nFound {len(duplicates_to_remove)} duplicate records to remove.")

success_deleted = 0
failed_deleted = 0

for idx, rec in enumerate(duplicates_to_remove):
    rec_id = rec['id']
    ok, status = delete_by_id(rec_id)
    if ok:
        success_deleted += 1
    else:
        failed_deleted += 1
        print(f"Failed to delete {rec_id}: {status}")
    if (idx + 1) % 25 == 0 or (idx + 1) == len(duplicates_to_remove):
        print(f"Progress: {idx+1}/{len(duplicates_to_remove)} deleted...")
    time.sleep(0.05)

print("\n==========================================")
print(f"Deletion Complete!")
print(f"Successfully removed: {success_deleted} duplicates. Failed: {failed_deleted}")

# Final verification
remaining_emp = fetch_all('employees')
print(f"Final Clean Supabase Employees Count: {len(remaining_emp)}")
print("==========================================")
