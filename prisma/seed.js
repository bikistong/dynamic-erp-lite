/**
 * Seeder — populate database dengan data dummy untuk testing
 * Jalankan: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Helper ────────────────────────────────────────────────────────────────────

function log(msg) { console.log(`  ${msg}`); }
function section(title) { console.log(`\n${'─'.repeat(50)}\n  ${title}\n${'─'.repeat(50)}`); }
function ok(label, count) { console.log(`  ✓ ${label}: ${count} records`); }

function genNo(prefix) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `${prefix}-${ymd}-${Date.now()}`.slice(0, 30);
}

// ── Data ──────────────────────────────────────────────────────────────────────

const COA = [
  { code: '1100', name: 'Kas',                    type: 'Asset',     description: 'Uang tunai dan rekening bank' },
  { code: '1200', name: 'Piutang Dagang',          type: 'Asset',     description: 'Tagihan ke customer' },
  { code: '1300', name: 'Persediaan Barang',       type: 'Asset',     description: 'Stok barang dagangan' },
  { code: '1400', name: 'Biaya Dibayar Dimuka',    type: 'Asset',     description: 'Beban yang sudah dibayar' },
  { code: '1500', name: 'Aset Tetap',              type: 'Asset',     description: 'Peralatan & inventaris toko' },
  { code: '2100', name: 'Hutang Dagang',           type: 'Liability', description: 'Hutang ke supplier' },
  { code: '2200', name: 'PPN Keluaran',            type: 'Liability', description: 'PPN terutang ke pemerintah' },
  { code: '2300', name: 'Beban Masih Harus Dibayar', type: 'Liability', description: 'Kewajiban yang belum dibayar' },
  { code: '3100', name: 'Modal Pemilik',           type: 'Equity',    description: 'Investasi pemilik' },
  { code: '3200', name: 'Laba Ditahan',            type: 'Equity',    description: 'Akumulasi laba' },
  { code: '4100', name: 'Penjualan',               type: 'Revenue',   description: 'Pendapatan dari penjualan' },
  { code: '4200', name: 'Pendapatan Lain-lain',    type: 'Revenue',   description: 'Pendapatan di luar usaha pokok' },
  { code: '5100', name: 'Harga Pokok Penjualan',   type: 'Expense',   description: 'HPP barang terjual' },
  { code: '5200', name: 'Beban Operasional',       type: 'Expense',   description: 'Beban umum & administrasi' },
  { code: '5300', name: 'Beban Gaji',              type: 'Expense',   description: 'Gaji dan tunjangan karyawan' },
  { code: '5400', name: 'Beban Sewa',              type: 'Expense',   description: 'Sewa toko / gudang' },
  { code: '5500', name: 'Beban Listrik & Air',     type: 'Expense',   description: 'Listrik, air, dan internet' },
];

const SUPPLIERS = [
  {
    name: 'PT Sumber Makmur',
    email: 'order@sumbermakmur.co.id',
    phone: '021-5551001',
    address: 'Jl. Industri Raya No. 45',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '11440',
  },
  {
    name: 'CV Berkah Jaya Distribusi',
    email: 'sales@berkah-jaya.com',
    phone: '022-4441002',
    address: 'Jl. Soekarno Hatta No. 120',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40223',
  },
  {
    name: 'UD Mitra Sejahtera',
    email: 'mitra.sejahtera@gmail.com',
    phone: '031-7772003',
    address: 'Jl. Raya Darmo No. 87',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postalCode: '60265',
  },
];

const CUSTOMERS = [
  {
    name: 'Toko Barokah',
    email: 'tokobarokah@gmail.com',
    phone: '0812-3456-7890',
    address: 'Jl. Pasar Baru No. 12',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40111',
  },
  {
    name: 'Minimarket Sejahtera',
    email: 'minimarket.sejahtera@gmail.com',
    phone: '0821-9876-5432',
    address: 'Jl. Kemang Raya No. 55',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12730',
  },
  {
    name: 'Warung Bu Siti',
    email: null,
    phone: '0856-1234-5678',
    address: 'Jl. Pajajaran No. 33',
    city: 'Bogor',
    province: 'Jawa Barat',
    postalCode: '16144',
  },
  {
    name: 'Toko Makmur Jaya',
    email: 'makmurjaya@yahoo.com',
    phone: '0817-4444-5555',
    address: 'Ruko Bekasi Mas Blok C-7',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postalCode: '17141',
  },
  {
    name: 'Koperasi Maju Bersama',
    email: 'koperasi.maju@gmail.com',
    phone: '0215-5556-0001',
    address: 'Jl. Margonda Raya No. 200',
    city: 'Depok',
    province: 'Jawa Barat',
    postalCode: '16431',
  },
];

const ITEMS = [
  { sku: 'MG-001', name: 'Minyak Goreng Tropical 1L',    uom: 'botol',  purchasePrice: 14500,  sellingPrice: 18000 },
  { sku: 'BR-001', name: 'Beras Premium Pandan Wangi 5kg', uom: 'karung', purchasePrice: 65000,  sellingPrice: 80000 },
  { sku: 'GP-001', name: 'Gula Pasir Gulaku 1kg',         uom: 'kg',     purchasePrice: 13000,  sellingPrice: 16000 },
  { sku: 'TT-001', name: 'Tepung Terigu Segitiga Biru 1kg', uom: 'kg',   purchasePrice: 11000,  sellingPrice: 14000 },
  { sku: 'MI-001', name: 'Mie Instant Indomie Goreng',    uom: 'dus',    purchasePrice: 95000,  sellingPrice: 115000 },
  { sku: 'SB-001', name: 'Sabun Mandi Lifebuoy 85gr',     uom: 'buah',   purchasePrice: 3500,   sellingPrice: 5000 },
  { sku: 'SH-001', name: 'Shampo Sunsilk 200ml',          uom: 'botol',  purchasePrice: 18000,  sellingPrice: 24000 },
  { sku: 'KP-001', name: 'Kopi Kapal Api Special 165gr',  uom: 'dus',    purchasePrice: 22000,  sellingPrice: 28000 },
  { sku: 'TH-001', name: 'Teh Celup Sariwangi 50s',       uom: 'dus',    purchasePrice: 9500,   sellingPrice: 13000 },
  { sku: 'AM-001', name: 'Air Mineral Aqua 600ml',        uom: 'karton', purchasePrice: 38000,  sellingPrice: 48000 },
  { sku: 'KN-001', name: 'Kecap Manis ABC 135ml',         uom: 'botol',  purchasePrice: 8500,   sellingPrice: 12000 },
  { sku: 'SK-001', name: 'Saus Tomat Del Monte 340gr',    uom: 'botol',  purchasePrice: 14000,  sellingPrice: 18500 },
];

// ── Main Seeder ───────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     Dynamic ERP Lite — Database Seeder          ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // ── 1. Chart of Accounts ──────────────────────────────────────────────────
  section('1. Chart of Accounts');
  let coaCount = 0;
  for (const acc of COA) {
    await prisma.chartOfAccounts.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
    coaCount++;
  }
  ok('COA', coaCount);

  // ── 2. Users ──────────────────────────────────────────────────────────────
  section('2. Users');
  const adminPass = await bcrypt.hash('admin123', 10);
  const staffPass = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@toko.com' },
    update: {},
    create: { name: 'Admin Toko', email: 'admin@toko.com', password: adminPass, role: 'admin' },
  });
  const staff = await prisma.user.upsert({
    where: { email: 'staff@toko.com' },
    update: {},
    create: { name: 'Staff Kasir', email: 'staff@toko.com', password: staffPass, role: 'staff' },
  });
  ok('Users', 2);
  log('admin@toko.com   / admin123  (role: admin)');
  log('staff@toko.com   / staff123  (role: staff)');

  // ── 3. Suppliers ─────────────────────────────────────────────────────────
  section('3. Suppliers');
  const suppliers = [];
  for (const s of SUPPLIERS) {
    const sup = await prisma.supplier.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
    suppliers.push(sup);
  }
  ok('Suppliers', suppliers.length);

  // ── 4. Customers ─────────────────────────────────────────────────────────
  section('4. Customers');
  const customers = [];
  for (const c of CUSTOMERS) {
    const cust = await prisma.customer.upsert({
      where: { email: c.email || `__no_email_${c.name.replace(/\s/g,'')}@dummy.invalid` },
      update: {},
      create: c,
    });
    customers.push(cust);
  }
  ok('Customers', customers.length);

  // ── 5. Items ─────────────────────────────────────────────────────────────
  section('5. Items (Barang)');
  const items = [];
  for (const item of ITEMS) {
    const it = await prisma.item.upsert({
      where: { sku: item.sku },
      update: {},
      create: { ...item, stock: 0 },
    });
    items.push(it);
  }
  ok('Items', items.length);

  // ── 6. Purchase Order 1 (PT Sumber Makmur) → received ───────────────────
  section('6. Purchase Orders');

  const existingPO1 = await prisma.purchaseOrder.findFirst({
    where: { supplierId: suppliers[0].id, status: 'received' },
  });

  let po1;
  if (!existingPO1) {
    const po1Lines = [
      { itemId: items[0].id, quantity: 100, unitPrice: items[0].purchasePrice },  // Minyak
      { itemId: items[1].id, quantity: 50,  unitPrice: items[1].purchasePrice },  // Beras
      { itemId: items[4].id, quantity: 80,  unitPrice: items[4].purchasePrice },  // Mie
      { itemId: items[9].id, quantity: 60,  unitPrice: items[9].purchasePrice },  // Air Mineral
    ];
    const total1 = po1Lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    po1 = await prisma.purchaseOrder.create({
      data: {
        poNumber: genNo('PO'),
        supplierId: suppliers[0].id,
        date: new Date('2024-01-10'),
        dueDate: new Date('2024-02-10'),
        status: 'received',
        totalAmount: total1,
        notes: 'Pembelian awal Januari 2024',
        lines: {
          create: po1Lines.map(l => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            totalAmount: l.quantity * l.unitPrice,
            receivedQty: l.quantity,
          })),
        },
      },
    });
    log(`PO-1 dibuat: ${po1.poNumber} (${suppliers[0].name})`);
  } else {
    po1 = existingPO1;
    log(`PO-1 sudah ada: ${po1.poNumber}`);
  }

  const existingPO2 = await prisma.purchaseOrder.findFirst({
    where: { supplierId: suppliers[1].id, status: 'submitted' },
  });

  let po2;
  if (!existingPO2) {
    const po2Lines = [
      { itemId: items[2].id, quantity: 200, unitPrice: items[2].purchasePrice },  // Gula
      { itemId: items[3].id, quantity: 150, unitPrice: items[3].purchasePrice },  // Tepung
      { itemId: items[5].id, quantity: 300, unitPrice: items[5].purchasePrice },  // Sabun
      { itemId: items[6].id, quantity: 100, unitPrice: items[6].purchasePrice },  // Shampo
    ];
    const total2 = po2Lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    po2 = await prisma.purchaseOrder.create({
      data: {
        poNumber: genNo('PO'),
        supplierId: suppliers[1].id,
        date: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'submitted',
        totalAmount: total2,
        notes: 'Restock barang kebutuhan rumah tangga',
        lines: {
          create: po2Lines.map(l => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            totalAmount: l.quantity * l.unitPrice,
          })),
        },
      },
    });
    log(`PO-2 dibuat: ${po2.poNumber} (${suppliers[1].name})`);
  } else {
    po2 = existingPO2;
    log(`PO-2 sudah ada: ${po2.poNumber}`);
  }
  ok('Purchase Orders', 2);

  // ── 7. Purchase Receipt (dari PO-1) ──────────────────────────────────────
  section('7. Purchase Receipt (Goods Received)');

  const existingGRN = await prisma.purchaseReceipt.findFirst({
    where: { poNumber: po1.poNumber },
  });

  let grn;
  if (!existingGRN) {
    const grnNo = genNo('GRN');
    grn = await prisma.purchaseReceipt.create({
      data: {
        receiptNumber: grnNo,
        poNumber: po1.poNumber,
        date: new Date('2024-01-12'),
        status: 'posted',
        notes: 'Barang diterima lengkap dan dalam kondisi baik',
      },
    });

    const po1Full = await prisma.purchaseOrder.findUnique({
      where: { id: po1.id },
      include: { lines: true },
    });

    // Tambah stok & buat stock movements
    for (const line of po1Full.lines) {
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          type: 'in',
          quantity: line.quantity,
          reference: grnNo,
          referenceType: 'po',
          notes: `Terima dari PO ${po1.poNumber}`,
          receiptId: grn.id,
        },
      });
      await prisma.item.update({
        where: { id: line.itemId },
        data: { stock: { increment: line.quantity } },
      });
    }

    // Jurnal: Debit Persediaan (1300), Credit Hutang Dagang (2100)
    const totalGRN = po1Full.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const coaInventory = await prisma.chartOfAccounts.findUnique({ where: { code: '1300' } });
    const coaAP = await prisma.chartOfAccounts.findUnique({ where: { code: '2100' } });
    if (coaInventory && coaAP) {
      const journal = await prisma.journal.create({
        data: {
          journalNo: genNo('JNL'),
          date: new Date('2024-01-12'),
          description: `Penerimaan barang GRN ${grnNo}`,
          type: 'auto',
          reference: grnNo,
          referenceType: 'receipt',
          status: 'posted',
          receiptId: grn.id,
          lines: {
            create: [
              { accountId: coaInventory.id, debit: totalGRN, credit: 0, description: 'Stok barang diterima' },
              { accountId: coaAP.id, debit: 0, credit: totalGRN, description: 'Hutang ke supplier' },
            ],
          },
        },
      });
      // Post ke General Ledger
      await prisma.generalLedger.createMany({
        data: [
          { accountId: coaInventory.id, journalId: journal.id, date: new Date('2024-01-12'), description: 'Stok diterima', debit: totalGRN, credit: 0, balance: totalGRN },
          { accountId: coaAP.id, journalId: journal.id, date: new Date('2024-01-12'), description: 'Hutang supplier', debit: 0, credit: totalGRN, balance: -totalGRN },
        ],
      });
    }

    log(`GRN dibuat: ${grnNo}`);
  } else {
    grn = existingGRN;
    log(`GRN sudah ada: ${grn.receiptNumber}`);
  }
  ok('Purchase Receipts', 1);

  // ── 8. AP Payment ─────────────────────────────────────────────────────────
  section('8. AP Payment (Bayar Hutang)');

  const existingPayment = await prisma.aPPayment.findFirst({
    where: { supplierId: suppliers[0].id },
  });

  if (!existingPayment) {
    const po1Full = await prisma.purchaseOrder.findUnique({
      where: { id: po1.id }, include: { lines: true },
    });
    const totalGRN = po1Full.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const paymentNo = genNo('PAY');

    const payment = await prisma.aPPayment.create({
      data: {
        paymentNo,
        supplierId: suppliers[0].id,
        receiptId: grn.id,
        date: new Date('2024-01-20'),
        amount: totalGRN,
        method: 'transfer',
        reference: 'TRF-BCA-20240120',
        notes: `Pelunasan GRN ${grn.receiptNumber}`,
      },
    });

    // Jurnal: Debit Hutang Dagang (2100), Credit Kas (1100)
    const coaAP = await prisma.chartOfAccounts.findUnique({ where: { code: '2100' } });
    const coaCash = await prisma.chartOfAccounts.findUnique({ where: { code: '1100' } });
    if (coaAP && coaCash) {
      const journal = await prisma.journal.create({
        data: {
          journalNo: genNo('JNL'),
          date: new Date('2024-01-20'),
          description: `Pembayaran hutang ke ${suppliers[0].name} - ${paymentNo}`,
          type: 'auto',
          reference: paymentNo,
          referenceType: 'ap_payment',
          status: 'posted',
          apPaymentId: payment.id,
          lines: {
            create: [
              { accountId: coaAP.id, debit: totalGRN, credit: 0, description: `Bayar hutang ${suppliers[0].name}` },
              { accountId: coaCash.id, debit: 0, credit: totalGRN, description: 'Transfer bank' },
            ],
          },
        },
      });
      await prisma.generalLedger.createMany({
        data: [
          { accountId: coaAP.id, journalId: journal.id, date: new Date('2024-01-20'), description: 'Bayar hutang', debit: totalGRN, credit: 0, balance: totalGRN },
          { accountId: coaCash.id, journalId: journal.id, date: new Date('2024-01-20'), description: 'Kas keluar', debit: 0, credit: totalGRN, balance: -totalGRN },
        ],
      });
    }
    log(`Pembayaran: ${paymentNo} — Rp ${totalGRN.toLocaleString('id-ID')}`);
  } else {
    log(`AP Payment sudah ada`);
  }
  ok('AP Payments', 1);

  // ── 9. Sales Invoices ────────────────────────────────────────────────────
  section('9. Sales Invoices');

  const invoiceScenarios = [
    {
      customer: customers[0],   // Toko Barokah
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      taxRate: 11,
      status: 'paid',
      notes: 'Penjualan rutin Januari',
      lines: [
        { item: items[0], quantity: 20, unitPrice: items[0].sellingPrice },  // Minyak
        { item: items[4], quantity: 15, unitPrice: items[4].sellingPrice },  // Mie
        { item: items[9], quantity: 10, unitPrice: items[9].sellingPrice },  // Air
      ],
    },
    {
      customer: customers[1],   // Minimarket Sejahtera
      date: new Date('2024-01-18'),
      dueDate: new Date('2024-02-18'),
      taxRate: 11,
      status: 'posted',
      notes: 'Order mingguan',
      lines: [
        { item: items[1], quantity: 10, unitPrice: items[1].sellingPrice },  // Beras
        { item: items[0], quantity: 30, unitPrice: items[0].sellingPrice },  // Minyak
        { item: items[9], quantity: 20, unitPrice: items[9].sellingPrice },  // Air
      ],
    },
    {
      customer: customers[2],   // Warung Bu Siti
      date: new Date('2024-01-22'),
      dueDate: null,
      taxRate: 0,
      status: 'draft',
      notes: 'Belum dikonfirmasi',
      lines: [
        { item: items[5], quantity: 50, unitPrice: items[5].sellingPrice },  // Sabun
        { item: items[8], quantity: 30, unitPrice: items[8].sellingPrice },  // Teh
        { item: items[7], quantity: 20, unitPrice: items[7].sellingPrice },  // Kopi
      ],
    },
  ];

  let invCount = 0;
  for (const scenario of invoiceScenarios) {
    const existing = await prisma.salesInvoice.findFirst({
      where: { customerId: scenario.customer.id, date: scenario.date },
    });
    if (existing) { log(`Invoice untuk ${scenario.customer.name} sudah ada`); continue; }

    const subtotal = scenario.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxAmount = Math.round(subtotal * scenario.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const invoiceNo = genNo('INV');

    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNo,
        customerId: scenario.customer.id,
        date: scenario.date,
        dueDate: scenario.dueDate,
        status: scenario.status === 'draft' ? 'draft' : 'draft',
        subtotal,
        taxRate: scenario.taxRate,
        taxAmount,
        totalAmount,
        notes: scenario.notes,
        lines: {
          create: scenario.lines.map(l => ({
            itemId: l.item.id,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            totalAmount: l.quantity * l.unitPrice,
          })),
        },
      },
    });

    if (scenario.status !== 'draft') {
      // Kurangi stok
      for (const l of scenario.lines) {
        await prisma.stockMovement.create({
          data: { itemId: l.item.id, type: 'out', quantity: l.quantity, reference: invoiceNo, referenceType: 'sales', notes: `Terjual via ${invoiceNo}` },
        });
        await prisma.item.update({ where: { id: l.item.id }, data: { stock: { decrement: l.quantity } } });
      }

      // Jurnal posting
      const coaAR = await prisma.chartOfAccounts.findUnique({ where: { code: '1200' } });
      const coaRev = await prisma.chartOfAccounts.findUnique({ where: { code: '4100' } });
      const coaTax = await prisma.chartOfAccounts.findUnique({ where: { code: '2200' } });
      const coaCOGS = await prisma.chartOfAccounts.findUnique({ where: { code: '5100' } });
      const coaInv = await prisma.chartOfAccounts.findUnique({ where: { code: '1300' } });

      const cogsTotal = scenario.lines.reduce((s, l) => s + l.quantity * l.item.purchasePrice, 0);

      const jLines = [
        { accountId: coaAR.id, debit: totalAmount, credit: 0, description: 'Piutang dagang (incl. PPN)' },
        { accountId: coaRev.id, debit: 0, credit: subtotal, description: 'Penjualan (DPP)' },
      ];
      if (taxAmount > 0 && coaTax) {
        jLines.push({ accountId: coaTax.id, debit: 0, credit: taxAmount, description: `PPN ${scenario.taxRate}% keluaran` });
      }
      if (cogsTotal > 0 && coaCOGS && coaInv) {
        jLines.push(
          { accountId: coaCOGS.id, debit: cogsTotal, credit: 0, description: 'HPP barang terjual' },
          { accountId: coaInv.id, debit: 0, credit: cogsTotal, description: 'Persediaan berkurang' }
        );
      }

      const journal = await prisma.journal.create({
        data: {
          journalNo: genNo('JNL'),
          date: scenario.date,
          description: `Penjualan ${invoiceNo} ke ${scenario.customer.name}`,
          type: 'auto',
          reference: invoiceNo,
          referenceType: 'sales',
          status: 'posted',
          invoiceId: invoice.id,
          lines: { create: jLines },
        },
      });

      // Post ke GL
      for (const jl of jLines) {
        await prisma.generalLedger.create({
          data: { accountId: jl.accountId, journalId: journal.id, date: scenario.date, description: jl.description, debit: jl.debit, credit: jl.credit, balance: jl.debit - jl.credit },
        });
      }

      let finalStatus = 'posted';
      if (scenario.status === 'paid') {
        // Jurnal pembayaran: Debit Kas, Credit AR
        const coaCash = await prisma.chartOfAccounts.findUnique({ where: { code: '1100' } });
        const payJournal = await prisma.journal.create({
          data: {
            journalNo: genNo('JNL'),
            date: new Date(scenario.date.getTime() + 3 * 24 * 60 * 60 * 1000),
            description: `Penerimaan pembayaran ${invoiceNo}`,
            type: 'auto',
            reference: invoiceNo,
            referenceType: 'payment',
            status: 'posted',
            lines: {
              create: [
                { accountId: coaCash.id, debit: totalAmount, credit: 0, description: 'Kas masuk' },
                { accountId: coaAR.id, debit: 0, credit: totalAmount, description: 'Piutang dilunasi' },
              ],
            },
          },
        });
        await prisma.generalLedger.createMany({
          data: [
            { accountId: coaCash.id, journalId: payJournal.id, date: payJournal.date, description: 'Kas masuk', debit: totalAmount, credit: 0, balance: totalAmount },
            { accountId: coaAR.id, journalId: payJournal.id, date: payJournal.date, description: 'Piutang dilunasi', debit: 0, credit: totalAmount, balance: -totalAmount },
          ],
        });
        finalStatus = 'paid';
      }

      await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { status: finalStatus } });
    }

    log(`${invoiceNo} → ${scenario.customer.name} — Rp ${totalAmount.toLocaleString('id-ID')} (${scenario.status})`);
    invCount++;
  }
  ok('Sales Invoices', invCount);

  // ── 10. Jurnal Manual ────────────────────────────────────────────────────
  section('10. Jurnal Manual');

  const existingJournal = await prisma.journal.findFirst({ where: { type: 'manual' } });
  if (!existingJournal) {
    const coaSewa = await prisma.chartOfAccounts.findUnique({ where: { code: '5400' } });
    const coaListrik = await prisma.chartOfAccounts.findUnique({ where: { code: '5500' } });
    const coaCash = await prisma.chartOfAccounts.findUnique({ where: { code: '1100' } });

    if (coaSewa && coaListrik && coaCash) {
      const bebanSewa = 3500000;
      const bebanListrik = 750000;
      const totalBeban = bebanSewa + bebanListrik;

      const journal = await prisma.journal.create({
        data: {
          journalNo: genNo('JNL'),
          date: new Date('2024-01-31'),
          description: 'Beban operasional Januari 2024',
          type: 'manual',
          status: 'posted',
          lines: {
            create: [
              { accountId: coaSewa.id,   debit: bebanSewa,    credit: 0,           description: 'Sewa toko Januari' },
              { accountId: coaListrik.id,debit: bebanListrik, credit: 0,           description: 'Listrik & air Januari' },
              { accountId: coaCash.id,   debit: 0,            credit: totalBeban,  description: 'Kas keluar' },
            ],
          },
        },
      });
      await prisma.generalLedger.createMany({
        data: [
          { accountId: coaSewa.id,    journalId: journal.id, date: journal.date, description: 'Sewa toko', debit: bebanSewa, credit: 0, balance: bebanSewa },
          { accountId: coaListrik.id, journalId: journal.id, date: journal.date, description: 'Listrik & air', debit: bebanListrik, credit: 0, balance: bebanListrik },
          { accountId: coaCash.id,    journalId: journal.id, date: journal.date, description: 'Kas keluar', debit: 0, credit: totalBeban, balance: -totalBeban },
        ],
      });
      log(`Beban sewa Rp ${bebanSewa.toLocaleString('id-ID')} + listrik Rp ${bebanListrik.toLocaleString('id-ID')}`);
    }
  } else {
    log('Jurnal manual sudah ada');
  }
  ok('Jurnal Manual', 1);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                 SEEDER SELESAI!                 ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const counts = await Promise.all([
    prisma.chartOfAccounts.count(),
    prisma.user.count(),
    prisma.supplier.count(),
    prisma.customer.count(),
    prisma.item.count(),
    prisma.purchaseOrder.count(),
    prisma.purchaseReceipt.count(),
    prisma.aPPayment.count(),
    prisma.salesInvoice.count(),
    prisma.journal.count(),
    prisma.generalLedger.count(),
  ]);

  const labels = ['Chart of Accounts','Users','Suppliers','Customers','Items','Purchase Orders','Receipts (GRN)','AP Payments','Sales Invoices','Journals','GL Entries'];
  labels.forEach((l, i) => console.log(`  ${l.padEnd(22)} ${counts[i]} records`));

  console.log('\n  Login credentials:');
  console.log('  admin@toko.com   / admin123');
  console.log('  staff@toko.com   / staff123\n');
  console.log('  Swagger docs: http://localhost:3000/api/docs\n');
}

main()
  .catch((e) => { console.error('\n✗ Seeder error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
