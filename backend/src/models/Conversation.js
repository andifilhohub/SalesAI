const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  agent_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'agents',
      key: 'id'
    }
  },
  customer_identifier: {
    type: DataTypes.STRING,
    allowNull: false // Nome ou telefone do cliente
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'closed', 'pending_ai', 'pending_human']]
    }
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['web', 'whatsapp', 'telegram', 'sms', 'api']]
    }
  },
  last_activity_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  satisfaction_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  tags: {
    type: DataTypes.JSON, // Array de tags
    defaultValue: []
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Conversation;
