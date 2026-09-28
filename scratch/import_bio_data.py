import urllib.request
import json
import pandas as pd
from datetime import datetime, timezone
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

def upsert_batch(rows):
    url = f'{SUPABASE_URL}/rest/v1/employees'
    headers = {
        'apikey': ANON_KEY,
        'Authorization': f'Bearer {ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
    }
    payload = json.dumps(rows).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        return False, f"HTTP {e.code}: {err_body}"
    except Exception as e:
        return False, str(e)

print("Fetching current employee records from Supabase...")
existing_emp = fetch_all('employees')
existing_ids = set(r['id'] for r in existing_emp)
print(f"Current Supabase count: {len(existing_ids)}")

df = pd.read_excel('BIO DATA.xlsx')
print(f"Total rows in BIO DATA.xlsx: {len(df)}")

def parse_languages(lang_str):
    res = {
        "hindi": { "read": False, "write": False, "speak": False },
        "english": { "read": False, "write": False, "speak": False },
        "punjabi": { "read": False, "write": False, "speak": False },
        "other": { "name": "", "skill": { "read": False, "write": False, "speak": False } }
    }
    if not lang_str or pd.isna(lang_str):
        res["hindi"] = { "read": True, "write": True, "speak": True }
        return res
    
    s = str(lang_str).lower()
    if 'hindi' in s:
        res["hindi"] = { "read": True, "write": True, "speak": True }
    if 'english' in s or 'eng' in s:
        res["english"] = { "read": True, "write": True, "speak": True }
    if 'punjabi' in s or 'pun' in s:
        res["punjabi"] = { "read": True, "write": True, "speak": True }
        
    if not (res["hindi"]["read"] or res["english"]["read"] or res["punjabi"]["read"]):
        res["hindi"] = { "read": True, "write": True, "speak": True }
    return res

def format_date(val):
    if pd.isna(val) or val is None or str(val).strip() == '' or str(val) == 'nan':
        return ''
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.strftime('%d-%m-%Y')
    s = str(val).strip()
    return s

def format_clean_str(val):
    if pd.isna(val) or val is None or str(val) == 'nan':
        return ''
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s

def format_num(val, default=0):
    if pd.isna(val) or val is None:
        return default
    try:
        f = float(val)
        return int(f) if f.is_integer() else f
    except:
        return default

records_to_insert = []
seen_ids_in_batch = set()
auto_code_counter = 10001

