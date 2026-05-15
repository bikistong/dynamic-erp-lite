const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');

// GET all items
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE item
router.post('/items', async (req, res) => {
  try {
    const { sku, name, stock, uom, purchasePrice, sellingPrice } = req.body;
    const item = await prisma.item.create({
      data: {
        sku,
        name,
        stock: stock || 0,
        uom: uom || 'pcs',
        purchasePrice: purchasePrice || 0,
        sellingPrice: sellingPrice || 0
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;