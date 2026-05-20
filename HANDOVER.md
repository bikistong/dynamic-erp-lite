# Handover — Dynamic ERP Lite
_Generated: 20 Mei 2026_

---

## Status Legend
- ✅ Done (backend + frontend)
- 🟡 Partial (backend ada, UI terbatas / read-only)
- ❌ Missing (belum dibangun sama sekali)

---

## 1. Infrastruktur & Auth

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| Login JWT | ✅ `POST /api/auth/login` | ✅ `/login` page | ✅ |
| Register / seed user | ✅ `POST /api/auth/register` | ❌ Tidak ada halaman | 🟡 |
| User management (list, aktif/nonaktif) | ❌ Tidak ada endpoint | ❌ | ❌ |
| Role-based access (admin vs staff) | 🟡 `role` field ada di DB, dicek di seed COA saja | ❌ | 🟡 |
| Dashboard summary | ✅ `GET /api/dashboard/summary` | ✅ Stat cards + chart | ✅ |

---

## 2. Inventory

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| List item | ✅ `GET /api/inventory/items` | ✅ Tabel + search | ✅ |
| Tambah item | ✅ `POST /api/inventory/items` | ✅ Modal create | ✅ |
| Edit item | ✅ `PUT /api/inventory/items/:id` | ✅ Modal edit | ✅ |
| Nonaktifkan item | ✅ `DELETE /api/inventory/items/:id` | ❌ Tidak ada tombol di UI | 🟡 |
| Detail item + riwayat stok | ✅ `GET /api/inventory/items/:id` | ❌ Tidak ada halaman detail | 🟡 |
| Riwayat pergerakan stok | ✅ `GET /api/inventory/stock-movements` | ❌ Tidak ada halaman | 🟡 |
| Penyesuaian stok (manual) | ✅ `POST /api/inventory/stock-adjustments` | ❌ Tidak ada UI | 🟡 |
| Filter item per tipe (RM / FG / Umum) | ❌ Tidak ada di endpoint list | ❌ | ❌ |

---

## 3. Purchasing

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| List supplier | ✅ `GET /api/purchasing/suppliers` | ✅ `/settings/suppliers` | ✅ |
| Tambah / edit supplier | ✅ POST + PUT | ✅ Modal di settings | ✅ |
| Nonaktifkan supplier | ✅ DELETE | ❌ Tidak ada tombol | 🟡 |
| List Purchase Order | ✅ `GET /api/purchasing/orders` | ✅ Tabel + filter status | 🟡 |
| **Buat Purchase Order** | ✅ `POST /api/purchasing/orders` | ❌ **Tidak ada form/modal** | 🟡 |
| Submit PO (draft → submitted) | ✅ `PUT .../submit` | ❌ Tidak ada tombol di UI | 🟡 |
| Cancel PO | ✅ `PUT .../cancel` | ❌ Tidak ada tombol di UI | 🟡 |
| **Goods Receipt Note (GRN)** | ✅ `POST /api/purchasing/receipts` | ❌ **Tidak ada halaman GRN sama sekali** | 🟡 |
| List GRN | ✅ `GET /api/purchasing/receipts` | ❌ | 🟡 |
| **Pembayaran Hutang (AP Payment)** | ✅ `POST /api/purchasing/payments` | ❌ **Tidak ada halaman AP** | 🟡 |
| List AP Payment | ✅ `GET /api/purchasing/payments` | ❌ | 🟡 |
| Laporan AP Summary | ✅ `GET /api/purchasing/ap-summary` | ❌ | 🟡 |

---

## 4. Sales

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| List customer | ✅ `GET /api/sales/customers` | ✅ `/settings/customers` | ✅ |
| Tambah / edit customer | ✅ POST + PUT | ✅ Modal di settings | ✅ |
| Nonaktifkan customer | ✅ DELETE | ❌ Tidak ada tombol | 🟡 |
| List Sales Invoice | ✅ `GET /api/sales/invoices` | ✅ Tabel + filter status | ✅ |
| **Buat Invoice** | ✅ `POST /api/sales/invoices` | ✅ Modal create dengan lines | ✅ |
| Post Invoice (draft → posted) | ✅ `PUT .../post` | ❌ **Tidak ada tombol di UI** | 🟡 |
| Cancel Invoice | ✅ `PUT .../cancel` | ❌ Tidak ada tombol | 🟡 |
| Tandai Lunas (posted → paid) | ✅ `PUT .../pay` | ❌ **Tidak ada tombol di UI** | 🟡 |
| Detail Invoice | ✅ `GET /api/sales/invoices/:id` | ❌ Tidak ada halaman detail | 🟡 |
| Auto-buat Job Order dari Invoice | ✅ Otomatis saat create invoice | ✅ (berjalan di background) | ✅ |
| Auto-buat draft PO kalau stok RM kurang | ✅ Otomatis saat create invoice | ✅ (berjalan di background) | ✅ |
| Laporan PPN / Tax Summary | ✅ `GET /api/sales/ppn-summary` | ❌ Tidak ada halaman | 🟡 |

---

