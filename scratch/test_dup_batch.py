import os
from supabase import create_client

url = "https://imuozlqorndfrcwdwphf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

client = create_client(url, key)

# Test duplicate IDs in same batch
duplicate_batch = [
    {"id": "EMP-9999", "data": {"name": "User 1"}},
    {"id": "EMP-9999", "data": {"name": "User 2"}}
]

try:
    print("Testing batch with duplicate IDs in same request...")
    res = client.table("employees").upsert(duplicate_batch).execute()
    print("Result:", res)
except Exception as e:
    print("Caught Error with duplicate IDs in batch:", e)
