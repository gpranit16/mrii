# 🚀 Complete Setup Guide

This guide will walk you through setting up the MRI Image Verification System from scratch.

## Step-by-Step Setup

### 1. System Requirements

Before you begin, ensure you have:
- ✅ Node.js 18 or higher ([Download](https://nodejs.org/))
- ✅ npm, pnpm, or yarn package manager
- ✅ Git installed
- ✅ A code editor (VS Code recommended)
- ✅ A Supabase account (free tier is sufficient)

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd mrip-uzzle

# Install dependencies
npm install

# This will install all required packages including:
# - Next.js 14
# - React 19
# - Jimp (image processing)
# - Supabase client
# - Tailwind CSS
# - And more...
```

### 3. Supabase Setup (Critical!)

#### 3.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New project"
5. Fill in:
   - **Name**: MRI-Verification (or any name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free
6. Click "Create new project" and wait 2-3 minutes

#### 3.2 Get Your API Credentials

1. In your Supabase dashboard, click on "Settings" (gear icon)
2. Navigate to "API"
3. You'll see three important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...` - keep this secret!)

#### 3.3 Set Up the Database

1. In Supabase dashboard, click "SQL Editor" from the sidebar
2. Click "New query"
3. Open `scripts/01-create-schema.sql` in your code editor
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

This creates the `verifications` table that stores all verification attempts.

### 4. Configure Environment Variables

#### 4.1 Create the .env.local file

```bash
# Copy the example file
cp .env.example .env.local
```

#### 4.2 Edit .env.local

Open `.env.local` in your code editor and replace the placeholder values:

```env
# Replace these with YOUR Supabase credentials from step 3.2
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key_here

# Optional: Adjust these settings
SIMILARITY_THRESHOLD=95
MAX_FILE_SIZE_MB=10
```

⚠️ **Important**: 
- Never commit `.env.local` to git
- The `service_role` key has full database access - keep it secret!
- `NEXT_PUBLIC_*` variables are visible to the browser

### 5. Verify Reference Image

Check that the reference image exists:

```bash
# Windows
dir public\dataset\tumor.jpg

# Mac/Linux
ls -la public/dataset/tumor.jpg
```

If the file is missing, add your reference MRI image to `public/dataset/tumor.jpg`.

### 6. Start the Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

### 7. Test the Application

1. Open your browser and go to `http://localhost:3000`
2. You should see the MRI Image Verification System interface
3. Click "Click to upload" or drag an image
4. Select `test_images/tumor.jpg` (this should match 100%)
5. Click "Verify Image"
6. Wait for processing...
7. You should see:
   - ✅ Success message
   - Overall similarity ~100%
   - Detailed metrics
   - SHA-256 hash code

### 8. Verify Database Logging

1. Go back to your Supabase dashboard
2. Click "Table Editor" from the sidebar
3. Select the `verifications` table
4. You should see your test verification logged with:
   - Filename
   - Match result (true)
   - Hash
   - Similarity percentage
   - Timestamp

## Common Issues and Solutions

### Issue: "Module not found: Can't resolve '@/components/ui/progress'"

**Solution**: The Progress component might be missing. Create it:

```bash
# If using shadcn/ui
npx shadcn-ui@latest add progress
```

### Issue: "Reference image not found on server"

**Solution**: 
1. Check that `public/dataset/tumor.jpg` exists
2. Restart the dev server (`Ctrl+C` then `npm run dev`)
3. Verify the path in `lib/config.ts`

### Issue: "Invalid credentials" or Supabase errors

**Solution**:
1. Double-check your `.env.local` file has the correct credentials
2. Make sure there are no extra spaces or quotes
3. Restart the dev server after changing `.env.local`
4. Verify your Supabase project is active (not paused)

### Issue: Images not matching when they should

**Solution**:
1. Check the similarity threshold in `.env.local`
2. The default is 95% - try lowering it to 90% for testing
3. Review the detailed metrics in the response
4. Ensure images are in supported formats (JPEG, PNG, WebP)

### Issue: "File too large" error

**Solution**:
1. Compress your image before uploading
2. Increase `MAX_FILE_SIZE_MB` in `.env.local`
3. Restart the dev server

## Testing Checklist

- [ ] Application loads without errors
- [ ] Can select an image file
- [ ] Image preview appears
- [ ] Can upload matching image (tumor.jpg)
- [ ] Verification succeeds with high similarity
- [ ] Hash code is displayed
- [ ] Can upload non-matching image
- [ ] Verification fails with low similarity
- [ ] Verifications are logged in Supabase
- [ ] Error messages appear for invalid files

## Next Steps

### For Development
- Customize the UI in `app/page.tsx`
- Adjust comparison algorithm in `app/api/verify/route.ts`
- Add authentication with Supabase Auth
- Implement rate limiting

### For Production
- See `README.md` deployment section
- Set up environment variables in Vercel
- Configure custom domain
- Set up monitoring and analytics
- Add backup strategy for database

## Need Help?

1. Check the main `README.md` for detailed documentation
2. Review the troubleshooting section
3. Check Supabase logs in the dashboard
4. Review browser console for errors
5. Open an issue on GitHub

---

**Congratulations! Your MRI Image Verification System is ready! 🎉**
