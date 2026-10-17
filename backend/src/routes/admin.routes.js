const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Stats & Reporting (Accessible by Admin and Manager)
router.get('/stats', authenticate, authorize(['admin', 'manager']), AdminController.getDashboardStats);
router.get('/reports/revenue', authenticate, authorize(['admin', 'manager']), AdminController.getRevenueReport);
router.get('/audit-logs', authenticate, authorize(['admin', 'manager']), AdminController.getAuditLogs);

// User & Role Management (Admin only)
router.get('/users', authenticate, authorize(['admin']), AdminController.getUsers);
router.patch('/users/:id/role', authenticate, authorize(['admin']), AdminController.updateUserRole);
router.patch('/users/:id/status', authenticate, authorize(['admin']), AdminController.updateUserStatus);

module.exports = router;
