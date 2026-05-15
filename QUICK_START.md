# 🚀 QUICK START GUIDE

Folder ini adalah **Dynamic ERP Lite Backend** yang siap di-extract, push ke GitHub, dan connect ke Supabase.

## ⚡ 5 LANGKAH CEPAT

### 1. Extract Folder
```bash
# Folder ini sudah siap, tinggal extract
unzip dynamic-erp-lite-starter.zip
cd dynamic-erp-lite
```

### 2. Copy .env
```bash
cp .env.example .env
```

### 3. Get Supabase Connection String
```
Buka supabase.com:
1. Login/Signup
2. Create new project
3. Settings → Database → Connection string → Copy URI
4. Paste ke .env sebagai DATABASE_URL
```

### 4. Install & Setup
```bash
npm install
npm run prisma:push
```

### 5. Run Server
```bash
npm run dev
# Server running at http://localhost:3000
```

## ✅ Verify Setup

```bash
# Check server
curl http://localhost:3000/api/health

# Check database
curl http://localhost:3000/api/health/db

# Should return JSON with status "ok"
```

## 📤 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - SPRINT 1"
git remote add origin https://github.com/yourusername/dynamic-erp-lite.git
git branch -M main
git push -u origin main
```

## 📋 What's Included

✅ Express.js server setup
✅ Prisma schema (all models for SPRINT 1-5)
✅ Database models (items, customers, invoices, journals, etc)
✅ Health check endpoints
✅ Folder structure (modular)
✅ Environment configuration (.env.example)
✅ Git ignore rules
✅ Utility functions
✅ Journal engine skeleton
✅ Documentation

❌ Not included (built in SPRINT 2-5):
- Inventory endpoints
- Purchasing endpoints
- Sales endpoints
- Accounting endpoints

## 🔄 Next Steps

1. **SPRINT 2:** Build Inventory Module endpoints
2. **SPRINT 3:** Build Purchasing Module endpoints
3. **SPRINT 4:** Build Sales Module endpoints
4. **SPRINT 5:** Build Accounting Module endpoints

## 📖 Documentation

- `README.md` - Full documentation
- `.env.example` - Environment variables template
- `prisma/schema.prisma` - Database schema (all models ready)

## 🆘 Troubleshooting

**"Could not connect to database"**
- Check .env DATABASE_URL
- Verify Supabase project is created
- Check internet connection

**"npm install fails"**
- Delete node_modules and package-lock.json
- Run npm install again

**"Port 3000 in use"**
- Change PORT in .env to 3001 or 3002
- Or kill the process using port 3000

## 🎯 File Structure

```
dynamic-erp-lite/
├── src/
│   ├── server.js                 # Main Express app
│   ├── modules/                  # Feature modules (TODO)
│   │   ├── inventory/
│   │   ├── purchasing/
│   │   ├── sales/
│   │   └── accounting/
│   └── shared/
│       ├── db/                   # Database utilities
│       ├── journal/              # Journal engine
│       └── utils/                # Helper functions
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── README.md                      # Full documentation
```

## 📚 Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Cloud database hosting

## 🎓 Learning Path

1. Understand folder structure
2. Review prisma/schema.prisma (all tables ready)
3. Understand server.js (Express basics)
4. Start building SPRINT 2 (Inventory Module)
5. Build other modules following same pattern

## 🆘 Need Help?

Refer to:
- Full guides in /DOCS folder (if available)
- README.md for detailed information
- Prisma docs: prisma.io/docs
- Express docs: expressjs.com

---

**You're all set! Ready to code? 🚀**

```bash
npm run dev
```

Happy coding! 💻
