# Vercel Deployment Guide for Agile Hub

This guide will help you deploy the Agile Hub planning poker application to Vercel using Turborepo.

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
3. **GitHub Repository**: Your code should be pushed to a GitHub repository

## Environment Variables

You'll need to configure the following environment variables in Vercel:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-this` |
| `NEXT_PUBLIC_API_URL` | URL of your deployed API | `https://your-api.vercel.app` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket URL (usually same as API) | `https://your-api.vercel.app` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | API server port | `8080` |

## Deployment Steps

### 1. Deploy the Web App (Frontend)

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `apps/web` directory as the root directory

2. **Configure Project Settings**:
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: cd ../.. && turbo build --filter=@agile-hub/web
   Output Directory: .next
   Install Command: pnpm install
   ```

3. **Set Environment Variables**:
   - In Project Settings → Environment Variables
   - Add all required environment variables listed above
   - Make sure `NEXT_PUBLIC_*` variables are available for all environments

4. **Deploy**: Click "Deploy" and wait for completion

### 2. Deploy the API (Backend)

Since Vercel specializes in frontend deployments, you have a few options for the API:

#### Option A: Deploy API to Vercel (Recommended)

1. **Create a new Vercel project** for the API:
   - Import the same repository
   - Select `apps/api` as the root directory
   - Framework: Other
   - Build Command: `cd ../.. && turbo build --filter=@repo/api`
   - Output Directory: `dist`

2. **Create `vercel.json` in `apps/api`**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ]
   }
   ```

#### Option B: Use Railway, Render, or Heroku

You can also deploy the API to other platforms:

- **Railway**: Connect GitHub repo, select `apps/api` directory
- **Render**: Create a new web service, connect repository
- **Heroku**: Use the Heroku CLI with proper buildpack configuration

### 3. Update Environment Variables

After both deployments:

1. **Update Frontend Environment Variables**:
   - Set `NEXT_PUBLIC_API_URL` to your API deployment URL
   - Set `NEXT_PUBLIC_SOCKET_URL` to the same URL
   - Redeploy the frontend

2. **Update API CORS Settings**:
   - Make sure your API allows the frontend domain in CORS settings
   - Update the `origin` configuration in `apps/api/src/index.ts`

## Database Setup

### Using Neon (Recommended)

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Add it as `DATABASE_URL` environment variable
4. Run migrations if needed

### Using Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string
4. Add it as `DATABASE_URL` environment variable

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API endpoints respond correctly
- [ ] Database connection works
- [ ] WebSocket connections work
- [ ] Authentication flow works
- [ ] Planning sessions can be created
- [ ] Real-time features work

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all workspace packages are properly built
   - Verify TypeScript compilation passes
   - Ensure all dependencies are correctly installed

2. **Environment Variable Issues**:
   - Double-check variable names and values
   - Ensure `NEXT_PUBLIC_*` variables are set for client-side access
   - Verify database connection string format

3. **CORS Errors**:
   - Update API CORS configuration to include your frontend domain
   - Check that WebSocket connections are allowed

4. **WebSocket Issues**:
   - Ensure your API platform supports WebSocket connections
   - Some platforms require specific configuration for WebSockets

### Vercel-Specific Tips

- Use Vercel's preview deployments for testing
- Check function logs in Vercel dashboard for debugging
- Use Vercel Analytics for performance monitoring
- Enable Vercel Speed Insights for Core Web Vitals

## Performance Optimization

1. **Enable Vercel Analytics**:
   ```bash
   pnpm add @vercel/analytics
   ```

2. **Add Speed Insights**:
   ```bash
   pnpm add @vercel/speed-insights
   ```

3. **Configure Caching**:
   - API responses are cached appropriately
   - Static assets are optimized
   - Database queries are efficient

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Turborepo deployment guide: https://vercel.com/docs/monorepos/turborepo
- Create an issue in the repository for project-specific problems 