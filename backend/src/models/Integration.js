const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Integration = sequelize.define('Integration', {
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
  service_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['whatsapp', 'telegram', 'twilio', 'outbound_webhook']]
    }
  },
  credentials: {
    type: DataTypes.TEXT, // JSON criptografado
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'integrations',
  timestamps: true,
  createdAt: 'connected_at',
  updatedAt: 'updated_at'
});

module.exports = Integration;