## 5. Production

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| List BOM | ✅ `GET /api/production/boms` | ✅ `/bom` page | ✅ |
| Buat BOM | ✅ `POST /api/production/boms` | ✅ Modal create di `/bom` | ✅ |
| Edit BOM | ✅ `PUT /api/production/boms/:id` | ❌ Tidak ada tombol edit di UI | 🟡 |
| Nonaktifkan BOM | ✅ `DELETE /api/production/boms/:id` | ❌ Tidak ada tombol | 🟡 |
| Warning FG tanpa BOM | ✅ | ✅ Banner amber di `/bom` | ✅ |
| List Job Order | ✅ `GET /api/production/job-orders` | ✅ Tabel + filter status | ✅ |
| Selesaikan Job Order | ✅ `PUT .../complete` | ✅ Tombol "Selesaikan" | ✅ |
| Cancel Job Order | ✅ `PUT .../cancel` | ❌ Tidak ada tombol | 🟡 |
| Detail Job Order + materialnya | ✅ `GET /api/production/job-orders/:id` | ❌ Tidak ada halaman detail | 🟡 |
| Auto-recheck JO ke "ready" setelah GRN | ✅ `recheckWaitingJobOrders()` | ✅ (berjalan di background) | ✅ |

---

## 6. Accounting

| Fitur | Backend | Frontend | Status |
|---|---|---|---|
| List Chart of Accounts | ✅ `GET /api/accounting/accounts` | ✅ `/settings/coa` | ✅ |
| Tambah / edit COA | ✅ POST + PUT | ✅ Modal di settings | ✅ |
| Seed COA default (17 akun) | ✅ `POST /api/accounting/accounts/seed` | ❌ Tidak ada tombol di UI | 🟡 |
| List Jurnal | ✅ `GET /api/accounting/journals` | ✅ Tabel read-only | 🟡 |
| **Buat Jurnal Manual** | ✅ `POST /api/accounting/journals` | ❌ **Tidak ada form** | 🟡 |
| Post Jurnal (draft → posted) | ✅ `PUT .../post` | ❌ Tidak ada tombol | 🟡 |
| Detail Jurnal + lines | ✅ `GET /api/accounting/journals/:id` | ❌ Tidak ada | 🟡 |
| **Buku Besar (General Ledger)** | ✅ `GET /api/accounting/ledger` | ❌ **Tidak ada halaman** | 🟡 |
| **Neraca Saldo (Trial Balance)** | ✅ `GET /api/accounting/reports/trial-balance` | ❌ **Tidak ada halaman** | 🟡 |
| **Laporan Laba Rugi (P&L)** | ✅ `GET /api/accounting/reports/profit-loss` | ❌ **Tidak ada halaman** | 🟡 |
| **Neraca (Balance Sheet)** | ✅ `GET /api/accounting/reports/balance-sheet` | ❌ **Tidak ada halaman** | 🟡 |
| Auto-jurnal pembelian (GRN) | ✅ Debit Inventory, Kredit AP | ✅ (otomatis) | ✅ |
| Auto-jurnal penjualan (post invoice) | ✅ AR, Revenue, PPN, COGS | ✅ (otomatis) | ✅ |
| Auto-jurnal pembayaran AP | ✅ Debit AP, Kredit Kas | ✅ (otomatis) | ✅ |
| Auto-jurnal produksi selesai | ✅ Debit FG Inventory, Kredit RM Inventory | ✅ (otomatis) | ✅ |
| Auto-jurnal penerimaan piutang | ✅ Debit Kas, Kredit AR | ✅ (otomatis) | ✅ |

---

## 7. Ringkasan Gap — Yang Paling Mendesak

### Kritikal (workflow utama terhambat)

1. **Buat Purchase Order** — user tidak bisa buat PO dari UI, hanya bisa lihat daftar
2. **Goods Receipt Note (GRN)** — tanpa halaman ini, stok tidak bisa masuk manual via UI, proses "waiting_material" → "ready" di production tidak bisa dipicu
3. **Post Invoice** — invoice dibuat tapi tidak bisa di-post dari UI (status stuck di draft, stok tidak dikurangi, jurnal tidak dibuat)
4. **Tandai Invoice Lunas** — tidak ada tombol "Bayar" di UI

### Penting (laporan keuangan)

5. **Laporan Laba Rugi** — backend siap, tidak ada halaman
6. **Neraca (Balance Sheet)** — backend siap, tidak ada halaman
7. **Neraca Saldo (Trial Balance)** — backend siap, tidak ada halaman
8. **Buku Besar (GL)** — backend siap, tidak ada halaman

### Nice to Have

9. **AP Payment** — bayar hutang ke supplier
10. **Laporan PPN** — untuk laporan pajak
11. **Penyesuaian Stok Manual** — stock opname
12. **Edit BOM** — saat ini hanya bisa buat baru
13. **Cancel Job Order / Invoice / PO** — tombol ada di backend, belum ada di UI
14. **Seed COA otomatis** — tombol satu klik agar user tidak perlu input 17 akun manual
15. **User Management** — tidak ada endpoint maupun UI sama sekali

---

## 8. Database Schema — Status

Semua 19 model sudah ada di Prisma schema dan ter-push ke Supabase:

`User` · `ChartOfAccounts` · `Item` · `Customer` · `Supplier` · `PurchaseOrder` · `PurchaseOrderLine` · `APPayment` · `PurchaseReceipt` · `SalesInvoice` · `SalesInvoiceLine` · `StockMovement` · `Journal` · `JournalLine` · `GeneralLedger` · `BOM` · `BOMLine` · `JobOrder` · `JobOrderMaterial`

Tidak ada model yang belum dibuat.

---

## 9. Infrastructure

| Komponen | Platform | Status |
|---|---|---|
| Backend API | Railway | ✅ Running |
| Frontend | Vercel (`dynamic-erp-lite.vercel.app`) | ✅ Running |
| Database | Supabase PostgreSQL | ✅ Running |
| Connection pooler | PgBouncer (Supabase port 6543) | ✅ Compatible (fixed) |
| Auth | JWT (HS256, 7 hari) | ✅ |
| API Docs | Swagger UI di `/api/docs` | ✅ |
