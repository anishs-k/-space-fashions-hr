# Supabase se seedha data check karna (app ke bina)

Main tumhare Supabase se khud connect nahi kar pa raha (mera environment ka network external services block karta hai security ki wajah se). Isliye ye do tarike hain jisse **tum khud** 2 minute mein check kar sakte ho ki data database mein hai ya nahi, aur anon key se fetch ho raha hai ya nahi.

---

## Tarika 1 — Browser Console se (sabse aasan)

1. Apni deployed site kholo (jo bhi URL hai)
2. **F12** dabao → **Console** tab pe jao
3. Neeche wala code paste karke **Enter** dabao:

```js
fetch("https://imuozlqorndfrcwdwphf.supabase.co/rest/v1/employees?select=id,data&limit=5", {
  headers: {
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg",
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"
  }
})
  .then(r => r.json())
  .then(d => console.log("RESULT:", d));
```

### Result kaise padhna hai:
- **`[{id: "EMP-...", data: {...}}, ...]`** (array of records) → Matlab **data hai aur anon access bhi kaam kar raha hai**. Agar phir bhi app mein khaali dikh raha hai, toh problem app ke deployed code mein hai (purana build abhi bhi live hai) — dobara redeploy karo.
- **`{message: "permission denied for table employees", ...}`** ya `{code: "42501", ...}` → Matlab **`TEMP_DISABLE_AUTH_RLS.sql` abhi tak RUN nahi hua** Supabase mein. Ye pehle karo.
- **`[]`** (empty array, error nahi) → Matlab RLS toh theek hai, lekin **table mein data hi nahi hai** (684 employees import nahi hue). Supabase Table Editor mein `employees` table check karo.
- Koi CORS/network error → Site URL Supabase ke allowed URLs mein add nahi hai (Authentication → URL Configuration mein check karo), ya galat Supabase project URL hai.

---

## Tarika 2 — Apne computer ke terminal se (agar terminal use karte ho)

```bash
curl "https://imuozlqorndfrcwdwphf.supabase.co/rest/v1/employees?select=id&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdW96bHFvcm5kZnJjd2R3cGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzgwODEsImV4cCI6MjEwNTQxNDA4MX0.rW8CFkXsi4ICXQoC_8Zxb09XXwB9rvkjlFwXojov7mg"
```

Same result-reading rules jaisa upar bataya.

---

## Jo bhi result aaye, wo mujhe copy-paste kar dena — main uske hisaab se exact fix bata dunga.