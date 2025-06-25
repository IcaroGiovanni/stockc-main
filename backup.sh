#!/bin/bash

# Script de Backup Automático do Banco de Dados
# Sistema de Controle de Estoque

set -e

# Configurações
BACKUP_DIR="/backups"
DB_NAME="stock_control"
DB_USER="root"
DB_PASSWORD="password"
RETENTION_DAYS=30

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup com timestamp
BACKUP_FILE="$BACKUP_DIR/stock_control_$(date +%Y%m%d_%H%M%S).sql"

echo "🔄 Iniciando backup do banco de dados..."

# Fazer backup usando mysqldump
docker-compose exec -T db mysqldump \
    -u $DB_USER \
    -p$DB_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    $DB_NAME > $BACKUP_FILE

# Comprimir o backup
gzip $BACKUP_FILE

echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# Remover backups antigos (mais de 30 dias)
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "🧹 Backups antigos removidos (mais de $RETENTION_DAYS dias)"

# Verificar tamanho do backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "📊 Tamanho do backup: $BACKUP_SIZE"

# Listar backups existentes
echo "📋 Backups disponíveis:"
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado" 