const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Importar modelos para sincronização
const User = require('./models/User');
const Agent = require('./models/Agent');
const KnowledgeFile = require('./models/KnowledgeFile');
const Integration = require('./models/Integration');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Definir relacionamentos
User.hasMany(Agent, { foreignKey: 'user_id' });
Agent.belongsTo(User, { foreignKey: 'user_id' });

Agent.hasMany(KnowledgeFile, { foreignKey: 'agent_id' });
KnowledgeFile.belongsTo(Agent, { foreignKey: 'agent_id' });

Agent.hasMany(Integration, { foreignKey: 'agent_id' });
Integration.belongsTo(Agent, { foreignKey: 'agent_id' });

Agent.hasMany(Conversation, { foreignKey: 'agent_id' });
Conversation.belongsTo(Agent, { foreignKey: 'agent_id' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// Importar rotas
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const agentRoutes = require('./routes/agents');
const conversationRoutes = require('./routes/conversations');
const reportRoutes = require('./routes/reports');
const webhookRoutes = require('./routes/webhook');
const publicApiRoutes = require('./routes/publicApi');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middlewares globais
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting para API geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por janela
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Rate limiting mais restritivo para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por janela
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Aplicar rate limiting (desabilitado em modo teste)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter);
  app.use('/api/', generalLimiter);
}

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} entrou na conversa ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} saiu da conversa ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Disponibilizar io para as rotas
app.set('io', io);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    storage: 'local'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reports', reportRoutes);

// Rotas públicas (sem rate limiting estrito)
app.use('/webhook', webhookRoutes);
app.use('/api/v1', publicApiRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    code: 'NOT_FOUND'
  });
});

const PORT = process.env.PORT || 3001;

// Sincronizar modelos e iniciar servidor
const startServer = async () => {
  try {
    // Sincronizar banco de dados
    const sequelize = require('./config/database');
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados');

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
