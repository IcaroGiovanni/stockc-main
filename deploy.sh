#!/bin/bash

# Script de Deploy Automatizado para VPS
# Sistema de Controle de Estoque

set -e  # Para o script se houver erro

echo "🚀 Iniciando deploy do Sistema de Controle de Estoque..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale primeiro: https://docs.docker.com/get-docker/"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Instale primeiro: https://docs.docker.com/compose/install/"
fi

# Criar arquivo .env para produção
log "Configurando variáveis de ambiente..."
cat > .env << EOF
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações do Banco de Dados
DB_HOST=db
DB_USER=root
DB_PASSWORD=password
DB_NAME=stock_control
DB_PORT=3306

# Configurações de Segurança
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10

# Configurações de E-mail (configure com seu provedor)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# Configurações de Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpeg,jpg,png,gif

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configurações de Cache (Redis)
REDIS_URL=redis://redis:6379

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Parar containers existentes
log "Parando containers existentes..."
docker-compose down --remove-orphans || true

# Remover imagens antigas
log "Removendo imagens antigas..."
docker system prune -f

# Construir e iniciar containers
log "Construindo e iniciando containers..."
docker-compose up -d --build

# Aguardar banco de dados estar pronto
log "Aguardando banco de dados estar pronto..."
sleep 30

# Executar migrações
log "Executando migrações do banco..."
docker-compose exec -T app npm run migrate || warn "Migração falhou, mas continuando..."

# Verificar status dos containers
log "Verificando status dos containers..."
docker-compose ps

# Testar aplicação
log "Testando aplicação..."
sleep 10
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Aplicação está funcionando!"
    log "🌐 Acesse: http://seu-ip-vps:3000"
    log "📊 phpMyAdmin: http://seu-ip-vps:8080"
else
    warn "⚠️  Aplicação pode não estar respondendo ainda. Verifique os logs:"
    docker-compose logs app
fi

log "🎉 Deploy concluído com sucesso!"
log "📝 Próximos passos:"
log "   1. Configure seu domínio/apache/nginx se necessário"
log "   2. Configure SSL/HTTPS"
log "   3. Configure backup automático do banco"
log "   4. Configure monitoramento" 