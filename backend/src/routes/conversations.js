const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar conversas
router.get('/', conversationController.getConversations);

// Obter mensagens de uma conversa
router.get('/:conversationId/messages', conversationController.getMessages);

// Enviar mensagem (operador humano)
router.post('/:conversationId/messages', validate(schemas.message), conversationController.sendMessage);

// Atualizar status da conversa
router.patch('/:conversationId', conversationController.updateConversationStatus);

module.exports = router;
