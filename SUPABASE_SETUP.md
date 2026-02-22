# 🚀 Supabase Setup Guide - ইফতার বিরিয়ানি দিবে

এই গাইড অনুসরণ করে আপনার অ্যাপে Supabase integration করুন যাতে সবাই একই data দেখতে পারে!

## ধাপ ১: Supabase প্রজেক্ট তৈরি করুন

1. [Supabase](https://app.supabase.com) এ যান এবং Sign Up করুন (GitHub দিয়ে সহজেই সাইন আপ করতে পারবেন)
2. "New Project" বাটনে ক্লিক করুন
3. যেকোনো নাম দিন (যেমন: `iftar-biryani`)
4. একটা শক্তিশালী Database Password দিন এবং সেভ করে রাখুন
5. Region নির্বাচন করুন (Southeast Asia - Singapore সবচেয়ে কাছে)
6. Free plan নির্বাচন করুন
7. "Create new project" ক্লিক করুন এবং ১-২ মিনিট অপেক্ষা করুন

## ধাপ ২: Database Table তৈরি করুন

1. আপনার Supabase project dashboard এ যান
2. বাম পাশে **"Table Editor"** এ ক্লিক করুন
3. "Create a new table" বাটনে ক্লিক করুন
4. নিচের মতো করে table তৈরি করুন:

**Table Name:** `biryani_spots`

**Columns:**

| Name        | Type        | Default Value | Primary | Not Null | Unique |
| ----------- | ----------- | ------------- | ------- | -------- | ------ |
| id          | text        | -             | ✅      | ✅       | ✅     |
| name        | text        | -             | -       | ✅       | -      |
| address     | text        | -             | -       | ✅       | -      |
| description | text        | -             | -       | -        | -      |
| addedBy     | text        | 'বেনামী'      | -       | ✅       | -      |
| lat         | float8      | -             | -       | ✅       | -      |
| lng         | float8      | -             | -       | ✅       | -      |
| isActive    | bool        | true          | -       | ✅       | -      |
| rating      | float8      | NULL          | -       | -        | -      |
| likes       | int4        | 0             | -       | ✅       | -      |
| dislikes    | int4        | 0             | -       | ✅       | -      |
| createdAt   | timestamptz | now()         | -       | ✅       | -      |

অথবা **SQL Editor** থেকে এই SQL run করুন:

```sql
CREATE TABLE biryani_spots (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  description text,
  "addedBy" text NOT NULL DEFAULT 'বেনামী',
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  rating float8,
  likes int4 NOT NULL DEFAULT 0,
  dislikes int4 NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE biryani_spots ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access
CREATE POLICY "Enable read access for all users" ON biryani_spots
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON biryani_spots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON biryani_spots
  FOR UPDATE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE biryani_spots;
```

## ধাপ ৩: API Keys সংগ্রহ করুন

1. বাম পাশে **"Settings"** (⚙️) এ ক্লিক করুন
2. **"API"** section এ যান
3. দুটি জিনিস copy করুন:
   - **Project URL** (এটা দেখতে এরকম: `https://xxxxx.supabase.co`)
   - **anon public key** (এটা লম্বা একটা string)

## ধাপ ৪: Environment Variables সেট করুন

1. প্রজেক্টের root folder এ `.env` নামে একটি নতুন ফাইল তৈরি করুন (`.env.example` এর পাশে)
2. নিচের content যোগ করুন:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. `xxxxx.supabase.co` এর জায়গায় আপনার Project URL বসান
4. `your_anon_key_here` এর জায়গায় আপনার anon public key বসান

⚠️ **গুরুত্বপূর্ণ:** `.env` file টি `.gitignore` এ আছে কিনা check করুন!

## ধাপ ৫: অ্যাপ চালু করুন

```bash
npm run dev
```

## ✅ সফল হয়েছে কিনা পরীক্ষা করুন

1. অ্যাপ খুলুন (`http://localhost:5173`)
2. একটি নতুন spot যোগ করুন
3. Supabase dashboard এর Table Editor এ গিয়ে দেখুন data এসেছে কিনা
4. অন্য একটি browser বা incognito window খুলে একই URL খুলুন
5. দেখবেন একই data দুই জায়গায় দেখা যাচ্ছে! 🎉

## 🔥 Real-time Testing

1. দুটি browser window/tab খুলুন
2. একটিতে spot যোগ করুন
3. দেখবেন অন্য window এ automatically update হয়ে যাচ্ছে!

## সমস্যা সমাধান

### "No spots showing"

- Check করুন `.env` file সঠিকভাবে configured আছে কিনা
- Browser console check করুন কোনো error আছে কিনা
- Supabase API keys সঠিক আছে কিনা verify করুন

### "Cannot insert data"

- নিশ্চিত করুন Row Level Security policies সঠিকভাবে তৈরি হয়েছে
- SQL Editor থেকে policies run করুন

### "Real-time না কাজ করলে"

- নিশ্চিত করুন Realtime enabled আছে:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE biryani_spots;
  ```

### "Like/Dislike counts showing weird numbers"

যদি আপনি অস্বাভাবিক সংখ্যা দেখেন (যেমন: 2147483647 বা -2147483647), তাহলে:

1. Supabase SQL Editor এ যান
2. `fix_corrupted_data.sql` ফাইলের content copy করুন এবং run করুন
3. এটি সব corrupted data reset করে দেবে এবং ভবিষ্যতে এই সমস্যা হওয়া থেকে বাঁচাবে

অথবা সরাসরি এই SQL run করুন:

```sql
-- Reset corrupted values
UPDATE biryani_spots SET likes = 0 WHERE likes < 0 OR likes > 99999;
UPDATE biryani_spots SET dislikes = 0 WHERE dislikes < 0 OR dislikes > 99999;

-- Prevent future corruption
ALTER TABLE biryani_spots ADD CONSTRAINT likes_valid_range CHECK (likes >= 0 AND likes <= 99999);
ALTER TABLE biryani_spots ADD CONSTRAINT dislikes_valid_range CHECK (dislikes >= 0 AND dislikes <= 99999);
```

## 🌍 Production Deployment

যখন আপনি Vercel/Netlify তে deploy করবেন:

1. Platform এর environment variables section এ যান
2. `VITE_SUPABASE_URL` এবং `VITE_SUPABASE_ANON_KEY` add করুন
3. Redeploy করুন

---

**সাহায্যের জন্য:** [Supabase Documentation](https://supabase.com/docs)
