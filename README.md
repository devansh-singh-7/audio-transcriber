# Audio Transcriber

## Setup
1. Clone the repo
2. Copy .env.local.example to .env.local
3. Fill in DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY
4. Run: npm install
5. Run: npm run db:push
6. Run: npm run db:seed
7. Run: npm run dev

## Admin credentials
Email: admin@transcriber.com
Password: Admin@1234

## Tech Stack
Next.js 14, Better Auth, Drizzle ORM, PostgreSQL, Gemini 1.5 Flash

## Deployment Steps
a. Push code to GitHub  
b. Go to railway.app -> New Project -> Deploy from GitHub repo  
c. Add a PostgreSQL plugin in Railway dashboard  
d. Set environment variables in Railway:
- DATABASE_URL: (copy from Railway PostgreSQL plugin)
- BETTER_AUTH_SECRET: (any random 32+ char string)
- BETTER_AUTH_URL: https://your-app.railway.app
- NEXT_PUBLIC_BETTER_AUTH_URL: https://your-app.railway.app
- GEMINI_API_KEY: AIzaSyAKcd38Kz2lpcCwCZCHLQSVNfitM2MEewM
e. After first deploy, run the seed via Railway CLI or add seed to build command:
"build": "next build && npx tsx src/lib/seed.ts"
