// Sistema de autenticação para AI Agent Platform
class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Verificar se usuário está logado
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Fazer login
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao fazer login');
            }

            const data = await response.json();

            // Armazenar token e dados do usuário
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            return data;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    // Fazer logout
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // Verificar se token é válido
    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            this.logout();
            return false;
        }
    }

    // Obter cabeçalhos de autorização
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Fazer requisições autenticadas
    async authenticatedFetch(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        return response;
    }

    // Verificar autenticação e redirecionar se necessário
    async checkAuthAndRedirect() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');

        // Mostrar loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const appContent = document.getElementById('app-content');

        if (this.isAuthenticated()) {
            // Verificar se token ainda é válido
            const isValid = await this.verifyToken();

            if (isValid && isLoginPage) {
                // Se está logado e na página de login, redirecionar para dashboard
                window.location.href = 'index.html';
                return false;
            } else if (!isValid) {
                // Token inválido, redirecionar para login
                if (!isLoginPage) {
                    window.location.href = 'login.html';
                }
                return false;
            } else {
                // Usuário autenticado, mostrar conteúdo
                if (loadingScreen) loadingScreen.classList.add('hidden');
                if (appContent) appContent.classList.remove('hidden');
                return true;
            }
        } else {
            // Não está logado
            if (!isLoginPage) {
                window.location.href = 'login.html';
                return false;
            } else {
                // Está na página de login, esconder loading
                if (loadingScreen) loadingScreen.classList.add('hidden');
                return false;
            }
        }
    }

    // Obter dados do usuário
    getUser() {
        return this.user;
    }

    // Atualizar dados do usuário
    updateUser(userData) {
        this.user = { ...this.user, ...userData };
        localStorage.setItem('user', JSON.stringify(this.user));
    }
}

// Instanciar o gerenciador de autenticação
const authManager = new AuthManager();

// Verificar autenticação imediatamente (antes do DOM estar pronto)
(async function () {
    await authManager.checkAuthAndRedirect();
})();

// Verificar autenticação ao carregar a página (backup)
document.addEventListener('DOMContentLoaded', async function () {
    await authManager.checkAuthAndRedirect();
});

// Exportar para uso global
window.authManager = authManager;
