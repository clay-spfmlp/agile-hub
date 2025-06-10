# 🚀 Quick Vercel Deployment Guide

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/agile-hub&project-name=agile-hub&repository-name=agile-hub)

## Manual Deployment Steps

### 1. Deploy Frontend (Web App)

1. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - **Root Directory**: `apps/web`
   - **Framework**: Next.js

2. **Build Settings**:
   ```
   Build Command: cd ../.. && pnpm turbo build --filter=@agile-hub/web
   Output Directory: .next
   Install Command: pnpm install
   ```

3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app
   NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.vercel.app
   ```

### 2. Deploy Backend (API)

1. **Create New Vercel Project**:
   - Import same repository
   - **Root Directory**: `apps/api`
   - **Framework**: Other

2. **Build Settings**:
   ```
   Build Command: cd ../.. && pnpm turbo build --filter=@repo/api
   Output Directory: dist
   Install Command: pnpm install
   ```

3. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=production
   ```

### 3. Database Setup

**Option A: Neon (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`

**Option B: Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

### 4. Final Steps

1. Update frontend `NEXT_PUBLIC_API_URL` with your API domain
2. Redeploy frontend
3. Test the application

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for JWT tokens |
| `NEXT_PUBLIC_API_URL` | ✅ | Your API deployment URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | WebSocket URL (usually same as API) |
| `NODE_ENV` | ⚠️ | Set to `production` |
| `JWT_EXPIRES_IN` | ❌ | Token expiration (default: 24h) |

## Troubleshooting

- **Build fails**: Check TypeScript errors with `pnpm check-types`
- **CORS errors**: Verify API URL in environment variables
- **Database issues**: Check connection string format
- **WebSocket issues**: Ensure API supports WebSocket connections

## Support

- 📖 [Full Deployment Guide](./DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/your-username/agile-hub/issues)
- 📚 [Vercel Docs](https://vercel.com/docs) 