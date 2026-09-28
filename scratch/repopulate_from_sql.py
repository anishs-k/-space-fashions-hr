import urllib.request
import json
import re
from datetime import datetime, timezone
import time

SUPABASE_URL = 'https://imuozlqorndfrcwdwphf.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg'

def clear_employees_table():
    print("Clearing 'employees' table...")
    url = f"{SUPABASE_URL}/rest/v1/employees?id=neq.___DUMMY_ID_NEVER_MATCH___"
    req = urllib.request.Request(url, headers={
        'apikey': ANON_KEY,
        'Authorization': f'Bearer {ANON_KEY}'
    }, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            print("Delete response status:", resp.status)
            return True
    except Exception as e:
        print("Delete error:", e)
        return False

def get_count(table):
    url = f'{SUPABASE_URL}/rest/v1/{table}?select=id'
    req = urllib.request.Request(url, headers={'apikey': ANON_KEY, 'Authorization': f'Bearer {ANON_KEY}', 'Range-Unit': 'items', 'Range': '0-0', 'Prefer': 'count=exact'}, method='HEAD')
    try:
        with urllib.request.urlopen(req) as r:
            cr = r.headers.get('Content-Range')
            if cr and '/' in cr:
                return int(cr.split('/')[-1])
            return 0
    except:
        return 0

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

# Clear existing table
clear_employees_table()
time.sleep(1)
print(f"Employees count after clear: {get_count('employees')}")

sql_path = 'bio_data_supabase_insert.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()
value_lines = []
in_values = False
for line in lines:
    stripped = line.strip()
    if stripped.startswith('INSERT INTO') or stripped.startswith('(') or stripped.startswith(')'):
        if 'VALUES' in stripped:
            in_values = True
            continue
    if in_values:
        if stripped and not stripped.startswith('--'):
            value_lines.append(stripped)

full_values_text = '\n'.join(value_lines).rstrip(';')

def safe_float(val, default=0.0):
    if val is None: return default
    try:
        if isinstance(val, (int, float)): return float(val)
        s = str(val).replace(',', '').replace('/-', '').replace('/', '').strip()
        m = re.search(r'[-+]?\d*\.?\d+', s)
        if m: return float(m.group(0))
        return default
    except:
        return default

def safe_int(val, default=0):
    if val is None: return default
    try:
        if isinstance(val, (int, float)): return int(val)
        s = str(val).replace(',', '').replace('/-', '').replace('/', '').strip()
        m = re.search(r'\d+', s)
        if m: return int(m.group(0))
        return default
    except:
        return default

def parse_sql_row(row_str):
    s = row_str.strip()
    if s.endswith(','): s = s[:-1]
    if s.startswith('(') and s.endswith(')'):
        s = s[1:-1]
    
    tokens = []
    current = []
    in_quotes = False
    quote_char = None
    i = 0
    while i < len(s):
        c = s[i]
        if in_quotes:
            if c == quote_char:
                if i + 1 < len(s) and s[i+1] == quote_char:
                    current.append(quote_char)
                    i += 1
                else:
                    in_quotes = False
            else:
                current.append(c)
        else:
            if c in ("'", '"'):
                in_quotes = True
                quote_char = c
            elif c == ',':
                val = ''.join(current).strip()
                tokens.append(val)
                current = []
            else:
                current.append(c)
        i += 1
    tokens.append(''.join(current).strip())
    
    clean_tokens = []
    for t in tokens:
        if t.upper() == 'NULL' or t == '':
            clean_tokens.append(None)
        elif t.startswith("'") and t.endswith("'"):
            clean_tokens.append(t[1:-1])
        else:
            clean_tokens.append(t)
    return clean_tokens

raw_rows_strs = re.findall(r'\((?:[^\)\(]|\([^\)\(]*\))*\)', full_values_text)
print(f"Total SQL rows matched: {len(raw_rows_strs)}")

parsed_records = []
seen_ids = set()
auto_id_counter = 10001

for idx, r_str in enumerate(raw_rows_strs):
    vals = parse_sql_row(r_str)
    if len(vals) < 31:
        vals = vals + [None] * (31 - len(vals))
        
    source_file = vals[0]
    page = vals[1]
    code_serial = str(vals[2]).strip() if vals[2] is not None else ''
    if code_serial.endswith('.0'): code_serial = code_serial[:-2]
    
    basic_pay = safe_float(vals[3], 0.0)
    esi_no = vals[4]
    pf_no = vals[5]
    ctc = safe_float(vals[6], 0.0)
    net_in_hand = safe_float(vals[7], 0.0)
    post_applied_for = str(vals[8]).strip() if vals[8] is not None else 'HELPER'
    department = str(vals[9]).strip() if vals[9] is not None else 'Production'
    name = str(vals[10]).strip() if vals[10] is not None else f"Employee {code_serial or idx+1}"
    father_husband_name = str(vals[11]).strip() if vals[11] is not None else ''
    dob = str(vals[12]).strip() if vals[12] is not None else ''
    age = safe_int(vals[13], 0)
    qualification = str(vals[14]).strip() if vals[14] is not None else ''
    technical_qualification = str(vals[15]).strip() if vals[15] is not None else ''
    permanent_address = str(vals[16]).strip() if vals[16] is not None else ''
    local_address = str(vals[17]).strip() if vals[17] is not None else ''
    reference = str(vals[18]).strip() if vals[18] is not None else ''
    reference_details = str(vals[19]).strip() if vals[19] is not None else ''
    lang_read = str(vals[20]).strip() if vals[20] is not None else ''
    lang_write = str(vals[21]).strip() if vals[21] is not None else ''
    lang_speak = str(vals[22]).strip() if vals[22] is not None else ''
    nominee_name = str(vals[23]).strip() if vals[23] is not None else ''
    nominee_age = safe_int(vals[24], 0)
    nominee_dob = str(vals[25]).strip() if vals[25] is not None else ''
    nominee_relation = str(vals[26]).strip() if vals[26] is not None else ''
    family_particulars = str(vals[27]).strip() if vals[27] is not None else ''
    contact_no = str(vals[28]).strip() if vals[28] is not None else ''
    if contact_no.endswith('.0'): contact_no = contact_no[:-2]
    date_of_joining = str(vals[29]).strip() if vals[29] is not None else ''
    skills_machine = str(vals[30]).strip() if vals[30] is not None else ''

    emp_code = code_serial
    if not emp_code:
        emp_code = f"GEN{auto_id_counter}"
        auto_id_counter += 1
        emp_id = f"EMP-{emp_code}"
    else:
        emp_id = f"EMP-{emp_code}"

    if emp_id in seen_ids:
        suffix = 2
        cand = f"{emp_id}_{suffix}"
        while cand in seen_ids:
            suffix += 1
            cand = f"{emp_id}_{suffix}"
        emp_id = cand
    seen_ids.add(emp_id)

    apply_esi = bool(basic_pay > 0 and basic_pay <= 21000)
    apply_pf = bool(basic_pay > 0)
    apply_lwf = bool(basic_pay > 0)

    esi_ee = round(basic_pay * 0.0075) if apply_esi else 0
    pf_ee = round(basic_pay * 0.12) if apply_pf else 0
    lwf_ee = 5 if apply_lwf else 0

    esi_er = safe_float(esi_no, 0.0) if esi_no is not None else (round(basic_pay * 0.0325) if apply_esi else 0)
    pf_er = safe_float(pf_no, 0.0) if pf_no is not None else (round(basic_pay * 0.12) if apply_pf else 0)
    lwf_er = 20 if apply_lwf else 0

    if net_in_hand == 0 and basic_pay > 0:
        net_in_hand = basic_pay - (esi_ee + pf_ee + lwf_ee)
    if ctc == 0 and basic_pay > 0:
        ctc = basic_pay + esi_er + pf_er + lwf_er

    all_lang = f"{lang_read} {lang_write} {lang_speak}".lower()
    has_hindi = 'hindi' in all_lang or not all_lang.strip()
    has_eng = 'english' in all_lang or 'eng' in all_lang
    has_pun = 'punjabi' in all_lang or 'pun' in all_lang

    remarks_items = []
    if source_file: remarks_items.append(f"Source: {source_file}")
    if page: remarks_items.append(f"Page: {page}")
    if skills_machine: remarks_items.append(skills_machine)
    if reference_details: remarks_items.append(f"Ref: {reference_details}")

    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

    emp_obj = {
        "id": emp_id,
        "employeeCode": str(emp_code),
        "name": name,
        "fatherHusbandName": father_husband_name,
        "dob": dob,
        "age": age,
        "qualification": qualification,
        "technicalQualification": technical_qualification,
        "postAppliedFor": post_applied_for or 'HELPER',
        "department": department or 'Production',
        "jobProcessAssigned": skills_machine,
        "permanentAddress": permanent_address,
        "localAddress": local_address,
        "reference": reference,
        "contactNo": contact_no,
        "alternateContactNo": "",
        "dateOfJoining": date_of_joining,
        "category": "Worker",
        "status": "active",
        "languages": {
            "hindi": { "read": has_hindi, "write": has_hindi, "speak": has_hindi },
            "english": { "read": has_eng, "write": has_eng, "speak": has_eng },
            "punjabi": { "read": has_pun, "write": has_pun, "speak": has_pun },
            "other": { "name": "", "skill": { "read": False, "write": False, "speak": False } }
        },
        "nominee": {
            "name": nominee_name,
            "age": nominee_age,
            "dob": nominee_dob,
            "relation": nominee_relation
        },
        "family": [],
        "officeUse": {
            "basicPay": basic_pay,
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
            "netCash": net_in_hand,
            "remarks": " | ".join(remarks_items)
        },
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    parsed_records.append({
        "id": emp_id,
        "data": emp_obj
    })

print(f"Prepared {len(parsed_records)} records from SQL file.")

batch_size = 100
success_count = 0
failed_count = 0

for i in range(0, len(parsed_records), batch_size):
    chunk = parsed_records[i:i+batch_size]
    ok, status = upsert_batch(chunk)
    if ok:
        success_count += len(chunk)
        print(f"Uploaded batch {i//batch_size + 1}/{(len(parsed_records)-1)//batch_size + 1} ({len(chunk)} items) - Total: {success_count}/{len(parsed_records)}")
    else:
        print(f"Batch {i//batch_size + 1} failed ({status}). Retrying item-by-item...")
        for single in chunk:
            s_ok, s_status = upsert_batch([single])
            if s_ok:
                success_count += 1
            else:
                failed_count += 1
                print(f"Failed {single['id']}: {s_status}")
    time.sleep(0.15)

print("\n==========================================")
print(f"Upload Complete! Successfully inserted: {success_count} records. Failed: {failed_count}")
print(f"Final Supabase 'employees' count: {get_count('employees')}")
print("==========================================")
