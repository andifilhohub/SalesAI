const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateApiKey } = require('../middleware/auth');

// Aplicar autenticação por API key em todas as rotas
router.use(authenticateApiKey);

// Enviar mensagem via API pública
router.post('/messages', validate(schemas.publicMessage), async (req, res) => {
  try {
    const { message, channel = 'api', customer_identifier } = req.validatedData;
    const agent = req.agent;

    // Preparar dados da mensagem
    const messageData = {
      customer_identifier: customer_identifier || 'API User',
      content: message,
      channel,
      metadata: {
        api_request: true,
        api_key: agent.public_api_key.substring(0, 10) + '...',
        timestamp: new Date()
      }
    };

    // Processar mensagem
    const result = await conversationController.processIncomingMessage(agent.id, messageData);

    res.json({
      success: true,
      conversation_id: result.conversation.id,
      customer_message: {
        id: result.customerMessage.id,
        content: result.customerMessage.content,
        timestamp: result.customerMessage.created_at
      },
      ai_response: {
        id: result.aiMessage.id,
        content: result.aiMessage.content,
        confidence: result.aiMessage.metadata.confidence,
        processing_time_ms: result.aiMessage.metadata.processing_time,
        timestamp: result.aiMessage.created_at
      }
    });
  } catch (error) {
    console.error('Erro na API pública:', error);
    res.status(500).json({
      error: 'Erro ao processar mensagem',
      code: 'PROCESSING_ERROR'
    });
  }
});

// Obter informações do agente (limitado)
router.get('/agent', (req, res) => {
  const agent = req.agent;

  res.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      language: agent.language,
      is_active: agent.is_active
    }
  });
});

// Listar conversas recentes (limitado)
router.get('/conversations', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const agent = req.agent;

    const conversations = await require('../models/Conversation').findAll({
      where: {
        agent_id: agent.id,
        channel: 'api'
      },
      order: [['last_activity_at', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'customer_identifier', 'status', 'last_activity_at', 'created_at']
    });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Erro ao buscar conversas via API:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
