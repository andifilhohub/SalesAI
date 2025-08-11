const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Obter configurações do agente
router.get('/', agentController.getAgent);

// Atualizar configurações do agente
router.put('/', validate(schemas.agentConfig), agentController.updateAgent);

// Upload do avatar do agente
router.post('/avatar', uploadSingle('avatar'), agentController.uploadAvatar);

// Regenerar API key
router.post('/regenerate-api-key', agentController.regenerateApiKey);

// Base de conhecimento
router.get('/knowledge', agentController.getKnowledgeFiles);
router.post('/knowledge', uploadSingle('file'), agentController.uploadKnowledgeFile);
router.delete('/knowledge/:fileId', agentController.deleteKnowledgeFile);

// Integrações
router.post('/integrations', validate(schemas.integration), agentController.connectIntegration);
router.post('/integrations/test-webhook', agentController.testWebhook);

module.exports = router;
