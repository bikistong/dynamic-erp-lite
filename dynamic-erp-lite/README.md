# Dynamic ERP Lite - Backend API

Cloud-based ERP system for traditional businesses and UMKM. Built with Node.js, Express, Prisma, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm atau yarn
- Supabase account (free at supabase.com)

### 1. Setup Environment

```bash
# Clone atau extract folder ini
cd dynamic-erp-lite

# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan isi DATABASE_URL dengan Supabase connection string
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Push Prisma schema ke Supabase
npm run prisma:push

# (Optional) Open Prisma Studio untuk lihat data
npm run prisma:studio
```

### 4. Run Server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📖 API Endpoints

### Health Checks

```
GET /api/health
→ Check if server is running

GET /api/health/db
→ Check if database connection is working

GET /api
→ API info dan daftar endpoints
```

### Modules (In Development)

- `/api/inventory` - Item & Stock Management
- `/api/purchasing` - Purchase Orders & Receipts
- `/api/sales` - Sales Invoices
- `/api/accounting` - Journal & Ledger

## 📁 Project Structure

```
dynamic-erp-lite/
├── src/
│   ├── server.js          # Express server & routes
│   ├── modules/
│   │   ├── inventory/     # Inventory module (TODO)
│   │   ├── purchasing/    # Purchasing module (TODO)
│   │   ├── sales/         # Sales module (TODO)
│   │   └── accounting/    # Accounting module (TODO)
│   └── shared/
│       ├── db/            # Database utilities (TODO)
│       ├── journal/       # Journal engine (TODO)
│       └── utils/         # Shared utilities (TODO)
├── prisma/
│   └── schema.prisma      # Database schema
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Available Scripts

```bash
npm start                 # Run server (production)
npm run dev              # Run server with auto-reload (development)
npm run prisma:push      # Push schema to database
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Open Prisma Studio (GUI)
```

## 🗄️ Database Setup with Supabase

1. Create account at supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy URI (not psql)
5. Paste to DATABASE_URL in .env

**Example:**
```
DATABASE_URL="postgresql://postgres:MyPassword123@db.abcdef123.supabase.co:5432/postgres"
```

## 📚 Database Schema

### Master Data

- **ChartOfAccounts**: Account codes (1000, 2000, etc)
- **Item**: Product/inventory items
- **Customer**: Customer information
- **Supplier**: Supplier information

### Transactions

- **PurchaseOrder**: Purchase orders from suppliers
- **PurchaseReceipt**: Goods received notes
- **SalesInvoice**: Sales invoices to customers

### Accounting

- **Journal**: Journal entries (manual & auto)
- **JournalLine**: Debit/credit lines in journal
- **GeneralLedger**: Posting results

### Inventory

- **StockMovement**: Stock in/out tracking

## 🔐 Environment Variables

Create `.env` file with:

```
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Server
PORT=3000
NODE_ENV=development
```

**IMPORTANT:** Never commit `.env` to Git! It's in `.gitignore`.

## 🐛 Troubleshooting

### Error: "Could not connect to database"
- Check DATABASE_URL in .env
- Verify Supabase project is created
- Check internet connection

### Error: "authentication failed"
- Check password in .env
- Reset database password in Supabase
- Copy connection string again

### Error: "module not found"
- Run `npm install` again
- Delete node_modules and package-lock.json, reinstall

## 📝 Development Notes

### Adding New Module

1. Create folder in `src/modules/[module-name]`
2. Create routes, controllers, services as needed
3. Import routes in `src/server.js`
4. Test with health check first

### Database Migrations

After changing `prisma/schema.prisma`:

```bash
npm run prisma:push
```

This will:
- Validate schema syntax
- Compare with current database
- Create/update tables
- Generate Prisma client

### Prisma Studio

To browse/edit data visually:

```bash
npm run prisma:studio
```

Opens GUI at http://localhost:5555

## 🚀 Deployment

### To Vercel

1. Push code to GitHub
2. Create new project on vercel.com
3. Connect GitHub repo
4. Set environment variables (DATABASE_URL)
5. Deploy!

### To Heroku

```bash
# Login
heroku login

# Create app
heroku create dynamic-erp-lite

# Set environment
heroku config:set DATABASE_URL="postgresql://..."

# Deploy
git push heroku main
```

## 📚 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Supabase + Vercel (recommended)

## 📖 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

## 📝 License

ISC

## ✍️ Notes

This is SPRINT 1 - Core Engine Phase.

**Next Steps:**
- SPRINT 2: Inventory Module
- SPRINT 3: Purchasing Module
- SPRINT 4: Sales Module
- SPRINT 5: Accounting Module

---

**Happy Coding! 🚀**
