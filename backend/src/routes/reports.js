const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Dashboard summary
router.get('/dashboard-summary', reportController.getDashboardSummary);

// Atividades recentes
router.get('/recent-activity', reportController.getRecentActivity);

// Gráfico de conversas
router.get('/conversations-chart', reportController.getConversationsChart);

// Gráfico de satisfação
router.get('/satisfaction-chart', reportController.getSatisfactionChart);

// Tópicos mais frequentes
router.get('/top-topics', reportController.getTopTopics);

module.exports = router;
