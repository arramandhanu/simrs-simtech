const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { requireRole, ROLES } = require('../middleware/authMiddleware');

// Validation rules
const createUserValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isString(),
    body('role').optional().isIn(['admin', 'doctor', 'nurse', 'staff', 'readonly', 'user']),
    body('position').optional().isString()
];

const updateUserValidation = [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isString(),
    body('role').optional().isIn(['admin', 'doctor', 'nurse', 'staff', 'readonly', 'user']),
    body('position').optional().isString()
];

// All routes require admin role
router.use(requireRole(ROLES.ADMIN));

// GET /api/users - Get all users (supports ?status=pending filter)
router.get('/', userController.getAllUsers);

// GET /api/users/pending/count - Get pending users count
router.get('/pending/count', userController.getPendingCount);

// GET /api/users/roles - Get available roles
router.get('/roles', userController.getRoles);

// GET /api/users/statuses - Get available statuses
router.get('/statuses', userController.getStatuses);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', createUserValidation, userController.createUser);

// POST /api/users/:id/approve - Approve pending user
router.post('/:id/approve', userController.approveUser);

// POST /api/users/:id/reject - Reject pending user
router.post('/:id/reject', userController.rejectUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUserValidation, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
