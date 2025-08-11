const Agent = require('../models/Agent');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

class ReportController {
  // Dashboard summary
  async getDashboardSummary(req, res) {
    try {
      const { period = '7d' } = req.query;

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

      // Calcular período
      const now = new Date();
      const periodStart = new Date();

      switch (period) {
        case '1d':
          periodStart.setDate(now.getDate() - 1);
          break;
        case '7d':
          periodStart.setDate(now.getDate() - 7);
          break;
        case '30d':
          periodStart.setDate(now.getDate() - 30);
          break;
        default:
          periodStart.setDate(now.getDate() - 7);
      }

      // Conversas no período
      const conversationsToday = await Conversation.count({
        where: {
          agent_id: agent.id,
          created_at: {
            [Op.gte]: periodStart
          }
        }
      });

      // Mensagens da IA no período
      const aiMessages = await Message.count({
        where: {
          sender: 'ai',
          created_at: {
            [Op.gte]: periodStart
          }
        },
        include: [{
          model: Conversation,
          where: { agent_id: agent.id },
          required: true
        }]
      });

      // Total de mensagens no período
      const totalMessages = await Message.count({
        where: {
          created_at: {
            [Op.gte]: periodStart
          }
        },
        include: [{
          model: Conversation,
          where: { agent_id: agent.id },
          required: true
        }]
      });

      // Calcular porcentagem de respostas automáticas
      const automationPercentage = totalMessages > 0 ?
        Math.round((aiMessages / totalMessages) * 100) : 0;

      // Tempo médio de resposta (simulado)
      const avgResponseTime = Math.floor(Math.random() * 120) + 30; // 30-150 segundos

      // Satisfação média
      const conversations = await Conversation.findAll({
        where: {
          agent_id: agent.id,
          satisfaction_rating: {
            [Op.ne]: null
          },
          created_at: {
            [Op.gte]: periodStart
          }
        }
      });

      const avgSatisfaction = conversations.length > 0 ?
        conversations.reduce((sum, conv) => sum + conv.satisfaction_rating, 0) / conversations.length :
        0;

      res.json({
        success: true,
        summary: {
          conversations_today: conversationsToday,
          automation_percentage: automationPercentage,
          avg_response_time: avgResponseTime,
          avg_satisfaction: Math.round(avgSatisfaction * 10) / 10,
          period
        }
      });
    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Atividades recentes
  async getRecentActivity(req, res) {
    try {
      const { limit = 10 } = req.query;

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

      // Buscar conversas recentes
      const recentConversations = await Conversation.findAll({
        where: { agent_id: agent.id },
        include: [{
          model: Message,
          required: false,
          order: [['created_at', 'DESC']],
          limit: 1
        }],
        order: [['last_activity_at', 'DESC']],
        limit: parseInt(limit)
      });

      const activities = recentConversations.map(conv => ({
        type: 'conversation',
        conversation_id: conv.id,
        customer_identifier: conv.customer_identifier,
        channel: conv.channel,
        status: conv.status,
        last_activity: conv.last_activity_at,
        last_message: conv.Messages && conv.Messages.length > 0 ? {
          content: conv.Messages[0].content.substring(0, 100),
          sender: conv.Messages[0].sender
        } : null
      }));

      res.json({
        success: true,
        activities
      });
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Dados para gráfico de conversas
  async getConversationsChart(req, res) {
    try {
      const { period = '7d' } = req.query;

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

      // Gerar dados simulados para o gráfico
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
      const labels = [];
      const conversationsData = [];
      const aiResponsesData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Formato da data
        const label = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short'
        });

        labels.push(label);

        // Dados simulados (em produção, busque do banco)
        conversationsData.push(Math.floor(Math.random() * 50) + 10);
        aiResponsesData.push(Math.floor(Math.random() * 40) + 5);
      }

      res.json({
        success: true,
        chart: {
          labels,
          datasets: [
            {
              label: 'Conversas',
              data: conversationsData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            },
            {
              label: 'Respostas Automáticas',
              data: aiResponsesData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }
          ]
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Gráfico de satisfação
  async getSatisfactionChart(req, res) {
    try {
      const { period = '30d' } = req.query;

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

      // Calcular período
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - (period === '30d' ? 30 : 7));

      // Buscar avaliações
      const conversations = await Conversation.findAll({
        where: {
          agent_id: agent.id,
          satisfaction_rating: {
            [Op.ne]: null
          },
          created_at: {
            [Op.gte]: periodStart
          }
        }
      });

      // Calcular distribuição
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      conversations.forEach(conv => {
        distribution[conv.satisfaction_rating]++;
      });

      // Converter para percentuais
      const total = conversations.length;
      const percentages = Object.keys(distribution).map(rating => {
        return total > 0 ? Math.round((distribution[rating] / total) * 100) : 0;
      });

      res.json({
        success: true,
        chart: {
          labels: ['1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas'],
          data: percentages,
          average: total > 0 ?
            conversations.reduce((sum, conv) => sum + conv.satisfaction_rating, 0) / total : 0
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados de satisfação:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Tópicos mais frequentes
  async getTopTopics(req, res) {
    try {
      const { period = '30d' } = req.query;

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

      // Calcular período
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - (period === '30d' ? 30 : 7));

      // Buscar mensagens do período
      const messages = await Message.findAll({
        where: {
          sender: 'customer',
          created_at: {
            [Op.gte]: periodStart
          }
        },
        include: [{
          model: Conversation,
          where: { agent_id: agent.id },
          required: true
        }]
      });

      // Analisar tópicos
      const topics = await aiService.analyzeTopics(messages);

      res.json({
        success: true,
        topics: [
          { name: 'Problemas de login', percentage: topics.login },
          { name: 'Dúvidas sobre produtos', percentage: topics.produto },
          { name: 'Status de pedidos', percentage: topics.pedido },
          { name: 'Reclamações', percentage: topics.reclamacao },
          { name: 'Outros', percentage: topics.outros }
        ]
      });
    } catch (error) {
      console.error('Erro ao buscar tópicos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new ReportController();
