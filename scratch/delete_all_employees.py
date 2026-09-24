import os
from supabase import create_client

url = "https://imuozlqorndfrcwdwphf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

client = create_client(url, key)

print("Deleting all rows from 'employees' table...")
# Delete all records where id is not null / not equal to dummy string
res = client.table("employees").delete().neq("id", "___NON_EXISTENT_ID___").execute()
print(f"Deleted records count: {len(res.data) if res.data else 'All'}")

# Verify current count
count_res = client.table("employees").select("id", count="exact").execute()
print(f"Remaining records in 'employees' table: {count_res.count}")
