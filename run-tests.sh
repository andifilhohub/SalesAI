#!/bin/bash

# 🧪 Script de Execução de Testes - SalesAI API
# Este script facilita a execução dos testes da API

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   🧪 TESTES SALESAI API                     ║"
echo "║                      Script Helper                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Função para verificar se o servidor está rodando
check_server() {
    echo "🔍 Verificando servidor..."
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Servidor está rodando"
        return 0
    else
        echo "❌ Servidor não está rodando"
        return 1
    fi
}

# Função para iniciar servidor em modo teste
start_test_server() {
    echo "🚀 Iniciando servidor em modo teste..."
    cd backend
    
    # Parar servidor existente se houver
    pkill -f "node.*src/app.js" 2>/dev/null
    sleep 2
    
    # Iniciar servidor em background
    NODE_ENV=test node src/app.js &
    SERVER_PID=$!
    
    echo "⏳ Aguardando servidor inicializar..."
    sleep 5
    
    if check_server; then
        echo "✅ Servidor iniciado com PID: $SERVER_PID"
        cd ..
        return 0
    else
        echo "❌ Falha ao iniciar servidor"
        cd ..
        return 1
    fi
}

# Função para executar teste rápido
run_quick_test() {
    echo ""
    echo "🏃‍♂️ Executando teste rápido..."
    echo "──────────────────────────────────────────────────────────────"
    node quick-test.js
}

# Função para executar teste completo
run_full_test() {
    echo ""
    echo "🔬 Executando teste completo..."
    echo "──────────────────────────────────────────────────────────────"
    node test-api.js
}

# Menu principal
show_menu() {
    echo ""
    echo "Escolha uma opção:"
    echo "1) 🏃‍♂️ Teste Rápido (quick-test.js)"
    echo "2) 🔬 Teste Completo (test-api.js)"
    echo "3) 🚀 Iniciar Servidor + Teste Rápido"
    echo "4) 🔧 Iniciar Servidor + Teste Completo"
    echo "5) 📋 Ver Relatório de Testes"
    echo "6) ❌ Sair"
    echo ""
    read -p "Digite sua escolha (1-6): " choice
}

# Loop principal
while true; do
    show_menu
    
    case $choice in
        1)
            if check_server; then
                run_quick_test
            else
                echo "❌ Servidor não está rodando. Use a opção 3 para iniciar."
            fi
            ;;
        2)
            if check_server; then
                run_full_test
            else
                echo "❌ Servidor não está rodando. Use a opção 4 para iniciar."
            fi
            ;;
        3)
            if start_test_server; then
                run_quick_test
            fi
            ;;
        4)
            if start_test_server; then
                run_full_test
            fi
            ;;
        5)
            echo ""
            echo "📋 Abrindo relatório de testes..."
            if [ -f "REPORT-API-TESTS.md" ]; then
                cat REPORT-API-TESTS.md
            else
                echo "❌ Relatório não encontrado"
            fi
            ;;
        6)
            echo ""
            echo "👋 Saindo..."
            # Parar servidor se foi iniciado por este script
            if [ ! -z "$SERVER_PID" ]; then
                echo "🛑 Parando servidor..."
                kill $SERVER_PID 2>/dev/null
            fi
            exit 0
            ;;
        *)
            echo "❌ Opção inválida. Tente novamente."
            ;;
    esac
    
    echo ""
    read -p "Pressione ENTER para continuar..."
done
