const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');

// Middleware para autenticar JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware para verificar se o usuário tem acesso ao agente
const checkAgentOwnership = async (req, res, next) => {
  try {
    const agentId = req.params.agentId || req.body.agentId;

    if (!agentId) {
      return res.status(400).json({
        error: 'ID do agente é obrigatório',
        code: 'MISSING_AGENT_ID'
      });
    }

    const agent = await Agent.findOne({
      where: {
        id: agentId,
        user_id: req.user.id
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agente não encontrado ou você não tem permissão para acessá-lo',
        code: 'AGENT_NOT_FOUND'
      });
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Erro no middleware checkAgentOwnership:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para autenticar API key pública
const authenticateApiKey = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key requerida',
      code: 'MISSING_API_KEY'
    });
  }

  try {
    const agent = await Agent.findOne({
      where: {
        public_api_key: apiKey,
        is_active: true
      },
      include: [{
        model: User,
        where: { is_active: true }
      }]
    });

    if (!agent) {
      return res.status(401).json({
        error: 'API key inválida',
        code: 'INVALID_API_KEY'
      });
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Erro no middleware authenticateApiKey:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  checkAgentOwnership,
  authenticateApiKey
};
