const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KnowledgeFile = sequelize.define('KnowledgeFile', {
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
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['pdf', 'txt', 'doc', 'docx']]
    }
  },
  file_size: {
    type: DataTypes.INTEGER, // em bytes
    allowNull: true
  }
}, {
  tableName: 'knowledge_files',
  timestamps: true,
  createdAt: 'uploaded_at',
  updatedAt: false
});

module.exports = KnowledgeFile;