for idx, row in df.iterrows():
    raw_serial = format_clean_str(row.get('Serial No'))
    name = format_clean_str(row.get('Name')) or f"Employee {raw_serial or idx+1}"
    
    emp_code = raw_serial
    if not emp_code:
        emp_code = f"GEN{auto_code_counter}"
        auto_code_counter += 1
        emp_id = f"EMP-{emp_code}"
    else:
        emp_id = f"EMP-{emp_code}"
        
    if emp_id in existing_ids or emp_id in seen_ids_in_batch:
        suffix = 2
        cand_id = f"{emp_id}_{suffix}"
        while cand_id in existing_ids or cand_id in seen_ids_in_batch:
            suffix += 1
            cand_id = f"{emp_id}_{suffix}"
        emp_id = cand_id

    seen_ids_in_batch.add(emp_id)

    bp = format_num(row.get('Basic Pay'), 0)
    esi_er = format_num(row.get('ESI Employer'), 0)
    pf_er = format_num(row.get('PF Employer'), 0)
    lwf_er = format_num(row.get('LWF'), 20 if bp > 0 else 0)
    ctc = format_num(row.get('CTC'), 0)
    net_cash = format_num(row.get('Net Cash'), 0)

    apply_esi = bool(bp > 0 and bp <= 21000)
    apply_pf = bool(bp > 0)
    apply_lwf = bool(bp > 0)

    esi_ee = round(bp * 0.0075) if apply_esi else 0
    pf_ee = round(bp * 0.12) if apply_pf else 0
    lwf_ee = 5 if apply_lwf else 0

    if esi_er == 0 and apply_esi: esi_er = round(bp * 0.0325)
    if pf_er == 0 and apply_pf: pf_er = round(bp * 0.12)
    if net_cash == 0 and bp > 0: net_cash = bp - (esi_ee + pf_ee + lwf_ee)
    if ctc == 0 and bp > 0: ctc = bp + esi_er + pf_er + lwf_er

    source_file = f"BIO DATA file {format_clean_str(row.get('Source File'))}" if format_clean_str(row.get('Source File')) else 'BIO DATA.xlsx'
    notes = format_clean_str(row.get('Notes'))
    salary_shown = format_clean_str(row.get('Salary Shown'))
    
    remarks_list = [source_file]
    if notes: remarks_list.append(f"Notes: {notes}")
    if salary_shown: remarks_list.append(f"Salary Shown: {salary_shown}")

    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

    emp_obj = {
        "id": emp_id,
        "employeeCode": str(emp_code),
        "name": name,
        "fatherHusbandName": format_clean_str(row.get('Father/Husband Name')),
        "dob": format_date(row.get('DOB')),
        "age": format_num(row.get('Age'), 0),
        "qualification": format_clean_str(row.get('Qualification')),
        "technicalQualification": "",
        "postAppliedFor": format_clean_str(row.get('Post Applied For')) or 'HELPER',
        "department": format_clean_str(row.get('Department')) or 'Production',
        "jobProcessAssigned": "",
        "permanentAddress": format_clean_str(row.get('Permanent Address')),
        "localAddress": format_clean_str(row.get('Local Address')),
        "reference": "",
        "contactNo": format_clean_str(row.get('Contact No')),
        "alternateContactNo": "",
        "dateOfJoining": format_date(row.get('Date of Joining')),
        "category": "Worker",
        "status": "active",
        "languages": parse_languages(row.get('Language')),
        "nominee": {
            "name": format_clean_str(row.get('Nominee Name')),
            "age": format_num(row.get('Nominee Age'), 0),
            "dob": format_date(row.get('Nominee DOB')),
            "relation": format_clean_str(row.get('Nominee Relation'))
        },
        "family": [],
        "officeUse": {
            "basicPay": bp,
            "esiEmployee": esi_ee,
            "pfEmployee": pf_ee,
            "esiEmployer": esi_er,
            "pfEmployer": pf_er,
            "bonus": 0,
            "lwwAllowed": 0,
            "lwwAmount": 0,
            "lwfEmployer": lwf_er,
            "lwfEmployee": lwf_ee,
            "applyEsi": apply_esi,
            "applyPf": apply_pf,
            "applyLwf": apply_lwf,
            "applyLww": False,
            "ctc": ctc,
            "netCash": net_cash,
            "remarks": " | ".join(remarks_list)
        },
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    records_to_insert.append({
        "id": emp_id,
        "data": emp_obj
    })

print(f"Starting upload for {len(records_to_insert)} records in batches of 100...")

batch_size = 100
success_count = 0
failed_count = 0

for i in range(0, len(records_to_insert), batch_size):
    chunk = records_to_insert[i:i+batch_size]
    ok, status = upsert_batch(chunk)
    if ok:
        success_count += len(chunk)
        print(f"Uploaded batch {i//batch_size + 1}/{(len(records_to_insert)-1)//batch_size + 1} ({len(chunk)} items) - Total: {success_count}/{len(records_to_insert)}")
    else:
        print(f"Batch {i//batch_size + 1} failed ({status}). Retrying row-by-row...")
        for single in chunk:
            s_ok, s_status = upsert_batch([single])
            if s_ok:
                success_count += 1
            else:
                failed_count += 1
                print(f"Failed row {single['id']}: {s_status}")
    time.sleep(0.2)

print("\n==========================================")
print(f"Upload Complete! Successfully inserted/updated: {success_count} records. Failed: {failed_count}")

# Verify in DB
final_emp = fetch_all('employees')
print(f"New Supabase Employees count: {len(final_emp)}")
print("==========================================")
