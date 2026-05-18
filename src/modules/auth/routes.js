const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/db/prisma');
const { authenticate, requireAdmin, JWT_SECRET } = require('../../shared/middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'staff',
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      status: 'ok',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      status: 'ok',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'ok', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Change own password
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ status: 'ok', message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ---- Admin only ----

// List all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'ok', data: users, total: users.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update user (role / active)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role, active, name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role, active, name },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.json({ status: 'ok', data: user });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'User not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
