const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { authenticate } = require('../../shared/middleware/auth');
const { parsePagination, paginatedResponse } = require('../../shared/utils/helpers');

router.use(authenticate);

// ============================================
// ITEMS
// ============================================

router.get('/items', async (req, res) => {
  try {
    const { search, active } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.active = active === 'true';

    const [items, total] = await Promise.all([
      prisma.item.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      prisma.item.count({ where }),
    ]);
    res.json(paginatedResponse(items, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/items/:id', async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });
    res.json({ status: 'ok', data: item });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { sku, name, description, stock, uom, purchasePrice, sellingPrice } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ status: 'error', message: 'sku and name are required' });
    }
    const item = await prisma.item.create({
      data: { sku, name, description, stock: stock || 0, uom: uom || 'pcs', purchasePrice: purchasePrice || 0, sellingPrice: sellingPrice || 0 },
    });
    res.status(201).json({ status: 'ok', data: item });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ status: 'error', message: 'SKU already exists' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const { name, description, uom, purchasePrice, sellingPrice, active } = req.body;
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { name, description, uom, purchasePrice, sellingPrice, active },
    });
    res.json({ status: 'ok', data: item });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Item not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    await prisma.item.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ status: 'ok', message: 'Item deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Item not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// STOCK MOVEMENTS & ADJUSTMENTS
// ============================================

router.get('/stock-movements', async (req, res) => {
  try {
    const { itemId, type } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (itemId) where.itemId = itemId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { item: { select: { sku: true, name: true, uom: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where }),
    ]);
    res.json(paginatedResponse(movements, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/stock-adjustments', async (req, res) => {
  try {
    const { itemId, quantity, notes } = req.body;
    if (!itemId || quantity === undefined) {
      return res.status(400).json({ status: 'error', message: 'itemId and quantity are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) throw new Error('Item not found');

      const movement = await tx.stockMovement.create({
        data: { itemId, type: 'adjustment', quantity, referenceType: 'adjustment', notes },
      });

      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: { stock: { increment: quantity } },
      });

      return { movement, item: updatedItem };
    });

    res.status(201).json({ status: 'ok', data: result });
  } catch (error) {
    if (error.message === 'Item not found') return res.status(404).json({ status: 'error', message: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
