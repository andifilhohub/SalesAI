const axios = require('axios');
const Integration = require('../models/Integration');
const encryptionService = require('./encryptionService');

class WebhookService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  // Enviar webhook para URL externa
  async sendWebhook(webhookUrl, payload, retryCount = 0) {
    try {
      const response = await axios.post(webhookUrl, payload, {
        timeout: 10000, // 10 segundos
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SalesAI-Webhook/1.0'
        }
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        attempt: retryCount + 1
      };
    } catch (error) {
      console.error(`Erro no webhook (tentativa ${retryCount + 1}):`, error.message);

      // Tentar novamente se não excedeu o limite
      if (retryCount < this.retryAttempts) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.sendWebhook(webhookUrl, payload, retryCount + 1);
      }

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        attempt: retryCount + 1
      };
    }
  }

  // Processar webhook de entrada (de serviços externos)
  async processIncomingWebhook(agent, payload) {
    try {
      // Aqui você processaria diferentes tipos de webhook (WhatsApp, Telegram, etc.)
      console.log(`Webhook recebido para agente ${agent.id}:`, payload);

      // Exemplo de estrutura básica de webhook
      const messageData = {
        customer_identifier: payload.from || payload.customer_id || 'unknown',
        content: payload.message || payload.text || '',
        channel: payload.channel || 'api',
        metadata: {
          webhook_payload: payload,
          received_at: new Date()
        }
      };

      return messageData;
    } catch (error) {
      console.error('Erro ao processar webhook de entrada:', error);
      throw error;
    }
  }

  // Testar conexão com webhook
  async testWebhookConnection(webhookUrl) {
    const testPayload = {
      test: true,
      message: 'Teste de conexão do SalesAI',
      timestamp: new Date().toISOString()
    };

    const result = await this.sendWebhook(webhookUrl, testPayload);

    return {
      success: result.success,
      status: result.status,
      response_time: Date.now(),
      message: result.success ? 'Conexão bem-sucedida' : 'Falha na conexão'
    };
  }

  // Configurar webhook para serviços específicos
  async setupServiceWebhook(agent, service, credentials) {
    try {
      switch (service) {
        case 'whatsapp':
          return await this.setupWhatsAppWebhook(agent, credentials);
        case 'telegram':
          return await this.setupTelegramWebhook(agent, credentials);
        default:
          throw new Error(`Serviço ${service} não suportado`);
      }
    } catch (error) {
      console.error(`Erro ao configurar webhook para ${service}:`, error);
      throw error;
    }
  }

  async setupWhatsAppWebhook(agent, credentials) {
    // Configuração específica do WhatsApp Business API
    const webhookUrl = `${process.env.API_BASE_URL}/webhook/ingress/${agent.ingress_webhook_url_path}`;

    // Aqui você faria a chamada para a API do WhatsApp para configurar o webhook
    console.log(`Configurando WhatsApp webhook: ${webhookUrl}`);

    return {
      webhook_url: webhookUrl,
      verify_token: agent.ingress_webhook_url_path
    };
  }

  async setupTelegramWebhook(agent, credentials) {
    // Configuração específica do Telegram Bot API
    const webhookUrl = `${process.env.API_BASE_URL}/webhook/ingress/${agent.ingress_webhook_url_path}`;

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${credentials.bot_token}/setWebhook`,
        {
          url: webhookUrl
        }
      );

      return {
        webhook_url: webhookUrl,
        telegram_response: response.data
      };
    } catch (error) {
      throw new Error(`Erro ao configurar Telegram webhook: ${error.message}`);
    }
  }

  // Utilitário para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validar estrutura do webhook
  validateWebhookPayload(payload, service) {
    switch (service) {
      case 'whatsapp':
        return payload.entry && payload.entry[0] && payload.entry[0].changes;
      case 'telegram':
        return payload.message || payload.callback_query;
      default:
        return true; // Webhook genérico
    }
  }
}

module.exports = new WebhookService();
