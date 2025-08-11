const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Obter dados da conta
router.get('/', accountController.getAccount);

// Atualizar informações da conta
router.put('/', validate(schemas.accountUpdate), accountController.updateAccount);

// Upload da foto de perfil
router.post('/profile-picture', uploadSingle('picture'), accountController.uploadProfilePicture);

// Alterar senha
router.post('/password', validate(schemas.passwordChange), accountController.changePassword);

// Informações de cobrança
router.get('/billing', accountController.getBillingInfo);

module.exports = router;
