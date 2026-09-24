import os
from supabase import create_client

url = "https://imuozlqorndfrcwdwphf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"

client = create_client(url, key)

# Count total in Supabase
res_count = client.table("employees").select("id", count="exact").execute()
print(f"Total count reported by count='exact': {res_count.count}")
print(f"Rows returned in single query: {len(res_count.data)}")

# Paginated fetch test
all_rows = []
page = 0
page_size = 1000
while True:
    res = client.table("employees").select("id").range(page * page_size, (page + 1) * page_size - 1).execute()
    data = res.data
    if not data:
        break
    all_rows.extend(data)
    print(f"Fetched page {page}: {len(data)} rows (total so far: {len(all_rows)})")
    if len(data) < page_size:
        break
    page += 1

print(f"Total rows fetched across all pages: {len(all_rows)}")
