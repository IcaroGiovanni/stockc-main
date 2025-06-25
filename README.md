# 🏢 StockCtrl - Sistema de Controle de Estoque

## 📋 Visão Geral
Sistema completo de controle de estoque com autenticação, gestão de usuários, produtos e relatórios.

## 🏗️ Arquitetura Atual

### Backend (Node.js + Express)
- **Framework**: Express.js 5.1.0
- **Banco de Dados**: MySQL com pool de conexões
- **Autenticação**: JWT + bcrypt
- **Segurança**: Helmet, CORS, validação de uploads
- **Uploads**: Multer com validação de tipos
- **Notificações**: Nodemailer com Ethereal

### Frontend (Vanilla JavaScript)
- **Estrutura**: Páginas HTML estáticas
- **Estilização**: CSS modular com design system
- **Interatividade**: JavaScript vanilla com fetch API
- **Responsividade**: Design mobile-first

## 🚀 Melhorias Arquiteturais Recomendadas

### 1. Reestruturação de Pastas
```
projeto-estoque/
├── src/
│   ├── controllers/     # Lógica de negócio
│   ├── middleware/      # Middlewares customizados
│   ├── models/         # Modelos de dados
│   ├── routes/         # Definição de rotas
│   ├── services/       # Serviços externos
│   ├── utils/          # Utilitários
│   └── config/         # Configurações
├── public/             # Frontend (mantido)
├── tests/              # Testes automatizados
├── docs/               # Documentação
└── scripts/            # Scripts de deploy/migração
```

### 2. Implementação de Testes
- **Jest** para testes unitários
- **Supertest** para testes de integração
- **Cypress** para testes E2E

### 3. Validação de Dados
- **Joi** ou **Yup** para validação de schemas
- Validação consistente em todas as rotas

### 4. Logging Estruturado
- **Winston** para logs estruturados
- Diferentes níveis de log (error, warn, info, debug)

### 5. Cache e Performance
- **Redis** para cache de sessões
- **Compression** para otimização de resposta

## 📦 Dependências Principais

### Backend
```json
{
  "express": "^5.1.0",
  "mysql2": "^3.6.5",
  "bcrypt": "^6.0.0",
  "jsonwebtoken": "^9.0.2",
  "helmet": "^8.1.0",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^6.9.8"
}
```

### Dev Dependencies (Recomendadas)
```json
{
  "jest": "^29.0.0",
  "supertest": "^6.0.0",
  "nodemon": "^3.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

## 🔧 Scripts Recomendados

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "migrate": "node scripts/migration.js"
  }
}
```

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar banco de dados**:
   - Criar database `stock_control`
   - Executar `node migration.js`

3. **Iniciar servidor**:
   ```bash
   npm start
   ```

4. **Acessar aplicação**:
   - URL: http://localhost:3000
   - Usuário padrão: `admin`
   - Senha padrão: `admin123`

## 🔒 Segurança

### Implementado
- ✅ JWT para autenticação
- ✅ bcrypt para hash de senhas
- ✅ Helmet para headers de segurança
- ✅ Validação de uploads
- ✅ CORS configurado

### Recomendado
- 🔄 Rate limiting
- 🔄 Validação de entrada com Joi/Yup
- 🔄 Logs de auditoria estruturados
- 🔄 Variáveis de ambiente (.env)

## 📊 Monitoramento

### Implementado
- ✅ Logs de atividade básicos
- ✅ Notificações por e-mail

### Recomendado
- 🔄 Métricas de performance
- 🔄 Health checks
- 🔄 Alertas automáticos
- 🔄 Dashboard de monitoramento

## 🔄 Próximos Passos

1. **Refatoração da estrutura de pastas**
2. **Implementação de testes automatizados**
3. **Adição de validação de dados**
4. **Configuração de ambiente (.env)**
5. **Implementação de cache**
6. **Documentação da API**
7. **CI/CD pipeline**

## 📝 Notas de Desenvolvimento

- O sistema usa MySQL com pool de conexões para melhor performance
- Uploads são validados e armazenados com nomes únicos
- Sistema de logs registra todas as atividades importantes
- Frontend usa design system consistente
- Responsividade implementada para mobile

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Adicione testes
5. Faça commit das mudanças
6. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. 