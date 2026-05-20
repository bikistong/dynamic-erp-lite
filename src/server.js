const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./shared/swagger/spec');
const prisma = require('./shared/db/prisma');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Dynamic ERP Lite — API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dynamic ERP Lite API',
    version: '1.0.0',
    modules: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        changePassword: 'PUT /api/auth/me/password',
        users: 'GET /api/auth/users (admin)',
        updateUser: 'PUT /api/auth/users/:id (admin)',
      },
      dashboard: { summary: 'GET /api/dashboard/summary' },
      inventory: {
        items: 'GET/POST /api/inventory/items',
        item: 'GET/PUT/DELETE /api/inventory/items/:id',
        stockMovements: 'GET /api/inventory/stock-movements',
        adjustment: 'POST /api/inventory/stock-adjustments',
      },
      purchasing: {
        suppliers: 'GET/POST /api/purchasing/suppliers',
        supplier: 'GET/PUT/DELETE /api/purchasing/suppliers/:id',
        orders: 'GET/POST /api/purchasing/orders',
        order: 'GET /api/purchasing/orders/:id',
        submitOrder: 'PUT /api/purchasing/orders/:id/submit',
        cancelOrder: 'PUT /api/purchasing/orders/:id/cancel',
        receipts: 'GET/POST /api/purchasing/receipts',
        receipt: 'GET /api/purchasing/receipts/:id',
        payments: 'GET/POST /api/purchasing/payments',
        payment: 'GET /api/purchasing/payments/:id',
        apSummary: 'GET /api/purchasing/ap-summary',
      },
      sales: {
        customers: 'GET/POST /api/sales/customers',
        customer: 'GET/PUT/DELETE /api/sales/customers/:id',
        invoices: 'GET/POST /api/sales/invoices',
        invoice: 'GET /api/sales/invoices/:id',
        postInvoice: 'PUT /api/sales/invoices/:id/post',
        payInvoice: 'PUT /api/sales/invoices/:id/pay',
        cancelInvoice: 'PUT /api/sales/invoices/:id/cancel',
        ppnSummary: 'GET /api/sales/ppn-summary',
      },
      accounting: {
        accounts: 'GET/POST /api/accounting/accounts',
        account: 'GET/PUT/DELETE /api/accounting/accounts/:id',
        seedAccounts: 'POST /api/accounting/accounts/seed',
        journals: 'GET/POST /api/accounting/journals',
        journal: 'GET /api/accounting/journals/:id',
        postJournal: 'PUT /api/accounting/journals/:id/post',
        ledger: 'GET /api/accounting/ledger',
        trialBalance: 'GET /api/accounting/reports/trial-balance',
        profitLoss: 'GET /api/accounting/reports/profit-loss',
        balanceSheet: 'GET /api/accounting/reports/balance-sheet',
      },
    }
  });
});

const authRoutes = require('./modules/auth/routes');
const dashboardRoutes = require('./modules/dashboard/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const purchasingRoutes = require('./modules/purchasing/routes');
const salesRoutes = require('./modules/sales/routes');
const accountingRoutes = require('./modules/accounting/routes');
const productionRoutes = require('./modules/production/routes');
const bankRoutes = require('./modules/bank/routes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/bank', bankRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected');
  } catch (error) {
    console.warn('⚠ Database connection failed (server will still run)');
  }

  app.listen(PORT, () => {
    console.log('Server running at http://localhost:' + PORT);
    console.log('Ready! ✓');
  });
};

startServer();

module.exports = app;
