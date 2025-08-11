const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { uploadToLocal, deleteFromLocal } = require('../config/storage');

class AccountController {
  // Obter dados da conta
  async getAccount(req, res) {
    try {
      const user = await User.findByPk(req.user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture_url: user.profile_picture_url,
          subscription_plan: user.subscription_plan,
          next_billing_date: user.next_billing_date,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados da conta:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Atualizar informações da conta
  async updateAccount(req, res) {
    try {
      const { name, email } = req.validatedData;
      const user = await User.findByPk(req.user.id);

      // Verificar se o novo email já está em uso (se foi alterado)
      if (email && email !== user.email) {
        const emailExists = await User.findOne({
          where: { email, id: { [require('sequelize').Op.ne]: user.id } }
        });

        if (emailExists) {
          return res.status(409).json({
            error: 'Email já está em uso por outro usuário',
            code: 'EMAIL_EXISTS'
          });
        }
      }

      // Atualizar campos
      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();

      res.json({
        success: true,
        message: 'Conta atualizada com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_picture_url: user.profile_picture_url,
          subscription_plan: user.subscription_plan
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Upload da foto de perfil
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado',
          code: 'NO_FILE'
        });
      }

      // Upload local
      const fileUrl = await uploadToLocal(req.file, 'profiles');

      // Atualizar usuário
      const user = await User.findByPk(req.user.id);
      user.profile_picture_url = fileUrl;
      await user.save();

      res.json({
        success: true,
        message: 'Foto de perfil atualizada com sucesso',
        profile_picture_url: fileUrl
      });
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      res.status(500).json({
        error: 'Erro no upload da foto',
        details: error.message,
        code: 'UPLOAD_ERROR'
      });
    }
  }

  // Alterar senha
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.validatedData;
      const user = await User.findByPk(req.user.id);

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Senha atual incorreta',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash da nova senha
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      user.password_hash = newPasswordHash;
      await user.save();

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obter informações de billing
  async getBillingInfo(req, res) {
    try {
      const user = await User.findByPk(req.user.id);

      // Simular informações de cobrança
      const planFeatures = {
        'Básico': [
          'Até 1 agente',
          '1.000 mensagens/mês',
          '2 integrações',
          'Suporte por email'
        ],
        'Profissional': [
          'Até 5 agentes simultâneos',
          '10.000 mensagens/mês',
          'Integrações ilimitadas',
          'Suporte prioritário',
          'Relatórios avançados',
          'API completa'
        ],
        'Enterprise': [
          'Agentes ilimitados',
          'Mensagens ilimitadas',
          'Integrações ilimitadas',
          'Suporte 24/7',
          'Relatórios personalizados',
          'API completa',
          'White label'
        ]
      };

      res.json({
        success: true,
        billing: {
          current_plan: user.subscription_plan,
          next_billing_date: user.next_billing_date,
          features: planFeatures[user.subscription_plan] || [],
          billing_amount: user.subscription_plan === 'Básico' ? 29.90 :
            user.subscription_plan === 'Profissional' ? 99.90 : 299.90
        }
      });
    } catch (error) {
      console.error('Erro ao buscar informações de cobrança:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new AccountController();
