-- Dynamic ERP Lite — Manual Database Setup
-- Paste this in Supabase SQL Editor and click Run

CREATE TABLE IF NOT EXISTS "users" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "role"      TEXT NOT NULL DEFAULT 'staff',
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "code"        TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "items" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "sku"           TEXT NOT NULL UNIQUE,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "stock"         INTEGER NOT NULL DEFAULT 0,
  "uom"           TEXT NOT NULL,
  "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sellingPrice"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "email"      TEXT UNIQUE,
  "phone"      TEXT,
  "address"    TEXT,
  "city"       TEXT,
  "province"   TEXT,
  "postalCode" TEXT,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "email"      TEXT UNIQUE,
  "phone"      TEXT,
  "address"    TEXT,
  "city"       TEXT,
  "province"   TEXT,
  "postalCode" TEXT,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "poNumber"    TEXT NOT NULL UNIQUE,
  "supplierId"  TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "dueDate"     TIMESTAMP(3),
  "status"      TEXT NOT NULL DEFAULT 'draft',
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id")
);

CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "poId"        TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "receivedQty" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
);

CREATE TABLE IF NOT EXISTS "purchase_receipts" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "receiptNumber" TEXT NOT NULL UNIQUE,
  "poNumber"      TEXT NOT NULL,
  "date"          TIMESTAMP(3) NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'posted',
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ap_payments" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "paymentNo"   TEXT NOT NULL UNIQUE,
  "supplierId"  TEXT NOT NULL,
  "receiptId"   TEXT,
  "date"        TIMESTAMP(3) NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "method"      TEXT NOT NULL DEFAULT 'cash',
  "reference"   TEXT,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id"),
  FOREIGN KEY ("receiptId") REFERENCES "purchase_receipts"("id")
);
CREATE INDEX IF NOT EXISTS "ap_payments_supplierId_idx" ON "ap_payments"("supplierId");

CREATE TABLE IF NOT EXISTS "sales_invoices" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "invoiceNo"   TEXT NOT NULL UNIQUE,
  "customerId"  TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "dueDate"     TIMESTAMP(3),
  "status"      TEXT NOT NULL DEFAULT 'draft',
  "subtotal"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxRate"     DOUBLE PRECISION NOT NULL DEFAULT 11,
  "taxAmount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
);

CREATE TABLE IF NOT EXISTS "sales_invoice_lines" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "invoiceId"   TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "itemId"        TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "quantity"      INTEGER NOT NULL,
  "reference"     TEXT,
  "referenceType" TEXT,
  "notes"         TEXT,
  "receiptId"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("itemId") REFERENCES "items"("id"),
  FOREIGN KEY ("receiptId") REFERENCES "purchase_receipts"("id")
);
CREATE INDEX IF NOT EXISTS "stock_movements_itemId_idx" ON "stock_movements"("itemId");
CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

CREATE TABLE IF NOT EXISTS "journals" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "journalNo"     TEXT NOT NULL UNIQUE,
  "date"          TIMESTAMP(3) NOT NULL,
  "description"   TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "reference"     TEXT,
  "referenceType" TEXT,
  "status"        TEXT NOT NULL DEFAULT 'draft',
  "poId"          TEXT UNIQUE,
  "invoiceId"     TEXT UNIQUE,
  "receiptId"     TEXT UNIQUE,
  "apPaymentId"   TEXT UNIQUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id"),
  FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id"),
  FOREIGN KEY ("receiptId") REFERENCES "purchase_receipts"("id"),
  FOREIGN KEY ("apPaymentId") REFERENCES "ap_payments"("id")
);
CREATE INDEX IF NOT EXISTS "journals_date_idx" ON "journals"("date");
CREATE INDEX IF NOT EXISTS "journals_status_idx" ON "journals"("status");

CREATE TABLE IF NOT EXISTS "journal_lines" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "journalId"   TEXT NOT NULL,
  "accountId"   TEXT NOT NULL,
  "description" TEXT,
  "debit"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "credit"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE CASCADE,
  FOREIGN KEY ("accountId") REFERENCES "chart_of_accounts"("id")
);
CREATE INDEX IF NOT EXISTS "journal_lines_journalId_idx" ON "journal_lines"("journalId");

CREATE TABLE IF NOT EXISTS "general_ledger" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "accountId"   TEXT NOT NULL,
  "journalId"   TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "debit"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "credit"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("accountId") REFERENCES "chart_of_accounts"("id"),
  FOREIGN KEY ("journalId") REFERENCES "journals"("id")
);
CREATE INDEX IF NOT EXISTS "general_ledger_accountId_idx" ON "general_ledger"("accountId");
CREATE INDEX IF NOT EXISTS "general_ledger_date_idx" ON "general_ledger"("date");
