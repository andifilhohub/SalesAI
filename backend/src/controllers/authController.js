const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');

class AuthController {
  // Login do usuário
  async login(req, res) {
    try {
      const { email, password } = req.validatedData;

      // Buscar usuário
      const user = await User.findOne({ where: { email, is_active: true } });
      if (!user) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Buscar agente do usuário (criar um se não existir)
      let agent = await Agent.findOne({ where: { user_id: user.id, is_active: true } });
      if (!agent) {
        agent = await Agent.create({ user_id: user.id });
      }

      // Gerar JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          agentId: agent.id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture_url: user.profile_picture_url,
          subscription_plan: user.subscription_plan
        },
        agent: {
          id: agent.id,
          name: agent.name,
          public_api_key: agent.public_api_key
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Registro de novo usuário
  async register(req, res) {
    try {
      const { name, email, password } = req.validatedData;

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email já está em uso',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash da senha
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const user = await User.create({
        name,
        email,
        password_hash,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      });

      // Criar agente padrão
      const agent = await Agent.create({
        user_id: user.id,
        name: `Assistente de ${name}`
      });

      // Gerar JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          agentId: agent.id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscription_plan: user.subscription_plan
        },
        agent: {
          id: agent.id,
          name: agent.name,
          public_api_key: agent.public_api_key
        }
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Verificar token (para validação do frontend)
  async verifyToken(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Agent,
          where: { is_active: true },
          required: false
        }]
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture_url: user.profile_picture_url,
          subscription_plan: user.subscription_plan
        },
        agent: user.Agents && user.Agents.length > 0 ? {
          id: user.Agents[0].id,
          name: user.Agents[0].name,
          public_api_key: user.Agents[0].public_api_key
        } : null
      });
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new AuthController();
