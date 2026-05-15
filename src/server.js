const express = require('express');
const cors = require('cors');
const prisma = require('./shared/db/prisma');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// HEALTH CHECK ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    // Test database connection
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
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: {
        GET: '/api/health',
        GET_DB: '/api/health/db'
      },
      inventory: {
        GET_ITEMS: 'GET /api/inventory/items',
        CREATE_ITEM: 'POST /api/inventory/items',
        GET_ITEM: 'GET /api/inventory/items/:id',
        UPDATE_ITEM: 'PUT /api/inventory/items/:id',
        DELETE_ITEM: 'DELETE /api/inventory/items/:id'
      }
    }
  });
});

// ==========================================
// IMPORT MODULE ROUTES
// ==========================================

const inventoryRoutes = require('./modules/inventory/routes');

// ==========================================
// REGISTER MODULE ROUTES
// ==========================================

app.use('/api/inventory', inventoryRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   Dynamic ERP Lite - Backend Server   ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`📌 Server running at: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`💾 Database: http://localhost:${PORT}/api/health/db`);
    console.log(`📚 API Info: http://localhost:${PORT}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Ready to handle requests... ✓');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
};

// Start server
startServer();

module.exports = app;