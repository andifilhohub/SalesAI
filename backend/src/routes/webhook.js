const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const conversationController = require('../controllers/conversationController');
const webhookService = require('../services/webhookService');

// Webhook de entrada (recebe mensagens de serviços externos)
router.post('/ingress/:webhookPath', async (req, res) => {
  try {
    const { webhookPath } = req.params;
    const payload = req.body;

    // Buscar agente pelo webhook path
    const agent = await Agent.findOne({
      where: {
        ingress_webhook_url_path: webhookPath,
        is_active: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Webhook não encontrado',
        code: 'WEBHOOK_NOT_FOUND'
      });
    }

    // Processar payload do webhook
    const messageData = await webhookService.processIncomingWebhook(agent, payload);

    // Processar mensagem
    const result = await conversationController.processIncomingMessage(agent.id, messageData);

    // Emitir via WebSocket para operadores conectados (com proteção)
    try {
      const io = req.app?.get('io');
      if (io && result.customerMessage && result.aiMessage) {
        io.emit('new_conversation_message', {
          conversation_id: result.conversation.id,
          customer_message: {
            id: result.customerMessage.id,
            content: result.customerMessage.content,
            sender: 'customer',
            created_at: result.customerMessage.created_at
          },
          ai_message: {
            id: result.aiMessage.id,
            content: result.aiMessage.content,
            sender: 'ai',
            created_at: result.aiMessage.created_at
          }
        });
      }
    } catch (wsError) {
      console.warn('Erro ao emitir WebSocket no webhook:', wsError.message);
    }

    // Enviar webhook de saída se configurado
    if (agent.outbound_webhook_url) {
      try {
        await webhookService.sendWebhook(agent.outbound_webhook_url, {
          conversation_id: result.conversation.id,
          customer_identifier: result.conversation.customer_identifier,
          customer_message: {
            content: result.customerMessage.content,
            timestamp: result.customerMessage.created_at
          },
          ai_response: {
            content: result.aiMessage.content,
            confidence: result.aiMessage.metadata.confidence,
            timestamp: result.aiMessage.created_at
          }
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de saída:', webhookError);
        // Não falhar o processamento por causa do webhook
      }
    }

    res.json({
      success: true,
      conversation_id: result.conversation.id,
      message: 'Mensagem processada com sucesso'
    });
  } catch (error) {
    console.error('Erro no webhook de entrada:', error);
    res.status(500).json({
      error: 'Erro ao processar webhook',
      code: 'WEBHOOK_PROCESSING_ERROR'
    });
  }
});

// Webhook para verificação (WhatsApp, etc.)
router.get('/ingress/:webhookPath', (req, res) => {
  const {
    'hub.mode': mode,
    'hub.verify_token': verifyToken,
    'hub.challenge': challenge
  } = req.query;

  const { webhookPath } = req.params;

  // Verificar se é uma verificação válida
  if (mode === 'subscribe' && verifyToken === webhookPath) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Verificação falhou' });
  }
});

module.exports = router;
