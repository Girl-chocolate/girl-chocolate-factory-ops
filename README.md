# Girl Chocolate Factory Ops

A complete Cloudflare Pages + Workers + D1 backend for supplement inventory management. Built as a Shopify embedded app with custom Girl Chocolate branding.

## Architecture

This application consists of:

- **Frontend**: React 18 with Vite, React Router, TailwindCSS
- **Backend**: Cloudflare Workers (API functions)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (document uploads)
- **Hosting**: Cloudflare Pages

## Project Structure

```
girl-chocolate-factory-ops/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx        # Overview & key metrics
│   │   ├── Supplements.jsx      # Inventory management
│   │   ├── Orders.jsx           # Purchase order tracking
│   │   └── BatchCalculator.jsx  # Production batch calculator
│   ├── App.jsx                  # Main router & layout
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── functions/
│   └── api/
│       ├── supplements.js       # GET all, POST new
│       ├── supplements/[id].js  # GET, PUT, DELETE single
│       ├── documents.js         # GET by supplement, POST new
│       ├── documents/[id].js    # DELETE
│       ├── orders.js            # GET all, POST new
│       ├── orders/[id].js       # GET, PUT (status/receive), DELETE
│       ├── batch/calculate.js   # POST - calculate batch requirements
│       └── stats.js             # GET - dashboard metrics
├── schema.sql                   # D1 database schema
├── wrangler.toml                # Cloudflare config
├── vite.config.js               # Frontend build config
├── tailwind.config.js           # Custom color theme
├── postcss.config.js            # CSS processing
├── package.json                 # Dependencies
├── index.html                   # HTML entry point
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Installation

1. Clone the repository:
```bash
cd girl-chocolate-factory-ops
npm install
```

2. Set up Cloudflare:
```bash
wrangler login
```

3. Create D1 database:
```bash
wrangler d1 create girl-chocolate-db
```

4. Update `wrangler.toml` with your database ID (copy from output above)

5. Run migrations:
```bash
npm run db:migrate
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

This starts:
- Vite dev server on `http://localhost:5173`
- Wrangler with D1 on `http://localhost:8787`

### Production Build

Build the application:
```bash
npm run build
```

Deploy to Cloudflare Pages:
```bash
npm run deploy
```

## API Endpoints

All endpoints return JSON responses with appropriate HTTP status codes.

### Supplements

**GET /api/supplements**
- List all supplements with supplier details
- Response: Array of supplement objects

**POST /api/supplements**
- Create new supplement
- Body: `{ name, supplier_id?, unit_price?, on_hand_kg?, low_stock_threshold? }`
- Response: Created supplement object

**GET /api/supplements/[id]**
- Get single supplement details
- Response: Supplement object

**PUT /api/supplements/[id]**
- Update supplement (all fields optional)
- Body: `{ name?, supplier_id?, unit_price?, on_hand_kg?, incoming_kg?, low_stock_threshold? }`
- Response: Updated supplement object

**DELETE /api/supplements/[id]**
- Delete supplement (cascades to documents, batch recipes, order items)
- Response: `{ success: true }`

### Documents

**GET /api/documents?supplement_id=[id]**
- List documents, optionally filtered by supplement
- Response: Array of document objects

**POST /api/documents**
- Create new document reference
- Body: `{ supplement_id, name, file_key?, link_url?, doc_type? }`
- Response: Created document object

**DELETE /api/documents/[id]**
- Delete document (removes from R2 if file attached)
- Response: `{ success: true }`

### Purchase Orders

**GET /api/orders**
- List all orders with items and supplier details
- Response: Array of order objects with nested items

**POST /api/orders**
- Create new purchase order
- Body: `{ supplier_id?, expected_date?, notes?, items: [{ supplement_id, quantity_kg, unit_price? }] }`
- Response: Created order with items

**GET /api/orders/[id]**
- Get single order with items
- Response: Order object with nested items

**PUT /api/orders/[id]**
- Update order (status, date, notes, or receive items)
- Body: `{ status?, expected_date?, notes?, received_items?: [{ item_id, received_kg }] }`
- When items received: auto-updates supplement on_hand_kg
- Response: Updated order object

**DELETE /api/orders/[id]**
- Delete order (cascades to order items)
- Response: `{ success: true }`

### Batch Calculator

**POST /api/batch/calculate**
- Calculate ingredient requirements for production batch
- Body: `{ pouches: number }`
- Returns breakdown for each recipe ingredient with:
  - `net_needed_kg`: Total kg required (based on dosage × squares × pouches)
  - `to_order_kg`: Amount to order (net_needed - on_hand, minimum 0)
  - `material_cost`: Total cost for this ingredient
- Response: Full breakdown with totals

### Stats

