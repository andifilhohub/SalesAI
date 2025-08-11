const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Agent = require('../models/Agent');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

class ConversationController {
  // Listar conversas
  async getConversations(req, res) {
    try {
      const { search, status, channel, limit = 20, offset = 0 } = req.query;

      // Buscar agente do usuário
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agente não encontrado',
          code: 'AGENT_NOT_FOUND'
        });
      }

      // Construir filtros
      const where = { agent_id: agent.id };

      if (search) {
        where.customer_identifier = {
          [Op.iLike]: `%${search}%`
        };
      }

      if (status) {
        where.status = status;
      }

      if (channel) {
        where.channel = channel;
      }

      const conversations = await Conversation.findAndCountAll({
        where,
        include: [{
          model: Message,
          required: false,
          order: [['created_at', 'DESC']],
          limit: 1 // Última mensagem
        }],
        order: [['last_activity_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        conversations: conversations.rows.map(conv => ({
          id: conv.id,
          customer_identifier: conv.customer_identifier,
          status: conv.status,
          channel: conv.channel,
          last_activity_at: conv.last_activity_at,
          satisfaction_rating: conv.satisfaction_rating,
          tags: conv.tags,
          created_at: conv.created_at,
          last_message: conv.Messages && conv.Messages.length > 0 ? {
            content: conv.Messages[0].content,
            sender: conv.Messages[0].sender,
            created_at: conv.Messages[0].created_at
          } : null
        })),
        pagination: {
          total: conversations.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < conversations.count
        }
      });
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obter mensagens de uma conversa
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Buscar agente do usuário
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agente não encontrado',
          code: 'AGENT_NOT_FOUND'
        });
      }

      // Verificar se a conversa pertence ao agente
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          agent_id: agent.id
        }
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'Conversa não encontrada',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const messages = await Message.findAndCountAll({
        where: { conversation_id: conversationId },
        order: [['created_at', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        conversation: {
          id: conversation.id,
          customer_identifier: conversation.customer_identifier,
          status: conversation.status,
          channel: conversation.channel
        },
        messages: messages.rows.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          metadata: msg.metadata,
          created_at: msg.created_at
        })),
        pagination: {
          total: messages.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < messages.count
        }
      });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Enviar mensagem (operador humano)
  async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const { content } = req.validatedData;

      // Buscar agente do usuário
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agente não encontrado',
          code: 'AGENT_NOT_FOUND'
        });
      }

      // Verificar se a conversa pertence ao agente
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          agent_id: agent.id
        }
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'Conversa não encontrada',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Criar mensagem do operador
      const message = await Message.create({
        conversation_id: conversationId,
        sender: 'user', // operador humano
        content,
        metadata: {
          user_id: req.user.id,
          user_name: req.user.name
        }
      });

      // Atualizar última atividade da conversa
      conversation.last_activity_at = new Date();
      conversation.status = 'open';
      await conversation.save();

      // Emitir via WebSocket
      const io = req.app.get('io');
      io.to(`conversation_${conversationId}`).emit('new_message', {
        id: message.id,
        sender: message.sender,
        content: message.content,
        created_at: message.created_at,
        user_name: req.user.name
      });

      res.json({
        success: true,
        message: {
          id: message.id,
          sender: message.sender,
          content: message.content,
          created_at: message.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Atualizar status da conversa
  async updateConversationStatus(req, res) {
    try {
      const { conversationId } = req.params;
      const { status, satisfaction_rating, tags } = req.body;

      // Buscar agente do usuário
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!agent) {
        return res.status(404).json({
          error: 'Agente não encontrado',
          code: 'AGENT_NOT_FOUND'
        });
      }

      // Verificar se a conversa pertence ao agente
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          agent_id: agent.id
        }
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'Conversa não encontrada',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      // Atualizar campos
      if (status) conversation.status = status;
      if (satisfaction_rating) conversation.satisfaction_rating = satisfaction_rating;
      if (tags) conversation.tags = tags;

      await conversation.save();

      // Emitir atualização via WebSocket (com proteção contra erro)
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`conversation_${conversationId}`).emit('conversation_updated', {
            id: conversation.id,
            status: conversation.status,
            satisfaction_rating: conversation.satisfaction_rating,
            tags: conversation.tags
          });
        }
      } catch (wsError) {
        console.warn('Erro ao emitir WebSocket:', wsError.message);
        // Não falhar a requisição por erro de WebSocket
      }

      res.json({
        success: true,
        conversation: {
          id: conversation.id,
          status: conversation.status,
          satisfaction_rating: conversation.satisfaction_rating,
          tags: conversation.tags
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Processar mensagem de entrada (de webhook ou API pública)
  async processIncomingMessage(agentId, messageData) {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        throw new Error('Agente não encontrado');
      }

      // Buscar ou criar conversa
      let conversation = await Conversation.findOne({
        where: {
          agent_id: agentId,
          customer_identifier: messageData.customer_identifier,
          status: { [Op.ne]: 'closed' }
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          agent_id: agentId,
          customer_identifier: messageData.customer_identifier,
          channel: messageData.channel,
          status: 'open'
        });
      }

      // Criar mensagem do cliente
      const customerMessage = await Message.create({
        conversation_id: conversation.id,
        sender: 'customer',
        content: messageData.content,
        metadata: messageData.metadata || {}
      });

      // Processar resposta da IA
      const aiResponse = await aiService.processMessage(
        messageData.content,
        agent,
        conversation
      );

      // Criar mensagem da IA
      const aiMessage = await Message.create({
        conversation_id: conversation.id,
        sender: 'ai',
        content: aiResponse.content,
        metadata: {
          confidence: aiResponse.confidence,
          intent: aiResponse.intent,
          processing_time: aiResponse.processing_time
        }
      });

      // Atualizar conversa
      conversation.last_activity_at = new Date();
      await conversation.save();

      return {
        conversation,
        customerMessage,
        aiMessage
      };
    } catch (error) {
      console.error('Erro ao processar mensagem de entrada:', error);
      throw error;
    }
  }
}

module.exports = new ConversationController();
