# Deployment Guide - Vercel with Custom Domain

## Setup Instructions

### 1. Environment Variables

Update your `.env` file with your Supabase credentials:

```env
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Vercel Deployment

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

3. **Or deploy via Vercel Dashboard**:
   - Push your code to GitHub
   - Connect your repository at [vercel.com](https://vercel.com)
   - Vercel will automatically deploy on each push

### 3. Environment Variables on Vercel

After deployment, set the environment variables in your Vercel project:

1. Go to your project settings in Vercel Dashboard
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your Supabase anon key)
   - `GEMINI_API_KEY` (your Gemini API key)

### 4. Custom Domain Setup

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Add your custom domain (e.g., `verdana-cards.com`)

2. **DNS Configuration**:
   - Add a CNAME record pointing to: `cname.vercel-dns.com`
   - Or add A records for the Vercel IP addresses

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates for custom domains

### 5. Supabase Database Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the Project URL and anon key

2. **Database Schema**:
   The application expects the following tables:
   - `decks` (with user_id, title, language, created_at, quiz_history)
   - `flashcards` (with deck_id, front, back, srs_level, next_review_date)
   - `media_assets` (with user_id, type, url, title, created_at)

3. **Row Level Security (RLS)**:
   - Enable RLS on all tables
   - Create policies to restrict access to user's own data

### 6. Testing the Deployment

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Test locally**:
   ```bash
   npm run start
   ```

3. **Check deployment**:
   - Visit your Vercel deployment URL
   - Test authentication and database operations

## Troubleshooting

- **Build errors**: Check that all environment variables are set
- **Database connection issues**: Verify Supabase credentials and RLS policies
- **Custom domain not working**: Check DNS propagation (can take up to 24 hours)

## Migration from Firebase

- Firebase hosting configuration has been removed
- Firebase authentication replaced with Supabase Auth
- Firestore database replaced with Supabase PostgreSQL
- All Firebase dependencies removed from package.json

The application is now ready for deployment on Vercel with custom domain support.
