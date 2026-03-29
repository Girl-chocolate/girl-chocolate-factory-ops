# Quick Start Guide

Get Girl Chocolate Factory Ops running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Authenticate with Cloudflare

```bash
wrangler login
```

## 3. Create Database

```bash
wrangler d1 create girl-chocolate-db
```

Copy the database ID from output.

## 4. Update wrangler.toml

Replace `database_id = "placeholder-will-update"` with your ID:

```bash
# Edit wrangler.toml
sed -i 's/placeholder-will-update/YOUR_DATABASE_ID/' wrangler.toml
```

## 5. Initialize Database

```bash
npm run db:migrate
```

## 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

## 7. Test the App

- Navigate to "Inventory" - see 7 pre-loaded supplements
- Go to "Batch Calc" - enter 100 pouches, calculate requirements
- Check "Dashboard" - view metrics and low stock alerts
- Create a "Purchase Order" - track incoming shipments

## What You Get

✅ Complete inventory management system
✅ 7 pre-loaded supplements with recipes
✅ Batch calculator for production planning
✅ Purchase order tracking
✅ Dashboard with real-time metrics
✅ Custom Girl Chocolate branding
✅ Fully functional API
✅ D1 database with seeded data

## Project Structure

```
src/               - React frontend
├── pages/         - 4 main pages
├── App.jsx        - Router & navigation
└── index.css      - Global styles

functions/api/     - Cloudflare Workers (API)
├── supplements    - Inventory CRUD
├── documents      - File/link management
├── orders         - Purchase order tracking
├── batch/         - Production calculator
└── stats          - Dashboard metrics

schema.sql         - Database schema + seed data
wrangler.toml      - Cloudflare config
tailwind.config.js - Custom colors
vite.config.js     - Frontend build
```

## API Endpoints

All documented in README.md. Quick examples:

```bash
# List supplements
curl http://localhost:5173/api/supplements

# Calculate batch (100 pouches)
curl -X POST http://localhost:5173/api/batch/calculate \
  -H "Content-Type: application/json" \
  -d '{"pouches": 100}'

# Get stats
curl http://localhost:5173/api/stats
```

## Database

Pre-loaded with:
- 4 suppliers (HUIR, NutriCargo, Green Jeeva, Prescribed For Life)
- 7 supplements (DIM, Raspberry, Ashwagandha, Black Pepper, B6, Magnesium, Chamomile)
- 7 batch recipes with dosages configured

## Deployment

When ready to deploy to production:

```bash
npm run build
npm run deploy
```

See DEPLOYMENT.md for full instructions.

## Troubleshooting

**"Cannot find binding DB"**
```bash
# Verify wrangler.toml has correct database_id
grep database_id wrangler.toml
```

**"Table does not exist"**
```bash
# Re-run migrations
npm run db:migrate
```

**Port 5173 already in use?**
```bash
# Vite will auto-increment port
npm run dev
# Check output for actual port
```

## Next Steps

1. Customize supplement data (edit schema.sql seed data)
2. Add supplier details (emails, websites)
3. Create first purchase order
4. Upload documents/certificates
5. Test batch calculator with your recipes
6. Deploy to production

## Documentation

- Full API docs: README.md
- Deployment guide: DEPLOYMENT.md
- Database schema: schema.sql
- Custom theme: tailwind.config.js

## Support

Cloudflare Resources:
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/workers/

Let's go! Your inventory management system is ready. 🍫
