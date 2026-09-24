import os
from supabase import create_client

url = "https://imuozlqorndfrcwdwphf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

client = create_client(url, key)

sample_row = [{
    "id": "EMP-5380",
    "data": {
        "id": "EMP-5380",
        "name": "TEST EMPLOYEE",
        "status": "active"
    }
}]

try:
    print("Testing upsert...")
    res = client.table("employees").upsert(sample_row).execute()
    print("Upsert result:", res)
except Exception as e:
    print("Upsert Error:", e)

try:
    print("Testing insert...")
    res2 = client.table("employees").insert(sample_row).execute()
    print("Insert result:", res2)
except Exception as e:
    print("Insert Error:", e)