**GET /api/stats**
- Get dashboard metrics
- Response:
```json
{
  "inventory_value": number,
  "unique_ingredients": number,
  "low_stock_alerts": number,
  "low_stock_items": [{ id, name, on_hand_kg, low_stock_threshold }],
  "pending_orders": number,
  "total_incoming_kg": number
}
```

## Database Schema

### Suppliers
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT)
- `website` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### Supplements
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `supplier_id` (TEXT FOREIGN KEY)
- `unit_price` (REAL)
- `on_hand_kg` (REAL)
- `incoming_kg` (REAL)
- `low_stock_threshold` (REAL)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### Documents
- `id` (TEXT PRIMARY KEY)
- `supplement_id` (TEXT FOREIGN KEY) - ON DELETE CASCADE
- `name` (TEXT)
- `file_key` (TEXT) - R2 file key if uploaded
- `link_url` (TEXT) - External URL if linked
- `doc_type` (TEXT) - 'file' or 'link'
- `created_at` (TEXT)

### Purchase Orders
- `id` (TEXT PRIMARY KEY)
- `supplier_id` (TEXT FOREIGN KEY)
- `status` (TEXT) - 'pending' or 'received'
- `order_date` (TEXT)
- `expected_date` (TEXT)
- `notes` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### Order Items
- `id` (TEXT PRIMARY KEY)
- `order_id` (TEXT FOREIGN KEY) - ON DELETE CASCADE
- `supplement_id` (TEXT FOREIGN KEY)
- `quantity_kg` (REAL)
- `unit_price` (REAL)
- `received_kg` (REAL)
- `created_at` (TEXT)

### Batch Recipes
- `id` (TEXT PRIMARY KEY)
- `supplement_id` (TEXT FOREIGN KEY) - ON DELETE CASCADE
- `dosage_per_square_g` (REAL)
- `created_at` (TEXT)
- `updated_at` (TEXT)

## Features

### Dashboard
- Real-time inventory value calculation
- Low stock alerts with visual indicators
- Pending order count
- Total incoming shipment weight

### Inventory Management
- Create/edit/delete supplements
- Track on-hand vs. incoming quantities
- Set custom low stock thresholds
- View inventory value per item
- Linked documents (specs, certificates, etc.)

### Purchase Orders
- Create orders with multiple line items
- Track expected delivery dates
- Receive partial shipments
- Auto-update inventory on receipt
- Order status tracking

### Batch Calculator
- Calculate ingredient needs for production runs
- Based on dosage per chocolate square (8 per pouch)
- Shows material costs
- Recommends order quantities
- Real-time inventory consideration

### Custom Branding
- Girl Chocolate themed colors:
  - Chocolate browns: 50-950 spectrum
  - Rose accents: 50-900 spectrum
- Responsive design (mobile-first)
- Tailwind CSS for styling

## Seeded Data

The database comes pre-populated with:

**Suppliers:**
- HUIR Biological
- NutriCargo
- Green Jeeva LLC
- Prescribed For Life

**Supplements:**
- DIM (Diindolylmethane)
- Red Raspberry Leaf Extract Powder 4:1
- Ashwagandha Root Powder Extract 4:1
- Black Pepper Extract
- Vitamin B6 (Pyridoxal-5-phosphate)
- Magnesium Glycinate Powder
- Chamomile Flower Extract Powder 10:1

**Batch Recipes:**
- All 7 supplements with dosages configured
- Magnesium: 0.3g per square
- Chamomile: 0.2g per square
- Other ingredients: 0.1-0.005g per square

## Deployment

### To Cloudflare Pages

1. Build the app:
```bash
npm run build
```

2. Deploy:
```bash
npm run deploy
```

3. Configure environment:
   - Set up D1 database binding
   - Set up R2 bucket binding (DOCS_BUCKET)
   - Enable Worker access

### Environment Setup

Create `.env` for local development (not committed):
```
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## Troubleshooting

**Database connection issues:**
```bash
wrangler d1 info girl-chocolate-db
wrangler d1 execute girl-chocolate-db --file=./schema.sql --local
```

**R2 bucket not found:**
```bash
wrangler r2 bucket create girl-chocolate-docs
```

**Local dev API errors:**
- Ensure wrangler dev is running on port 8787
- Check vite proxy config in vite.config.js

**Pages deployment issues:**
- Verify dist/ folder is created: `ls dist/`
- Check wrangler.toml pages_build_output_dir
- Review build logs in Cloudflare dashboard

## Development Notes

- API functions auto-generate UUIDs for new records
- All dates stored as ISO 8601 in SQLite
- Inventory updates cascade through order receipts
- Low stock threshold is per-supplement, customizable
- Document deletion cleans up R2 files

## Future Enhancements

- Authentication & user roles
- Batch history & production logs
- Supplier performance analytics
- Reorder automation
- Email notifications for low stock
- CSV export for inventory reports
- Integration with e-commerce platforms

## License

Proprietary - Girl Chocolate Factory Operations
