const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ message: 'Backend funcionando!' });
});

// Rota de login básica
app.post('/api/auth/login', (req, res) => {
    console.log('Login attempt:', req.body);
    res.json({
        success: true,
        token: 'test-token-123',
        user: {
            id: '1',
            name: 'Test User',
            email: req.body.email
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
});
