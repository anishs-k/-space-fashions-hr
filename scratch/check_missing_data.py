import urllib.request
import json
import pandas as pd

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

print('Fetching Supabase data...')
sb_emp = fetch_all('employees')
sb_non = fetch_all('non_employees')

print(f'Supabase employees count: {len(sb_emp)}')
print(f'Supabase non_employees count: {len(sb_non)}')

sb_codes = set()
for row in sb_emp + sb_non:
    row_id = str(row.get('id', '')).strip()
    if row_id:
        sb_codes.add(row_id)
        if row_id.startswith('EMP-'):
            sb_codes.add(row_id.replace('EMP-', ''))
        else:
            sb_codes.add(f'EMP-{row_id}')
            
    data = row.get('data') or {}
    code = str(data.get('employeeCode', '')).strip()
    if code:
        sb_codes.add(code)
        if code.startswith('EMP-'):
            sb_codes.add(code.replace('EMP-', ''))
        else:
            sb_codes.add(f'EMP-{code}')

# Read files
df_bio = pd.read_excel('BIO DATA.xlsx')
df_final = pd.read_excel('final (1).xlsx')

def analyze_df(df, file_name, id_col, name_col, dept_col, post_col):
    present = []
    missing = []
    
    for idx, row in df.iterrows():
        raw_id = row.get(id_col)
        name = str(row.get(name_col, '')).strip() if pd.notna(row.get(name_col)) else ''
        if pd.isna(raw_id) or str(raw_id).strip() == '':
            id_str = ''
        else:
            id_str = str(raw_id).strip()
            if id_str.endswith('.0'): id_str = id_str[:-2]
            
        emp_id = f'EMP-{id_str}' if id_str and not id_str.startswith('EMP-') else id_str
        
        is_in_db = False
        if id_str and (id_str in sb_codes or emp_id in sb_codes):
            is_in_db = True
            
        post = str(row.get(post_col, '')).strip() if pd.notna(row.get(post_col)) else ''
        dept = str(row.get(dept_col, '')).strip() if pd.notna(row.get(dept_col)) else ''
        
        info = {
            'row_num': idx + 2,
            'id': id_str,
            'name': name,
            'post': post,
            'department': dept
        }
        
        if is_in_db:
            present.append(info)
        else:
            missing.append(info)
            
    print(f'\n========================================')
    print(f'FILE: {file_name}')
    print(f'Total Excel Records: {len(df)}')
    print(f'Already in Supabase DB: {len(present)}')
    print(f'MISSING in Supabase DB: {len(missing)}')
    print(f'========================================')
    
    if missing:
        print('\n--- Sample Missing Records (First 10) ---')
        for m in missing[:10]:
            print(f"Row {m['row_num']}: Serial/Code='{m['id']}' | Name='{m['name']}' | Post='{m['post']}' | Dept='{m['department']}'")
        
        if len(missing) > 20:
            print(f'\n--- Sample Missing Records (Middle 5) ---')
            mid = len(missing) // 2
            for m in missing[mid:mid+5]:
                print(f"Row {m['row_num']}: Serial/Code='{m['id']}' | Name='{m['name']}' | Post='{m['post']}' | Dept='{m['department']}'")

        print('\n--- Sample Missing Records (Last 10) ---')
        for m in missing[-10:]:
            print(f"Row {m['row_num']}: Serial/Code='{m['id']}' | Name='{m['name']}' | Post='{m['post']}' | Dept='{m['department']}'")
            
    return present, missing

bio_pres, bio_miss = analyze_df(df_bio, 'BIO DATA.xlsx', 'Serial No', 'Name', 'Department', 'Post Applied For')
fin_pres, fin_miss = analyze_df(df_final, 'final (1).xlsx', 'code_serial', 'name', 'department', 'post_applied_for')

# Summary overall
print('\n========================================')
print('OVERALL SUMMARY')
print(f'Total in DB currently: {len(sb_emp)} employees + {len(sb_non)} non-employees = {len(sb_emp) + len(sb_non)}')
print(f'Total in 2 Excel files: {len(df_bio) + len(df_final)}')
print(f'Total already present in DB: {len(bio_pres) + len(fin_pres)}')
print(f'Total MISSING from DB (to be inserted): {len(bio_miss) + len(fin_miss)}')
print('========================================')
