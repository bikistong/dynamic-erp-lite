const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Dynamic ERP Lite API',
    version: '1.0.0',
    description:
      'Cloud-based ERP system untuk bisnis tradisional dan UMKM.\n\n' +
      '**Cara pakai:**\n' +
      '1. Register atau Login untuk mendapatkan token\n' +
      '2. Klik tombol **Authorize** di atas, masukkan: `Bearer <token>`\n' +
      '3. Semua endpoint sudah bisa diakses',
    contact: { name: 'Dynamic ERP Lite' },
  },
  servers: [{ url: '/api', description: 'API Server' }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT. Contoh: `Bearer eyJhbGci...`',
      },
    },
    schemas: {
      // ── Common ──
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Validation failed' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 5 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },

      // ── Auth ──
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', example: 'budi@toko.com' },
          role: { type: 'string', enum: ['admin', 'staff'] },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Inventory ──
      Item: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sku: { type: 'string', example: 'BRG-001' },
          name: { type: 'string', example: 'Minyak Goreng 1L' },
          description: { type: 'string' },
          stock: { type: 'integer', example: 100 },
          uom: { type: 'string', example: 'botol' },
          purchasePrice: { type: 'number', example: 14000 },
          sellingPrice: { type: 'number', example: 18000 },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      StockMovement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          type: { type: 'string', enum: ['in', 'out', 'adjustment'] },
          quantity: { type: 'integer' },
          reference: { type: 'string' },
          referenceType: { type: 'string' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Purchasing ──
      Supplier: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'PT Sumber Makmur' },
          email: { type: 'string' },
          phone: { type: 'string', example: '08123456789' },
          address: { type: 'string' },
          city: { type: 'string', example: 'Jakarta' },
          active: { type: 'boolean' },
        },
      },
      PurchaseOrderLine: {
        type: 'object',
        properties: {
          itemId: { type: 'string' },
          quantity: { type: 'integer', example: 50 },
          unitPrice: { type: 'number', example: 14000 },
        },
      },
      PurchaseOrder: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          poNumber: { type: 'string', example: 'PO-20240115-1705290000' },
          supplierId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['draft', 'submitted', 'received', 'cancelled'] },
          totalAmount: { type: 'number' },
          notes: { type: 'string' },
        },
      },

      // ── Sales ──
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Toko Barokah' },
          email: { type: 'string' },
          phone: { type: 'string', example: '08987654321' },
          address: { type: 'string' },
          city: { type: 'string', example: 'Bandung' },
          active: { type: 'boolean' },
        },
      },
      SalesInvoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNo: { type: 'string', example: 'INV-20240115-1705290000' },
          customerId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['draft', 'posted', 'paid', 'cancelled'] },
          subtotal: { type: 'number', example: 1000000 },
          taxRate: { type: 'number', example: 11, description: 'PPN percentage' },
          taxAmount: { type: 'number', example: 110000 },
          totalAmount: { type: 'number', example: 1110000 },
          notes: { type: 'string' },
        },
      },

      // ── Accounting ──
      ChartOfAccounts: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string', example: '1100' },
          name: { type: 'string', example: 'Cash' },
          type: { type: 'string', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] },
          description: { type: 'string' },
          active: { type: 'boolean' },
        },
      },
      Journal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          journalNo: { type: 'string' },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['manual', 'auto'] },
          status: { type: 'string', enum: ['draft', 'posted'] },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: 'Token tidak ada atau tidak valid',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Data tidak ditemukan',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Input tidak valid',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  tags: [
    { name: 'Auth', description: 'Register, login, dan manajemen user' },
    { name: 'Dashboard', description: 'Ringkasan data bisnis' },
    { name: 'Inventory', description: 'Master barang dan pergerakan stok' },
    { name: 'Purchasing', description: 'Supplier, Purchase Order, penerimaan barang, dan pembayaran hutang' },
    { name: 'Sales', description: 'Customer, faktur penjualan, dan laporan PPN' },
    { name: 'Accounting', description: 'Chart of Accounts, jurnal, buku besar, dan laporan keuangan' },
    { name: 'Production', description: 'BOM, Job Order, dan proses produksi RM → FG' },
  ],

  paths: {
    // ================================================================
    // AUTH
    // ================================================================
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Daftar user baru',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Budi Santoso' },
                  email: { type: 'string', example: 'budi@toko.com' },
                  password: { type: 'string', minLength: 6, example: 'rahasia123' },
                  role: { type: 'string', enum: ['admin', 'staff'], default: 'staff' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Register berhasil, token dikembalikan' },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login dan dapatkan token JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'budi@toko.com' },
                  password: { type: 'string', example: 'rahasia123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil, token dikembalikan' },
          401: { description: 'Email atau password salah' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil user yang sedang login',
        responses: {
          200: { description: 'Data profil user' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me/password': {
      put: {
        tags: ['Auth'],
        summary: 'Ganti password sendiri',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password berhasil diganti' },
          401: { description: 'Password lama salah' },
        },
      },
    },
    '/auth/users': {
      get: {
        tags: ['Auth'],
        summary: 'List semua user (admin only)',
        responses: {
          200: { description: 'Daftar user' },
          403: { description: 'Bukan admin' },
        },
      },
    },
    '/auth/users/{id}': {
      put: {
        tags: ['Auth'],
        summary: 'Update role / status user (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'staff'] },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User diupdate' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ================================================================
    // DASHBOARD
    // ================================================================
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Ringkasan data bisnis',
        description:
          'Mengembalikan: total item, low stock, total customer/supplier, revenue bulan ini vs bulan lalu, PO pending, aktivitas terbaru.',
        responses: {
          200: { description: 'Data dashboard' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ================================================================
    // INVENTORY — ITEMS
    // ================================================================
    '/inventory/items': {
      get: {
        tags: ['Inventory'],
        summary: 'List semua item',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari berdasarkan nama atau SKU' },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar item dengan pagination' } },
      },
      post: {
        tags: ['Inventory'],
        summary: 'Tambah item baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'name', 'uom'],
                properties: {
                  sku: { type: 'string', example: 'BRG-001' },
                  name: { type: 'string', example: 'Minyak Goreng 1L' },
                  description: { type: 'string' },
                  uom: { type: 'string', example: 'botol' },
                  purchasePrice: { type: 'number', example: 14000 },
                  sellingPrice: { type: 'number', example: 18000 },
                  stock: { type: 'integer', default: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item berhasil dibuat' },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/inventory/items/{id}': {
      get: {
        tags: ['Inventory'],
        summary: 'Detail item + 20 pergerakan stok terakhir',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detail item' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Inventory'],
        summary: 'Update item',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  uom: { type: 'string' },
                  purchasePrice: { type: 'number' },
                  sellingPrice: { type: 'number' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Item diupdate' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Nonaktifkan item (soft delete)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Item dinonaktifkan' } },
      },
    },
    '/inventory/stock-movements': {
      get: {
        tags: ['Inventory'],
        summary: 'Riwayat pergerakan stok',
        parameters: [
          { name: 'itemId', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['in', 'out', 'adjustment'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar pergerakan stok' } },
      },
    },
    '/inventory/stock-adjustments': {
      post: {
        tags: ['Inventory'],
        summary: 'Penyesuaian stok manual',
        description: 'Gunakan quantity positif untuk tambah stok, negatif untuk kurangi stok.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId', 'quantity'],
                properties: {
                  itemId: { type: 'string' },
                  quantity: { type: 'integer', example: 10, description: 'Positif = tambah, negatif = kurangi' },
                  notes: { type: 'string', example: 'Koreksi setelah stock opname' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Penyesuaian stok berhasil' } },
      },
    },

    // ================================================================
    // PURCHASING — SUPPLIERS
    // ================================================================
    '/purchasing/suppliers': {
      get: {
        tags: ['Purchasing'],
        summary: 'List supplier',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar supplier' } },
      },
      post: {
        tags: ['Purchasing'],
        summary: 'Tambah supplier baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'PT Sumber Makmur' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  province: { type: 'string' },
                  postalCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Supplier dibuat' } },
      },
    },
    '/purchasing/suppliers/{id}': {
      get: {
        tags: ['Purchasing'],
        summary: 'Detail supplier + 10 PO terakhir',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail supplier' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
      put: {
        tags: ['Purchasing'],
        summary: 'Update supplier',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
                  address: { type: 'string' }, city: { type: 'string' }, active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Supplier diupdate' } },
      },
      delete: {
        tags: ['Purchasing'],
        summary: 'Nonaktifkan supplier',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Supplier dinonaktifkan' } },
      },
    },

    // ── Purchase Orders ──
    '/purchasing/orders': {
      get: {
        tags: ['Purchasing'],
        summary: 'List Purchase Order',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'submitted', 'received', 'cancelled'] } },
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar PO' } },
      },
      post: {
        tags: ['Purchasing'],
        summary: 'Buat Purchase Order baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                supplierId: 'supplier-id-disini',
                date: '2024-01-15',
                dueDate: '2024-02-15',
                notes: 'Pembelian bulanan',
                lines: [
                  { itemId: 'item-id-disini', quantity: 50, unitPrice: 14000 },
                  { itemId: 'item-id-lain', quantity: 30, unitPrice: 25000 },
                ],
              },
              schema: {
                type: 'object',
                required: ['supplierId', 'date', 'lines'],
                properties: {
                  supplierId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  dueDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                  lines: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['itemId', 'quantity', 'unitPrice'],
                      properties: {
                        itemId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1 },
                        unitPrice: { type: 'number', minimum: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'PO dibuat (status: draft)' } },
      },
    },
    '/purchasing/orders/{id}': {
      get: {
        tags: ['Purchasing'],
        summary: 'Detail PO + lines + jurnal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail PO' } },
      },
    },
    '/purchasing/orders/{id}/submit': {
      put: {
        tags: ['Purchasing'],
        summary: 'Submit PO (draft → submitted)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'PO disubmit' } },
      },
    },
    '/purchasing/orders/{id}/cancel': {
      put: {
        tags: ['Purchasing'],
        summary: 'Batalkan PO',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'PO dibatalkan' } },
      },
    },

    // ── Purchase Receipts ──
    '/purchasing/receipts': {
      get: {
        tags: ['Purchasing'],
        summary: 'List penerimaan barang (GRN)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar GRN' } },
      },
      post: {
        tags: ['Purchasing'],
        summary: 'Terima barang dari PO (otomatis tambah stok + jurnal)',
        description:
          'Membuat Goods Received Note.\n\n**Otomatis:**\n- Tambah stok item\n- Buat jurnal: Debit Inventory (1300), Credit AP (2100)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                poId: 'po-id-disini',
                date: '2024-01-20',
                notes: 'Barang diterima lengkap',
                lines: [{ itemId: 'item-id-disini', quantity: 50 }],
              },
              schema: {
                type: 'object',
                required: ['poId', 'date', 'lines'],
                properties: {
                  poId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                  lines: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['itemId', 'quantity'],
                      properties: {
                        itemId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Penerimaan barang berhasil' } },
      },
    },
    '/purchasing/receipts/{id}': {
      get: {
        tags: ['Purchasing'],
        summary: 'Detail GRN + stock movements + jurnal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail GRN' } },
      },
    },

    // ── AP Payments ──
    '/purchasing/payments': {
      get: {
        tags: ['Purchasing'],
        summary: 'List pembayaran hutang (AP)',
        parameters: [
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar pembayaran AP' } },
      },
      post: {
        tags: ['Purchasing'],
        summary: 'Bayar hutang ke supplier (otomatis jurnal)',
        description:
          '**Jurnal otomatis:**\n- Debit AP (2100)\n- Credit Cash/Bank (1100)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                supplierId: 'supplier-id-disini',
                date: '2024-01-25',
                amount: 700000,
                method: 'transfer',
                receiptId: 'receipt-id-opsional',
                reference: 'TRF-20240125-001',
                notes: 'Pembayaran invoice Januari',
              },
              schema: {
                type: 'object',
                required: ['supplierId', 'date', 'amount'],
                properties: {
                  supplierId: { type: 'string' },
                  receiptId: { type: 'string', description: 'Opsional — link ke GRN tertentu' },
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number', minimum: 0.01 },
                  method: { type: 'string', enum: ['cash', 'transfer', 'check'], default: 'cash' },
                  reference: { type: 'string', description: 'Nomor bukti transfer / cek' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Pembayaran berhasil dicatat' } },
      },
    },
    '/purchasing/payments/{id}': {
      get: {
        tags: ['Purchasing'],
        summary: 'Detail pembayaran AP + jurnal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail pembayaran' } },
      },
    },
    '/purchasing/ap-summary': {
      get: {
        tags: ['Purchasing'],
        summary: 'Ringkasan hutang (AP) — total outstanding vs total dibayar',
        parameters: [{ name: 'supplierId', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Ringkasan AP' } },
      },
    },

    // ================================================================
    // SALES — CUSTOMERS
    // ================================================================
    '/sales/customers': {
      get: {
        tags: ['Sales'],
        summary: 'List customer',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar customer' } },
      },
      post: {
        tags: ['Sales'],
        summary: 'Tambah customer baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Toko Barokah' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  province: { type: 'string' },
                  postalCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Customer dibuat' } },
      },
    },
    '/sales/customers/{id}': {
      get: {
        tags: ['Sales'],
        summary: 'Detail customer + 10 invoice terakhir',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail customer' } },
      },
      put: {
        tags: ['Sales'],
        summary: 'Update customer',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
                  address: { type: 'string' }, city: { type: 'string' }, active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Customer diupdate' } },
      },
      delete: {
        tags: ['Sales'],
        summary: 'Nonaktifkan customer',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer dinonaktifkan' } },
      },
    },

    // ── Sales Invoices ──
    '/sales/invoices': {
      get: {
        tags: ['Sales'],
        summary: 'List faktur penjualan',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'posted', 'paid', 'cancelled'] } },
          { name: 'customerId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar faktur' } },
      },
      post: {
        tags: ['Sales'],
        summary: 'Buat faktur penjualan baru',
        description:
          'Membuat faktur dengan status **draft**.\n\n`taxRate` default **11%** (PPN Indonesia). Set ke `0` untuk transaksi non-PKP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                customerId: 'customer-id-disini',
                date: '2024-01-15',
                dueDate: '2024-02-15',
                taxRate: 11,
                notes: 'Penjualan Januari',
                lines: [
                  { itemId: 'item-id-disini', quantity: 10, unitPrice: 18000 },
                ],
              },
              schema: {
                type: 'object',
                required: ['customerId', 'date', 'lines'],
                properties: {
                  customerId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  dueDate: { type: 'string', format: 'date' },
                  taxRate: { type: 'number', minimum: 0, maximum: 100, default: 11, description: 'PPN %' },
                  notes: { type: 'string' },
                  lines: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['itemId', 'quantity', 'unitPrice'],
                      properties: {
                        itemId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1 },
                        unitPrice: { type: 'number', minimum: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Faktur dibuat (status: draft). Field: subtotal, taxAmount, totalAmount' } },
      },
    },
    '/sales/invoices/{id}': {
      get: {
        tags: ['Sales'],
        summary: 'Detail faktur + lines + jurnal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail faktur' } },
      },
    },
    '/sales/invoices/{id}/post': {
      put: {
        tags: ['Sales'],
        summary: 'Posting faktur (draft → posted)',
        description:
          '**Otomatis:**\n- Kurangi stok item\n- Buat jurnal:\n  - Debit AR (1200) = total incl. PPN\n  - Credit Revenue (4100) = subtotal (DPP)\n  - Credit Tax Payable (2200) = PPN terutang\n  - Debit COGS (5100), Credit Inventory (1300)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Faktur diposting' }, 400: { description: 'Stok tidak cukup atau bukan draft' } },
      },
    },
    '/sales/invoices/{id}/pay': {
      put: {
        tags: ['Sales'],
        summary: 'Tandai faktur sebagai lunas (posted → paid)',
        description: '**Jurnal:** Debit Cash (1100), Credit AR (1200)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Faktur ditandai lunas' } },
      },
    },
    '/sales/invoices/{id}/cancel': {
      put: {
        tags: ['Sales'],
        summary: 'Batalkan faktur',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Faktur dibatalkan' } },
      },
    },
    '/sales/ppn-summary': {
      get: {
        tags: ['Sales'],
        summary: 'Laporan PPN terutang per periode',
        description: 'Rekap DPP, PPN, dan total tagihan untuk laporan SPT Masa PPN.',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-01-01' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-01-31' },
        ],
        responses: { 200: { description: 'Rekap PPN' } },
      },
    },

    // ================================================================
    // ACCOUNTING
    // ================================================================
    '/accounting/accounts': {
      get: {
        tags: ['Accounting'],
        summary: 'List Chart of Accounts',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar akun' } },
      },
      post: {
        tags: ['Accounting'],
        summary: 'Tambah akun baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'name', 'type'],
                properties: {
                  code: { type: 'string', example: '1150' },
                  name: { type: 'string', example: 'Kas Kecil' },
                  type: { type: 'string', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Akun dibuat' } },
      },
    },
    '/accounting/accounts/seed': {
      post: {
        tags: ['Accounting'],
        summary: 'Seed 17 akun default (admin only)',
        description:
          'Mengisi Chart of Accounts dengan akun-akun standar:\n\n' +
          '**Asset:** 1100 Cash, 1200 AR, 1300 Inventory, 1400 Prepaid, 1500 Fixed Assets\n\n' +
          '**Liability:** 2100 AP, 2200 Tax Payable, 2300 Accrued\n\n' +
          '**Equity:** 3100 Capital, 3200 Retained Earnings\n\n' +
          '**Revenue:** 4100 Sales Revenue, 4200 Other Income\n\n' +
          '**Expense:** 5100 COGS, 5200 Operating, 5300 Salary, 5400 Rent, 5500 Utilities',
        responses: { 201: { description: 'Akun default berhasil di-seed' }, 403: { description: 'Bukan admin' } },
      },
    },
    '/accounting/accounts/{id}': {
      get: {
        tags: ['Accounting'],
        summary: 'Detail akun',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail akun' } },
      },
      put: {
        tags: ['Accounting'],
        summary: 'Update akun',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] },
                  description: { type: 'string' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Akun diupdate' } },
      },
      delete: {
        tags: ['Accounting'],
        summary: 'Nonaktifkan akun',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Akun dinonaktifkan' } },
      },
    },
    '/accounting/journals': {
      get: {
        tags: ['Accounting'],
        summary: 'List jurnal',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'posted'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['manual', 'auto'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Daftar jurnal' } },
      },
      post: {
        tags: ['Accounting'],
        summary: 'Buat jurnal manual',
        description: 'Total debit harus sama dengan total credit.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                date: '2024-01-15',
                description: 'Bayar sewa kantor Januari',
                lines: [
                  { accountCode: '5400', debit: 5000000, credit: 0, description: 'Rent expense' },
                  { accountCode: '1100', debit: 0, credit: 5000000, description: 'Cash paid' },
                ],
              },
              schema: {
                type: 'object',
                required: ['date', 'description', 'lines'],
                properties: {
                  date: { type: 'string', format: 'date' },
                  description: { type: 'string' },
                  lines: {
                    type: 'array',
                    minItems: 2,
                    items: {
                      type: 'object',
                      required: ['accountCode'],
                      properties: {
                        accountCode: { type: 'string', example: '1100' },
                        debit: { type: 'number', minimum: 0, default: 0 },
                        credit: { type: 'number', minimum: 0, default: 0 },
                        description: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Jurnal dibuat (status: draft)' }, 400: { description: 'Debit ≠ Credit atau validasi gagal' } },
      },
    },
    '/accounting/journals/{id}': {
      get: {
        tags: ['Accounting'],
        summary: 'Detail jurnal + lines',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail jurnal' } },
      },
    },
    '/accounting/journals/{id}/post': {
      put: {
        tags: ['Accounting'],
        summary: 'Posting jurnal ke buku besar',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Jurnal diposting ke General Ledger' } },
      },
    },
    '/accounting/ledger': {
      get: {
        tags: ['Accounting'],
        summary: 'Buku Besar (General Ledger)',
        parameters: [
          { name: 'accountCode', in: 'query', schema: { type: 'string' }, example: '1100', description: 'Filter by kode akun' },
          { name: 'accountId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Entri buku besar' } },
      },
    },
    '/accounting/reports/trial-balance': {
      get: {
        tags: ['Accounting'],
        summary: 'Neraca Saldo (Trial Balance)',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Neraca saldo per akun + total debit/credit' } },
      },
    },
    '/accounting/reports/profit-loss': {
      get: {
        tags: ['Accounting'],
        summary: 'Laba Rugi (Profit & Loss)',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-01-01' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-12-31' },
        ],
        responses: { 200: { description: 'Pendapatan, beban, dan laba bersih' } },
      },
    },
    '/accounting/reports/balance-sheet': {
      get: {
        tags: ['Accounting'],
        summary: 'Neraca (Balance Sheet)',
        parameters: [
          { name: 'asOf', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-12-31', description: 'Per tanggal' },
        ],
        responses: { 200: { description: 'Aset, kewajiban, dan ekuitas' } },
      },
    },

    // ── Production ──
    '/production/boms': {
      get: {
        tags: ['Production'],
        summary: 'List BOM (Bill of Materials)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'finishedGoodId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List BOM' } },
      },
      post: {
        tags: ['Production'],
        summary: 'Buat BOM baru',
        description: 'Membuat Bill of Materials untuk item finished_good. Otomatis menonaktifkan BOM lama untuk FG yang sama.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['finishedGoodId', 'lines'],
                properties: {
                  finishedGoodId: { type: 'string', description: 'ID item dengan itemType = finished_good' },
                  description: { type: 'string', example: 'Resep standar produk A' },
                  lines: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['materialId', 'quantityPerUnit'],
                      properties: {
                        materialId: { type: 'string', description: 'ID item RM (raw_material)' },
                        quantityPerUnit: { type: 'number', example: 2.5, description: 'Jumlah RM per 1 unit FG' },
                        uom: { type: 'string', example: 'kg' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'BOM berhasil dibuat' } },
      },
    },
    '/production/boms/{id}': {
      get: {
        tags: ['Production'],
        summary: 'Detail BOM',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail BOM beserta lines' } },
      },
      put: {
        tags: ['Production'],
        summary: 'Update BOM',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  active: { type: 'boolean' },
                  lines: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        materialId: { type: 'string' },
                        quantityPerUnit: { type: 'number' },
                        uom: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'BOM berhasil diupdate' } },
      },
      delete: {
        tags: ['Production'],
        summary: 'Nonaktifkan BOM',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'BOM dinonaktifkan' } },
      },
    },
    '/production/job-orders': {
      get: {
        tags: ['Production'],
        summary: 'List Job Order',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'waiting_material', 'ready', 'completed', 'cancelled'] } },
          { name: 'salesInvoiceId', in: 'query', schema: { type: 'string' } },
          { name: 'finishedGoodId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List job order' } },
      },
    },
    '/production/job-orders/{id}': {
      get: {
        tags: ['Production'],
        summary: 'Detail Job Order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail job order beserta materials dan journal' } },
      },
    },
    '/production/job-orders/{id}/complete': {
      put: {
        tags: ['Production'],
        summary: 'Selesaikan Job Order',
        description: 'Mendeduct stok RM, menambah stok FG, dan membuat jurnal otomatis. Status harus ready atau waiting_material.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Job order selesai, stok FG bertambah' },
          400: { description: 'Stok RM tidak cukup atau status tidak valid' },
        },
      },
    },
    '/production/job-orders/{id}/cancel': {
      put: {
        tags: ['Production'],
        summary: 'Batalkan Job Order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Job order dibatalkan' } },
      },
    },
  },
};

module.exports = spec;
