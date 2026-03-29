# Deployment Guide

Complete step-by-step guide to deploy Girl Chocolate Factory Ops to Cloudflare.

## Prerequisites

1. Cloudflare account (free tier sufficient for small operations)
2. Node.js 16+ installed
3. Wrangler CLI installed: `npm install -g wrangler@latest`
4. Git (recommended)

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate and saves your credentials locally.

## Step 2: Create D1 Database

```bash
wrangler d1 create girl-chocolate-db
```

Copy the database ID from the output. You'll need this for the next step.

## Step 3: Update wrangler.toml

Edit `wrangler.toml` and replace the `database_id` placeholder:

```toml
[[d1_databases]]
binding = "DB"
database_name = "girl-chocolate-db"
database_id = "your-database-id-here"  # Replace this
```

## Step 4: Create R2 Bucket

```bash
wrangler r2 bucket create girl-chocolate-docs
```

This bucket stores uploaded documents.

## Step 5: Initialize Database Schema

Run the migration to create tables:

```bash
npm run db:migrate
```

Verify the migration worked:

```bash
wrangler d1 execute girl-chocolate-db --command "SELECT COUNT(*) as supplement_count FROM supplements;"
```

You should see 7 supplements in the output.

## Step 6: Build the Frontend

```bash
npm run build
```

This creates the `dist/` folder with production-optimized assets.

## Step 7: Deploy to Cloudflare Pages

### Option A: Via Wrangler (Recommended)

```bash
npm run deploy
```

Or manually:

```bash
wrangler pages deploy dist
```

### Option B: Via GitHub Integration

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/girl-chocolate-factory-ops.git
git push -u origin main
```

2. In Cloudflare Dashboard:
   - Go to Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Deploy

## Step 8: Configure Environment & Bindings

After deployment, you may need to manually set up bindings in the Cloudflare dashboard:

1. Go to your Pages project
2. Settings → Functions → D1 database bindings
3. Add binding:
   - Variable name: `DB`
   - D1 database: `girl-chocolate-db`

4. Settings → Functions → R2 bucket bindings
5. Add binding:
   - Variable name: `DOCS_BUCKET`
   - R2 bucket: `girl-chocolate-docs`

## Step 9: Test the Deployment

Once deployed, test the API:

```bash
# Replace YOUR_DOMAIN with your Cloudflare Pages domain
curl https://YOUR_DOMAIN.pages.dev/api/stats
```

You should get a JSON response with stats.

## Local Development

To test locally before deployment:

```bash
npm run dev
```

This runs:
- Vite dev server on http://localhost:5173
- Wrangler with local D1 on http://localhost:8787

## Troubleshooting

### Database Issues

**"Cannot find binding DB"**
- Ensure wrangler.toml has the correct `database_id`
- Verify the database exists: `wrangler d1 list`
- In production, check Pages project settings for D1 binding

**Migration fails**
```bash
# Clear local DB and retry
rm -f .wrangler/state/d1/
npm run db:migrate
```

**"Table does not exist" when querying**
- Confirm schema was applied: `npm run db:migrate`
- Check table names match exactly (case-sensitive)

### Deployment Issues

**"Build failed"**
- Check build logs in Cloudflare Dashboard
- Ensure `dist/` folder is created: `npm run build && ls dist/`
- Verify Node version: `node --version`

**"Pages deploy times out"**
- Build locally first: `npm run build`
- Check dist/ size: `du -sh dist/`
- If >25MB, optimize assets or use Pages with functions

**API returns 404**
- Verify Pages project has Worker access enabled
- Check function files are in `functions/api/`
- Use exact endpoint paths (case-sensitive on Linux)

### CORS Issues

If frontend on different domain than API:

In your API functions, add CORS headers:

```javascript
new Response(JSON.stringify(data), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  },
})
```

## Production Checklist

Before going live:

- [ ] Database migrated successfully
- [ ] All API endpoints tested and working
- [ ] Frontend builds without errors
- [ ] Pages deployment completed
- [ ] D1 and R2 bindings configured
- [ ] Test low-stock alerts functionality
- [ ] Verify batch calculator accuracy
- [ ] Check order receipt updates inventory
- [ ] Test with real supplement data
- [ ] Set up monitoring/alerts
- [ ] Document any custom configurations

## Monitoring & Logs

### View deployment logs:
```bash
wrangler pages deployment list
wrangler pages deployment info <deployment-id>
```

### View D1 query logs:
```bash
wrangler d1 execute girl-chocolate-db --command "SELECT * FROM supplements LIMIT 1;"
```

### Monitor Pages analytics:
- Go to Cloudflare Dashboard → Pages → Your Project → Analytics

## Scaling & Limits

**D1 Database:**
- Reads: 100,000/day (free tier)
- Writes: 1,000/day (free tier)
- Storage: 5MB included

**R2 Storage:**
- $0.15/GB stored after 1GB free

**Pages:**
- 500 deployments/month
- Unlimited bandwidth
- 50,000 function invocations/day

For higher volumes, upgrade to paid plans.

## Rollback

To revert to a previous deployment:

```bash
wrangler pages deployment list
wrangler pages rollback --deployment-id <previous-deployment-id>
```

## Updating the Application

After making changes:

```bash
npm run build
npm run deploy
```

To update database schema:

```bash
# Edit schema.sql with your changes
npm run db:migrate
```

## Support

- Cloudflare Docs: https://developers.cloudflare.com/
- D1 Documentation: https://developers.cloudflare.com/d1/
- Pages Documentation: https://developers.cloudflare.com/pages/
- Workers Documentation: https://developers.cloudflare.com/workers/

## Security Notes

1. Never commit `.env` files with real credentials
2. Use Cloudflare's built-in authentication for APIs
3. Set appropriate CORS policies
4. Validate all user inputs in API functions
5. Use HTTPS only in production (automatic with Cloudflare)
6. Regularly backup D1 database (via manual exports)
7. Monitor R2 bucket for unauthorized access

## Cost Estimation

For a small operation (assuming modest usage):

- **D1 Database**: Free tier usually sufficient
- **R2 Bucket**: ~$0.15-0.50/month
- **Pages**: Free tier sufficient
- **Workers**: Included with Pages

**Total**: ~$0 to $5/month depending on usage

Upgrade to paid plans as you scale.
