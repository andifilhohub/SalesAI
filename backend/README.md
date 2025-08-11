# SalesAI Backend API

API completa para a plataforma de agente de IA SalesAI.

## 🚀 Características

- ✅ Autenticação JWT
- ✅ Upload de arquivos para S3
- ✅ WebSocket para chat em tempo real
- ✅ Criptografia de credenciais
- ✅ Rate limiting
- ✅ Validação de dados
- ✅ API pública para integrações
- ✅ Sistema de webhooks
- ✅ Relatórios e analytics

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- AWS S3 (ou compatível)

## 🛠️ Instalação

1. **Clone e instale dependências:**
```bash
cd backend
npm install
```

2. **Configure o banco de dados:**
```bash
# Crie o banco PostgreSQL
createdb salesai_db

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Configure as variáveis de ambiente (.env):**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/salesai_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key!!
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-name
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
```

4. **Inicie o servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Documentação da API

### Autenticação

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/register
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "password123"
}
```

### Configuração do Agente

#### GET /api/agents
Retorna as configurações do agente

#### PUT /api/agents
Atualiza configurações do agente
```json
{
  "name": "Meu Assistente",
  "language": "pt",
  "mood": "friendly",
  "formality": "informal",
  "allow_emojis": true,
  "response_speed": "balanced",
  "tone": "supportive",
  "opening_phrase": "Olá! Como posso ajudar?",
  "closing_phrase": "Foi um prazer ajudar!"
}
```

#### POST /api/agents/avatar
Upload do avatar (multipart/form-data)

#### POST /api/agents/knowledge
Upload de arquivo para base de conhecimento (multipart/form-data)

### Integrações

#### POST /api/agents/integrations
```json
{
  "service": "whatsapp",
  "credentials": {
    "token": "your-whatsapp-token",
    "phone_number_id": "your-phone-id"
  }
}
```

### Conversas

#### GET /api/conversations
Lista conversas com filtros opcionais

#### GET /api/conversations/:id/messages
Obtém mensagens de uma conversa

#### POST /api/conversations/:id/messages
Envia mensagem como operador
```json
{
  "content": "Olá, como posso ajudar?"
}
```

### API Pública

#### POST /api/v1/messages
Envia mensagem via API (requer API key)
```bash
curl -X POST \
  -H "Authorization: Bearer sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, preciso de ajuda", "customer_identifier": "João"}' \
  https://your-api.com/api/v1/messages
```

### Webhooks

#### POST /webhook/ingress/:webhookPath
Recebe mensagens de serviços externos (WhatsApp, Telegram, etc.)

#### GET /webhook/ingress/:webhookPath
Verificação de webhook (para WhatsApp)

## 🔧 Estrutura do Projeto

```
src/
├── config/           # Configurações (DB, Storage)
├── controllers/      # Lógica de negócio
├── middleware/       # Autenticação, validação, upload
├── models/          # Modelos do banco de dados
├── routes/          # Definição das rotas
├── services/        # Serviços (IA, Webhook, Crypto)
└── app.js          # Aplicação principal
```

## 🔐 Segurança

- JWT para autenticação
- Rate limiting em todas as rotas
- Criptografia de credenciais sensíveis
- Validação de entrada com Joi
- Helmet para headers de segurança
- CORS configurado

## 📊 Monitoramento

- Health check: `GET /health`
- Logs estruturados no console
- WebSocket para atualizações em tempo real

## 🚀 Deploy

### Usando PM2
```bash
npm install -g pm2
pm2 start src/app.js --name "salesai-api"
pm2 startup
pm2 save
```

### Usando Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔗 Integrações Suportadas

- **WhatsApp Business API**
- **Telegram Bot API**
- **Twilio SMS**
- **Webhook genérico**

## 📝 Exemplo de Integração

### Frontend JavaScript
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
};

// Enviar mensagem
const sendMessage = async (conversationId, content) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ content })
  });
  return response.json();
};
```

### WebSocket
```javascript
const socket = io('http://localhost:3001');

socket.on('new_message', (message) => {
  console.log('Nova mensagem:', message);
});

socket.emit('join_conversation', conversationId);
```

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `psql $DATABASE_URL`

### Erro de upload S3
- Verifique as credenciais AWS
- Confirme as permissões do bucket
- Teste com AWS CLI: `aws s3 ls`

### Webhook não funciona
- Verifique se a URL está acessível externamente
- Use ngrok para desenvolvimento: `ngrok http 3001`
- Confirme o formato do payload no serviço externo

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
