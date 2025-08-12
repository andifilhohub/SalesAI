const Agent = require('../models/Agent');
const KnowledgeFile = require('../models/KnowledgeFile');
const Integration = require('../models/Integration');
const { uploadToLocal, deleteFromLocal } = require('../config/storage');
const encryptionService = require('../services/encryptionService');
const webhookService = require('../services/webhookService');
const { v4: uuidv4 } = require('uuid');

class AgentController {
  // Obter configurações do agente
  async getAgent(req, res) {
    try {
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        },
        include: [
          {
            model: KnowledgeFile,
            required: false
          },
          {
            model: Integration,
            required: false
          }
        ]
      });

      if (!agent) {
        // Criar agente se não existir
        const newAgent = await Agent.create({
          user_id: req.user.id,
          name: `Assistente de ${req.user.name}`
        });

        return res.json({
          success: true,
          agent: {
            id: newAgent.id,
            name: newAgent.name,
            avatar_url: newAgent.avatar_url,
            language: newAgent.language,
            mood: newAgent.mood,
            formality: newAgent.formality,
            allow_emojis: newAgent.allow_emojis,
            response_speed: newAgent.response_speed,
            tone: newAgent.tone,
            opening_phrase: newAgent.opening_phrase,
            closing_phrase: newAgent.closing_phrase,
            public_api_key: newAgent.public_api_key,
            ingress_webhook_url: `${process.env.API_BASE_URL}/webhook/ingress/${newAgent.ingress_webhook_url_path}`,
            outbound_webhook_url: newAgent.outbound_webhook_url,
            knowledge_files: [],
            integrations: []
          }
        });
      }

      // Descriptografar credenciais das integrações
      const integrations = agent.Integrations?.map(integration => ({
        id: integration.id,
        service_name: integration.service_name,
        is_active: integration.is_active,
        connected_at: integration.connected_at,
        // Não retornar credenciais por segurança
        has_credentials: !!integration.credentials
      })) || [];

      res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          avatar_url: agent.avatar_url,
          language: agent.language,
          mood: agent.mood,
          formality: agent.formality,
          allow_emojis: agent.allow_emojis,
          response_speed: agent.response_speed,
          tone: agent.tone,
          opening_phrase: agent.opening_phrase,
          closing_phrase: agent.closing_phrase,
          public_api_key: agent.public_api_key,
          ingress_webhook_url: `${process.env.API_BASE_URL}/webhook/ingress/${agent.ingress_webhook_url_path}`,
          outbound_webhook_url: agent.outbound_webhook_url,
          knowledge_files: agent.KnowledgeFiles || [],
          integrations
        }
      });
    } catch (error) {
      console.error('Erro ao buscar agente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Atualizar configurações do agente
  async updateAgent(req, res) {
    try {
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

      const updateData = req.validatedData;

      // Atualizar campos permitidos
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          // Converter strings vazias para null em campos de URL
          if ((key === 'outbound_webhook_url' || key === 'avatar_url') && updateData[key] === '') {
            agent[key] = null;
          } else {
            agent[key] = updateData[key];
          }
        }
      });

      await agent.save();

      res.json({
        success: true,
        message: 'Configurações do agente atualizadas com sucesso',
        agent: {
          id: agent.id,
          name: agent.name,
          language: agent.language,
          mood: agent.mood,
          formality: agent.formality,
          allow_emojis: agent.allow_emojis,
          response_speed: agent.response_speed,
          tone: agent.tone,
          opening_phrase: agent.opening_phrase,
          closing_phrase: agent.closing_phrase,
          outbound_webhook_url: agent.outbound_webhook_url
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Upload do avatar do agente
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado',
          code: 'NO_FILE'
        });
      }

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

      // Upload local
      const fileUrl = await uploadToLocal(req.file, 'avatars');

      // Deletar avatar antigo se existir
      if (agent.avatar_url) {
        await deleteFromLocal(agent.avatar_url);
      }

      // Atualizar agente
      agent.avatar_url = fileUrl;
      await agent.save();

      res.json({
        success: true,
        message: 'Avatar do agente atualizado com sucesso',
        avatar_url: fileUrl
      });
    } catch (error) {
      console.error('Erro no upload do avatar:', error);
      res.status(500).json({
        error: 'Erro no upload do avatar',
        details: error.message,
        code: 'UPLOAD_ERROR'
      });
    }
  }

  // Regenerar API key
  async regenerateApiKey(req, res) {
    try {
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

      // Gerar nova API key
      agent.public_api_key = `sk_${uuidv4().replace(/-/g, '')}`;
      await agent.save();

      res.json({
        success: true,
        message: 'Nova API key gerada com sucesso',
        public_api_key: agent.public_api_key
      });
    } catch (error) {
      console.error('Erro ao regenerar API key:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Upload de arquivo para base de conhecimento
  async uploadKnowledgeFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado',
          code: 'NO_FILE'
        });
      }

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

      // Upload local
      const fileUrl = await uploadToLocal(req.file, 'knowledge');

      // Determinar tipo do arquivo
      const fileType = req.file.originalname.split('.').pop().toLowerCase();

      // Salvar no banco
      const knowledgeFile = await KnowledgeFile.create({
        agent_id: agent.id,
        file_name: req.file.originalname,
        file_url: fileUrl,
        file_type: fileType,
        file_size: req.file.size
      });

      res.json({
        success: true,
        message: 'Arquivo adicionado à base de conhecimento',
        file: {
          id: knowledgeFile.id,
          file_name: knowledgeFile.file_name,
          file_type: knowledgeFile.file_type,
          file_size: knowledgeFile.file_size,
          uploaded_at: knowledgeFile.uploaded_at
        }
      });
    } catch (error) {
      console.error('Erro no upload do arquivo:', error);
      res.status(500).json({
        error: 'Erro no upload do arquivo',
        details: error.message,
        code: 'UPLOAD_ERROR'
      });
    }
  }

  // Listar arquivos da base de conhecimento
  async getKnowledgeFiles(req, res) {
    try {
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

      const files = await KnowledgeFile.findAll({
        where: { agent_id: agent.id },
        order: [['uploaded_at', 'DESC']]
      });

      res.json({
        success: true,
        files: files.map(file => ({
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          file_size: file.file_size,
          uploaded_at: file.uploaded_at
        }))
      });
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Deletar arquivo da base de conhecimento
  async deleteKnowledgeFile(req, res) {
    try {
      const { fileId } = req.params;

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

      const file = await KnowledgeFile.findOne({
        where: {
          id: fileId,
          agent_id: agent.id
        }
      });

      if (!file) {
        return res.status(404).json({
          error: 'Arquivo não encontrado',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Deletar do storage local
      await deleteFromLocal(file.file_url);

      // Deletar do banco
      await file.destroy();

      res.json({
        success: true,
        message: 'Arquivo removido da base de conhecimento'
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Conectar integração
  async connectIntegration(req, res) {
    try {
      const { service, credentials } = req.validatedData;

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

      // Criptografar credenciais
      const encryptedCredentials = JSON.stringify(encryptionService.encryptJSON(credentials));

      // Verificar se integração já existe
      let integration = await Integration.findOne({
        where: {
          agent_id: agent.id,
          service_name: service
        }
      });

      if (integration) {
        // Atualizar existente
        integration.credentials = encryptedCredentials;
        integration.is_active = true;
        await integration.save();
      } else {
        // Criar nova
        integration = await Integration.create({
          agent_id: agent.id,
          service_name: service,
          credentials: encryptedCredentials,
          is_active: true
        });
      }

      // Configurar webhook se necessário
      if (service !== 'outbound_webhook') {
        try {
          await webhookService.setupServiceWebhook(agent, service, credentials);
        } catch (webhookError) {
          console.error('Erro ao configurar webhook:', webhookError);
          // Não falhar a integração por causa do webhook
        }
      }

      res.json({
        success: true,
        message: `${service} conectado com sucesso`,
        integration: {
          id: integration.id,
          service_name: integration.service_name,
          is_active: integration.is_active,
          connected_at: integration.connected_at
        }
      });
    } catch (error) {
      console.error('Erro ao conectar integração:', error);
      res.status(500).json({
        error: 'Erro ao conectar integração',
        details: error.message,
        code: 'INTEGRATION_ERROR'
      });
    }
  }

  // Testar webhook
  async testWebhook(req, res) {
    try {
      const agent = await Agent.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        }
      });

      if (!agent || !agent.outbound_webhook_url) {
        return res.status(400).json({
          error: 'URL do webhook não configurada',
          code: 'WEBHOOK_NOT_CONFIGURED'
        });
      }

      const result = await webhookService.testWebhookConnection(agent.outbound_webhook_url);

      res.json({
        success: result.success,
        message: result.message,
        details: result
      });
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      res.status(500).json({
        error: 'Erro ao testar webhook',
        details: error.message,
        code: 'WEBHOOK_TEST_ERROR'
      });
    }
  }
}

module.exports = new AgentController();
