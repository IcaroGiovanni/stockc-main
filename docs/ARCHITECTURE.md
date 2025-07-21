# 🏗️ Arquitetura do Sistema StockCtrl

## Visão Geral

O StockCtrl é um sistema de controle de estoque moderno, construído com arquitetura modular, seguindo princípios de Clean Architecture e boas práticas de desenvolvimento.

## 🏛️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (HTML/CSS/JS)                   │
├─────────────────────────────────────────────────────────────┤
│                    Nginx (Proxy Reverso)                    │
├─────────────────────────────────────────────────────────────┤
│                    API REST (Node.js/Express)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Redis     │  │   MySQL     │  │   File      │         │
│  │   (Cache)   │  │  (Database) │  │  Storage    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Diretórios

```
src/
├── config/           # Configurações do sistema
│   ├── database.js   # Configuração do banco de dados
│   ├── email.js      # Configuração de e-mail
│   ├── mysql.cnf     # Configuração MySQL
│   └── redis.conf    # Configuração Redis
├── middleware/       # Middlewares personalizados
│   └── auth.js       # Autenticação e autorização
├── services/         # Lógica de negócio
│   └── logger.js     # Sistema de logging
├── routes/           # Rotas da API
├── controllers/      # Controladores
├── models/           # Modelos de dados
└── utils/            # Utilitários

tests/
├── unit/             # Testes unitários
├── integration/      # Testes de integração
└── setup.js          # Configuração de testes
```

## 🔧 Componentes Principais

### 1. **API REST (Express.js)**
- **Framework**: Express.js 5.x
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Express Validator
- **Segurança**: Helmet, CORS, Rate Limiting
- **Logging**: Winston + Morgan

### 2. **Banco de Dados (MySQL 8.0)**
- **Sistema**: MySQL 8.0 com InnoDB
- **Pool de Conexões**: mysql2 com promise wrapper
- **Otimizações**: 
  - Buffer pool otimizado
  - Query cache habilitado
  - Slow query logging
  - UTF8MB4 para suporte completo a Unicode

### 3. **Cache (Redis 7)**
- **Versão**: Redis 7 Alpine
- **Uso**: Cache de sessões, dados frequentes
- **Configuração**: 
  - LRU eviction policy
  - Persistência AOF + RDB
  - Memory limit: 256MB

### 4. **Proxy Reverso (Nginx)**
- **Função**: Load balancing, SSL termination
- **Recursos**: 
  - Gzip compression
  - Static file serving
  - Rate limiting
  - Health checks

## 🔐 Segurança

### Autenticação e Autorização
- **JWT**: Tokens com expiração configurável
- **BCrypt**: Hash de senhas com salt rounds configurável
- **Roles**: Sistema de permissões baseado em roles
- **Rate Limiting**: Proteção contra ataques de força bruta

### Configurações de Segurança
- **Helmet**: Headers de segurança HTTP
- **CSP**: Content Security Policy
- **CORS**: Cross-Origin Resource Sharing configurado
- **SQL Injection**: Prepared statements
- **XSS**: Sanitização de inputs

## 🚀 Performance

### Otimizações de Banco de Dados
```sql
-- Índices otimizados
CREATE INDEX idx_products_empresa_codigo ON products(empresa_id, codigo);
CREATE INDEX idx_activity_logs_empresa_data ON activity_logs(empresa_id, created_at);

-- Configurações MySQL
innodb_buffer_pool_size = 256M
query_cache_size = 32M
max_connections = 200
```

### Cache Strategy
- **Redis**: Cache de consultas frequentes
- **TTL**: Time-to-live configurável por tipo de dado
- **Invalidation**: Cache invalidation automática

### Otimizações de Aplicação
- **Compression**: Gzip para responses
- **Connection Pooling**: Pool de conexões MySQL
- **Async/Await**: Operações assíncronas
- **Error Handling**: Tratamento robusto de erros

## 🧪 Testes

### Estratégia de Testes
- **Unit Tests**: Jest para testes unitários
- **Integration Tests**: Supertest para testes de API
- **Coverage**: Meta de 80% de cobertura
- **CI/CD**: Testes automáticos no pipeline

### Tipos de Testes
```javascript
// Testes Unitários
describe('Product Service', () => {
  it('should create product with valid data', () => {
    // Teste unitário
  });
});

// Testes de Integração
describe('Product API', () => {
  it('should return products for authenticated user', () => {
    // Teste de integração
  });
});
```

## 📊 Monitoramento

### Health Checks
- **Application**: `/health` endpoint
- **Database**: Connection pool health
- **Redis**: Cache availability
- **Docker**: Container health checks

### Logging
- **Winston**: Logging estruturado
- **Morgan**: HTTP request logging
- **Activity Logs**: Log de atividades do usuário
- **Error Tracking**: Centralized error handling

## 🐳 Containerização

### Docker Strategy
- **Multi-stage Build**: Otimização de imagem
- **Non-root User**: Segurança aprimorada
- **Health Checks**: Monitoramento automático
- **Resource Limits**: Controle de recursos

### Docker Compose
```yaml
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  
  db:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

## 🔄 CI/CD Pipeline

### GitHub Actions
1. **Test**: Linting, testes unitários e de integração
2. **Build**: Docker image build com multi-stage
3. **Security**: Audit de dependências, Snyk scan
4. **Deploy**: Deploy automático para staging/produção

### Ambientes
- **Development**: Docker Compose local
- **Staging**: Ambiente de homologação
- **Production**: Ambiente de produção com backup automático

## 📈 Escalabilidade

### Horizontal Scaling
- **Load Balancer**: Nginx como load balancer
- **Stateless**: Aplicação stateless para scaling
- **Database**: Read replicas para consultas
- **Cache**: Redis cluster para alta disponibilidade

### Vertical Scaling
- **Resources**: Limites de CPU e memória configuráveis
- **Database**: Otimizações de queries e índices
- **Application**: Pool de conexões otimizado

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=stock_control

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=password

# Redis
REDIS_URL=redis://localhost:6379
```

### Configurações de Produção
- **SSL/TLS**: Certificados SSL configurados
- **Backup**: Backup automático diário
- **Monitoring**: Logs centralizados
- **Alerts**: Notificações de erro

## 🛠️ Manutenção

### Backup Strategy
- **Database**: Backup diário com retenção de 7 dias
- **Files**: Backup de uploads
- **Configuration**: Versionamento de configurações

### Updates
- **Dependencies**: Atualizações automáticas de segurança
- **Database**: Migrations versionadas
- **Application**: Rolling updates

## 📚 Próximos Passos

### Melhorias Planejadas
1. **Microservices**: Migração para arquitetura de microserviços
2. **GraphQL**: Implementação de GraphQL para queries complexas
3. **Real-time**: WebSockets para atualizações em tempo real
4. **Analytics**: Dashboard de métricas e analytics
5. **Mobile**: API para aplicativo mobile

### Considerações de Segurança
1. **2FA**: Autenticação de dois fatores
2. **Audit Logs**: Logs de auditoria detalhados
3. **Encryption**: Criptografia de dados sensíveis
4. **Penetration Testing**: Testes de penetração regulares 