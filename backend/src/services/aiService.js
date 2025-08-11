const Agent = require('../models/Agent');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class AIService {
  constructor() {
    this.responses = {
      greeting: [
        'Olá! Como posso ajudar você hoje?',
        'Oi! Em que posso ser útil?',
        'Bem-vindo! Como posso te auxiliar?'
      ],
      help: [
        'Estou aqui para ajudar! Pode me contar mais sobre sua dúvida?',
        'Claro, vou te ajudar com isso. Me dê mais detalhes.',
        'Ficaria feliz em ajudar! Qual é sua questão?'
      ],
      default: [
        'Entendi sua mensagem. Deixe-me ver como posso ajudar.',
        'Interessante. Pode me dar mais informações sobre isso?',
        'Obrigado por compartilhar isso comigo. Como posso te ajudar?'
      ],
      goodbye: [
        'Foi um prazer ajudar! Tenha um ótimo dia!',
        'Espero ter ajudado. Até logo!',
        'Obrigado pela conversa. Volte sempre!'
      ]
    };
  }

  // Simula processamento de IA (substitua por integração real com OpenAI, etc.)
  async processMessage(message, agent, conversation) {
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const lowerMessage = message.toLowerCase();
      let responseType = 'default';

      // Detecção simples de intenção
      if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia')) {
        responseType = 'greeting';
      } else if (lowerMessage.includes('ajuda') || lowerMessage.includes('help') || lowerMessage.includes('?')) {
        responseType = 'help';
      } else if (lowerMessage.includes('tchau') || lowerMessage.includes('obrigado') || lowerMessage.includes('valeu')) {
        responseType = 'goodbye';
      }

      // Selecionar resposta aleatória do tipo
      const responses = this.responses[responseType];
      let response = responses[Math.floor(Math.random() * responses.length)];

      // Personalizar resposta com base nas configurações do agente
      response = this.personalizeResponse(response, agent);

      return {
        content: response,
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
        intent: responseType,
        processing_time: Math.floor(Math.random() * 1000 + 500) // 500-1500ms
      };
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return {
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        confidence: 0.1,
        intent: 'error',
        processing_time: 100
      };
    }
  }

  personalizeResponse(response, agent) {
    // Aplicar personalidade do agente
    if (agent.mood === 'formal') {
      response = response.replace(/!+/g, '.');
      response = response.replace(/Oi/, 'Olá');
    }

    if (agent.formality === 'formal') {
      response = response.replace(/você/g, 'o senhor/a senhora');
    }

    // Adicionar emojis se permitido
    if (agent.allow_emojis && Math.random() > 0.5) {
      const emojis = ['😊', '👍', '🙂', '✨', '💡'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      response += ' ' + emoji;
    }

    return response;
  }

  // Analisa tópicos das mensagens para relatórios
  async analyzeTopics(messages) {
    const topics = {
      'login': 0,
      'produto': 0,
      'pedido': 0,
      'reclamacao': 0,
      'outros': 0
    };

    messages.forEach(message => {
      const content = message.content.toLowerCase();

      if (content.includes('login') || content.includes('senha') || content.includes('acesso')) {
        topics.login++;
      } else if (content.includes('produto') || content.includes('item') || content.includes('compra')) {
        topics.produto++;
      } else if (content.includes('pedido') || content.includes('order') || content.includes('entrega')) {
        topics.pedido++;
      } else if (content.includes('problema') || content.includes('erro') || content.includes('reclamação')) {
        topics.reclamacao++;
      } else {
        topics.outros++;
      }
    });

    const total = Object.values(topics).reduce((sum, count) => sum + count, 0);

    // Converter para percentuais
    Object.keys(topics).forEach(key => {
      topics[key] = total > 0 ? Math.round((topics[key] / total) * 100) : 0;
    });

    return topics;
  }

  // Calcula métricas de satisfação
  calculateSatisfactionMetrics(conversations) {
    const ratings = conversations
      .filter(conv => conv.satisfaction_rating)
      .map(conv => conv.satisfaction_rating);

    if (ratings.length === 0) {
      return {
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        total_ratings: 0
      };
    }

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      distribution[rating]++;
    });

    return {
      average: Math.round(average * 10) / 10,
      distribution,
      total_ratings: ratings.length
    };
  }
}

module.exports = new AIService();
