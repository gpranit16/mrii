# ⚡ Quick Start Guide

Get your MRI Image Verification System running in 5 minutes!

## 🎯 Prerequisites Checklist
- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account ([Sign up free](https://supabase.com))

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Get Supabase Credentials (2 min)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Settings → API
3. Copy:
   - Project URL
   - anon public key
   - service_role key

### Step 3: Configure Environment (1 min)
Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
```

### Step 4: Setup Database (1 min)
1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `scripts/01-create-schema.sql`
3. Run the query

### Step 5: Start App (<1 min)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Test It!
1. Upload `test_images/tumor.jpg`
2. Click "Verify Image"
3. Should show ~100% match with hash code

## 🎉 That's It!
Your app is ready. See `README.md` for advanced features.

## ❗ Troubleshooting
- **Port 3000 in use?** → Close other apps or change port
- **Module errors?** → Delete `node_modules`, run `npm install` again
- **Database errors?** → Double-check `.env.local` credentials
- **Reference image not found?** → Ensure `public/dataset/tumor.jpg` exists

## 📚 More Help
- Full setup guide: `SETUP.md`
- Complete docs: `README.md`
- Summary: `PROJECT_SUMMARY.md`
