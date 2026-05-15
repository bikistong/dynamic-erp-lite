const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Database Health Check
app.get('/api/health/db', async (req, res) => {
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      message: 'Database connection is working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Root API info
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Dynamic ERP Lite API',
    version: '1.0.0',
    description: 'Cloud-based ERP system for traditional businesses and UMKM',
    endpoints: {
      health: '/api/health',
      database: '/api/health/db',
      inventory: '/api/inventory',
      purchasing: '/api/purchasing',
      sales: '/api/sales',
      accounting: '/api/accounting',
    },
  });
});

// ============================================
// MODULE ROUTES (akan di-import di sini)
// ============================================

// TODO: Import dan gunakan module routes
// const inventoryRoutes = require('./modules/inventory/routes');
// const purchasingRoutes = require('./modules/purchasing/routes');
// const salesRoutes = require('./modules/sales/routes');
// const accountingRoutes = require('./modules/accounting/routes');

// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/purchasing', purchasingRoutes);
// app.use('/api/sales', salesRoutes);
// app.use('/api/accounting', accountingRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Dynamic ERP Lite - Backend Server   ║
╚═══════════════════════════════════════╝

📌 Server running at: http://localhost:${PORT}
🔍 Health Check: http://localhost:${PORT}/api/health
💾 Database: http://localhost:${PORT}/api/health/db

Environment: ${process.env.NODE_ENV || 'development'}
Ready to handle requests... ✓
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
