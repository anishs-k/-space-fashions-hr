import os
from supabase import create_client

url = "https://imuozlqorndfrcwdwphf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

client = create_client(url, key)

# Count total in non_employees
res_non_emp = client.table("non_employees").select("id, data", count="exact").execute()
print(f"Total count reported in 'non_employees': {res_non_emp.count}")
print(f"Rows fetched: {len(res_non_emp.data)}")

if res_non_emp.data:
    called_interview = sum(1 for r in res_non_emp.data if r.get('data', {}).get('calledForInterview'))
    offered_join = sum(1 for r in res_non_emp.data if r.get('data', {}).get('offeredToJoin'))
    print(f"Called for interview: {called_interview}")
    print(f"Offered to join: {offered_join}")
    print("\nSample records:")
    for r in res_non_emp.data[:5]:
        d = r.get('data', {})
        print(f"- ID: {r['id']}, SrNo: {d.get('srNo')}, Name: {d.get('name')}, Post: {d.get('postAppliedFor')}, Offered: {d.get('offeredToJoin')}")
