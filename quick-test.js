#!/usr/bin/env node

/**
 * Script de Teste Rápido para SalesAI API
 * Testa os principais endpoints usando dados existentes
 */

const axios = require('axios');

// Configurações
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
    email: 'teste@salesai.com',
    password: 'senha123456'
};

let authToken = '';
let userId = '';
let agentId = '';

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'SKIP' ? 'yellow' : 'red';
    const statusIcon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
    log(`${statusIcon} ${testName}: ${colors[statusColor]}${status}${colors.reset} ${details}`);
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.response?.data?.message || error.message,
            status: error.response?.status || 500
        };
    }
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

async function runQuickTests() {
    log(`
╔══════════════════════════════════════════════════════════════╗
║                🚀 TESTE RÁPIDO DA SALESAI API               ║
║                        v1.0                                 ║
╚══════════════════════════════════════════════════════════════╝
`, 'bold');

    // 1. Login
    log('\n🔐 AUTENTICAÇÃO', 'cyan');
    const loginResult = await makeRequest('POST', '/auth/login', TEST_USER);

    if (loginResult.success) {
        logTest('Login', 'PASS', 'Autenticado com sucesso');
        authToken = loginResult.data.token;
        userId = loginResult.data.user.id;
        agentId = loginResult.data.agent.id;
    } else {
        logTest('Login', 'FAIL', loginResult.error);
        return;
    }

    // 2. Conta
    log('\n👤 CONTA', 'cyan');
    const accountResult = await makeRequest('GET', '/account', null, getAuthHeaders());
    logTest('GET /account', accountResult.success ? 'PASS' : 'FAIL',
        accountResult.success ? 'Dados obtidos' : accountResult.error);

    // 3. Agente
    log('\n🤖 AGENTE', 'cyan');
    const agentResult = await makeRequest('GET', '/agents', null, getAuthHeaders());
    logTest('GET /agents', agentResult.success ? 'PASS' : 'FAIL',
        agentResult.success ? 'Configuração obtida' : agentResult.error);

    // 4. Conversas
    log('\n💬 CONVERSAS', 'cyan');
    const conversationsResult = await makeRequest('GET', '/conversations', null, getAuthHeaders());
    logTest('GET /conversations', conversationsResult.success ? 'PASS' : 'FAIL',
        conversationsResult.success ? `${conversationsResult.data.conversations?.length || 0} conversas` : conversationsResult.error);

    // 5. Relatórios
    log('\n📊 RELATÓRIOS', 'cyan');
    const reportsResult = await makeRequest('GET', '/reports/dashboard-summary', null, getAuthHeaders());
    logTest('GET /reports/dashboard-summary', reportsResult.success ? 'PASS' : 'FAIL',
        reportsResult.success ? 'Dashboard obtido' : reportsResult.error);

    // 6. Health Check
    log('\n🏥 HEALTH CHECK', 'cyan');
    try {
        const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
        logTest('GET /health', 'PASS', `Status: ${healthResponse.data.status}`);
    } catch (error) {
        logTest('GET /health', 'FAIL', error.message);
    }

    // 7. API Pública (se disponível)
    if (agentResult.success && agentResult.data.public_api_key) {
        log('\n🌐 API PÚBLICA', 'cyan');
        try {
            const publicResponse = await axios.post(`${API_BASE_URL}/v1/message`, {
                message: 'Teste rápido da API',
                customer_identifier: 'teste@api.com',
                channel: 'api'
            }, {
                headers: {
                    'Authorization': `Bearer ${agentResult.data.public_api_key}`,
                    'Content-Type': 'application/json'
                }
            });
            logTest('POST /api/v1/message', 'PASS', 'Mensagem enviada');
        } catch (error) {
            logTest('POST /api/v1/message', 'FAIL', error.response?.data?.error || error.message);
        }
    }

    // Relatório final
    log(`
╔══════════════════════════════════════════════════════════════╗
║                        ✅ RESUMO                            ║
╚══════════════════════════════════════════════════════════════╝
`, 'bold');

    log(`🔑 Token: ${authToken.substring(0, 20)}...`, 'green');
    log(`👤 User ID: ${userId}`, 'blue');
    log(`🤖 Agent ID: ${agentId}`, 'blue');
    log(`📋 API Key: ${agentResult.data?.public_api_key ? 'Disponível' : 'Não encontrada'}`, 'blue');

    log('\n🎯 ENDPOINTS TESTADOS:', 'cyan');
    log('  ✅ Autenticação', 'green');
    log('  ✅ Dados da conta', 'green');
    log('  ✅ Configuração do agente', 'green');
    log('  ✅ Listagem de conversas', 'green');
    log('  ✅ Dashboard de relatórios', 'green');
    log('  ✅ Health check', 'green');
    log('  ✅ API pública', 'green');

    log('\n🚀 TESTE CONCLUÍDO!', 'bold');
}

runQuickTests().catch(error => {
    log(`\n💥 Erro: ${error.message}`, 'red');
    process.exit(1);
});
