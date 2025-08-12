const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: 'Assistente Virtual',
    validate: {
      len: [2, 100]
    }
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'pt',
    validate: {
      isIn: [['pt', 'en', 'es']]
    }
  },
  mood: {
    type: DataTypes.STRING,
    defaultValue: 'friendly',
    validate: {
      isIn: [['friendly', 'professional', 'casual', 'formal']]
    }
  },
  formality: {
    type: DataTypes.STRING,
    defaultValue: 'informal',
    validate: {
      isIn: [['informal', 'formal', 'mixed']]
    }
  },
  allow_emojis: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  response_speed: {
    type: DataTypes.STRING,
    defaultValue: 'balanced',
    validate: {
      isIn: [['fast', 'balanced', 'detailed']]
    }
  },
  tone: {
    type: DataTypes.STRING,
    defaultValue: 'supportive',
    validate: {
      isIn: [['supportive', 'assertive', 'empathetic', 'neutral']]
    }
  },
  opening_phrase: {
    type: DataTypes.TEXT,
    defaultValue: 'Olá! Sou o assistente virtual. Como posso te ajudar hoje?'
  },
  closing_phrase: {
    type: DataTypes.TEXT,
    defaultValue: 'Foi um prazer ajudar! Se precisar de mais alguma coisa, estou à disposição.'
  },
  public_api_key: {
    type: DataTypes.STRING,
    unique: true,
    defaultValue: () => `sk_${uuidv4().replace(/-/g, '')}`
  },
  ingress_webhook_url_path: {
    type: DataTypes.STRING,
    unique: true,
    defaultValue: () => uuidv4()
  },
  outbound_webhook_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        args: true,
        msg: 'URL do webhook deve ser uma URL válida'
      },
      customValidator(value) {
        // Permite null, undefined ou string vazia
        if (!value || value === '') {
          return;
        }
        // Se tem valor, deve ser uma URL válida
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(value)) {
          throw new Error('URL do webhook deve ser uma URL válida (http:// ou https://)');
        }
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'agents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Agent;
