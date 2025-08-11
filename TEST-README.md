# 🧪 Script de Teste da SalesAI API

Este script testa automaticamente todos os endpoints da API SalesAI, validando funcionalidades de autenticação, agentes, conversas, relatórios e muito mais.

## 🚀 Como usar

### 1. Preparação
Certifique-se de que o servidor backend está rodando:
```bash
cd backend
npm run dev
```

### 2. Instalação das dependências do teste
```bash
# Na pasta raiz do projeto
npm install
```

### 3. Executar todos os testes
```bash
npm test
# ou
node test-api.js
```

### 4. Executar testes específicos
```bash
# Testar apenas autenticação
npm run test:auth

# Testar apenas conta
npm run test:account

# Testar apenas agente
npm run test:agent

# Testar apenas conversas
npm run test:conversations

# Testar apenas relatórios
npm run test:reports

# Testar apenas webhooks
npm run test:webhook

# Testar apenas API pública
npm run test:public
```

## 📋 O que é testado

### 🔐 Autenticação
- ✅ Registro de usuário
- ✅ Login
- ✅ Verificação de token JWT

### 👤 Conta
- ✅ Buscar dados do perfil
- ✅ Atualizar perfil
- ✅ Alterar senha

### 🤖 Agente IA
- ✅ Buscar configuração
- ✅ Atualizar configuração
- ✅ Gerar nova API key
- ✅ Buscar estatísticas

### 💬 Conversas
- ✅ Listar conversas
- ✅ Buscar conversa específica
- ✅ Atualizar status da conversa
- ✅ Simulação de criação de conversa

### 📊 Relatórios
- ✅ Dashboard de métricas
- ✅ Relatório de conversas
- ✅ Relatório de performance

### 🔗 Webhooks
- ✅ Verificação de webhook (GET)
- ✅ Processamento de webhook (POST)
- ✅ Validação de webhook path

### 🌐 API Pública
- ✅ Envio de mensagem via API key
- ✅ Validação de API key inválida

## 📊 Output do teste

O script produz uma saída colorida e detalhada:

```
🧪 TESTE COMPLETO DA API
SalesAI v1.0

🔐 TESTANDO ENDPOINTS DE AUTENTICAÇÃO
==================================================

1. Testando Registro de Usuário...
✅ POST /auth/register: PASS Usuário registrado com sucesso

2. Testando Login...
✅ POST /auth/login: PASS Login realizado com sucesso

3. Testando Verificação de Token...
✅ GET /auth/verify: PASS Token válido

👤 TESTANDO ENDPOINTS DE CONTA
========================================

...

📋 RELATÓRIO FINAL
==================================================
⏱️  Tempo total: 15.67s
📊 Status: Testes concluídos
🔑 Token de autenticação: Obtido
👤 User ID: uuid-12345
🤖 Agent ID: uuid-67890

🚀 API TESTADA COM SUCESSO!
```

## ⚙️ Configuração

O script usa as seguintes configurações padrão:

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
    name: 'Usuario Teste',
    email: 'teste@salesai.com',
    password: 'senha123456'
};
```

Para alterar essas configurações, edite o arquivo `test-api.js`.

## 🔧 Troubleshooting

### API não está respondendo
- Verifique se o servidor backend está rodando
- Confirme se a porta 3001 está disponível
- Verifique se o PostgreSQL está rodando

### Testes de autenticação falhando
- Verifique se o banco de dados está configurado
- Confirme se as variáveis de ambiente estão corretas
- Verifique se o JWT_SECRET está definido

### Testes de webhook falhando
- Certifique-se de que o agente tem um webhook path configurado
- Verifique se as rotas de webhook estão ativas

## 📝 Personalização

Você pode personalizar os testes editando o arquivo `test-api.js`:

- Adicionar novos endpoints
- Modificar dados de teste
- Alterar configurações de timeout
- Personalizar o output

## 🎯 Casos de uso

1. **Desenvolvimento**: Testar após mudanças no código
2. **CI/CD**: Integrar nos pipelines de deployment
3. **Debugging**: Identificar problemas específicos
4. **Documentação**: Validar se a API funciona conforme documentado
5. **Performance**: Medir tempo de resposta dos endpoints

## 🔄 Integração Contínua

Para usar em CI/CD, adicione ao seu pipeline:

```yaml
# .github/workflows/test.yml
- name: Test API
  run: |
    npm install
    npm test
```

---

**🚀 API SalesAI - Testada e validada!**
