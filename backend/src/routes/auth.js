const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', validate(schemas.login), authController.login);

// Registro (opcional - remova se não quiser permitir auto-registro)
router.post('/register', validate(schemas.register), authController.register);

// Verificar token
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
