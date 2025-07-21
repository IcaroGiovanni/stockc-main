# 🚀 Guia de Desenvolvimento - StockCtrl

## 📋 Pré-requisitos

- **Node.js** 16+ 
- **MySQL** 8.0+
- **Git**
- **Docker** (opcional)

## 🛠️ Configuração Inicial

### 1. Clone e Instale
```bash
git clone <repository-url>
cd projeto-estoque
npm install
```

### 2. Configure o Ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite as variáveis de ambiente
nano .env
```

### 3. Configure o Banco de Dados
```bash
# Crie o banco de dados
mysql -u root -p
CREATE DATABASE stock_control;

# Execute a migração
npm run migrate
```

### 4. Inicie o Desenvolvimento
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
projeto-estoque/
├── 📁 public/                 # Frontend estático
│   ├── 📁 css/               # Estilos
│   ├── 📁 js/                # JavaScript do cliente
│   ├── 📁 pages/             # Páginas HTML
│   └── 📁 uploads/           # Uploads de arquivos
├── 📁 tests/                 # Testes automatizados
├── 📁 docs/                  # Documentação
├── 📄 server.js              # Servidor principal
├── 📄 migration.js           # Migrações do banco
├── 📄 package.json           # Dependências
└── 📄 README.md              # Documentação principal
```

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor em produção |
| `npm run dev` | Inicia o servidor em desenvolvimento com nodemon |
| `npm test` | Executa todos os testes |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:coverage` | Executa testes com relatório de cobertura |
| `npm run lint` | Verifica qualidade do código |
| `npm run lint:fix` | Corrige problemas de linting automaticamente |
| `npm run format` | Formata o código com Prettier |
| `npm run migrate` | Executa migrações do banco |
| `npm run setup` | Instala dependências e executa migração |

## 🧪 Testes

### Executando Testes
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Com cobertura
npm run test:coverage

# Teste específico
npm test -- --testNamePattern="login"
```

### Estrutura de Testes
```
tests/
├── 📄 setup.js              # Configuração global
├── 📄 auth.test.js          # Testes de autenticação
├── 📄 products.test.js      # Testes de produtos
├── 📄 users.test.js         # Testes de usuários
└── 📄 integration.test.js   # Testes de integração
```

### Convenções de Teste
- Use `describe` para agrupar testes relacionados
- Use `it` ou `test` para casos de teste individuais
- Use `beforeEach`/`afterEach` para setup/cleanup
- Use `beforeAll`/`afterAll` para setup global
- Nomeie testes de forma descritiva

```javascript
describe('Autenticação', () => {
  describe('POST /login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Teste aqui
    });
    
    it('deve rejeitar credenciais inválidas', async () => {
      // Teste aqui
    });
  });
});
```

## 📝 Padrões de Código

### JavaScript
- Use **ES6+** features (const, let, arrow functions, etc.)
- Use **async/await** em vez de callbacks
- Use **template literals** em vez de concatenação
- Use **destructuring** quando apropriado
- Use **spread/rest operators** quando útil

### Nomenclatura
- **Variáveis/Funções**: camelCase
- **Classes**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Arquivos**: kebab-case
- **Pastas**: kebab-case

### Estrutura de Funções
```javascript
// ✅ Bom
const getUserById = async (id) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return user[0];
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw new Error('Usuário não encontrado');
  }
};

// ❌ Evite
function getUserById(id, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, result) => {
    if (err) callback(err);
    else callback(null, result[0]);
  });
}
```

### Tratamento de Erros
```javascript
// ✅ Bom - Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// ✅ Bom - Try/Catch
try {
  const result = await someAsyncOperation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Erro:', error);
  res.status(500).json({
    success: false,
    message: 'Operação falhou'
  });
}
```

## 🔒 Segurança

### Validação de Entrada
```javascript
// ✅ Sempre valide dados de entrada
const { name, email, password } = req.body;

if (!name || !email || !password) {
  return res.status(400).json({
    success: false,
    message: 'Todos os campos são obrigatórios'
  });
}

if (password.length < 6) {
  return res.status(400).json({
    success: false,
    message: 'Senha deve ter pelo menos 6 caracteres'
  });
}
```

### Sanitização
```javascript
// ✅ Sanitize dados antes de salvar
const sanitizedData = {
  name: validator.escape(name),
  email: validator.normalizeEmail(email),
  password: await bcrypt.hash(password, 10)
};
```

### Autenticação
```javascript
// ✅ Sempre verifique autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
};
```

## 🗄️ Banco de Dados

### Queries
```javascript
// ✅ Use prepared statements
const [users] = await pool.query(
  'SELECT * FROM users WHERE empresa_id = ? AND role = ?',
  [empresaId, role]
);

// ❌ Evite concatenação de strings
const query = `SELECT * FROM users WHERE empresa_id = ${empresaId}`;
```

### Transações
```javascript
// ✅ Use transações para operações complexas
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  await connection.query('INSERT INTO products (name, quantity) VALUES (?, ?)', [name, quantity]);
  await connection.query('INSERT INTO movements (product_id, type, quantity) VALUES (?, ?, ?)', [productId, 'entrada', quantity]);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## 📊 Logs e Monitoramento

### Logs Estruturados
```javascript
// ✅ Use logs estruturados
console.log('Usuário logado', {
  userId: user.id,
  username: user.username,
  timestamp: new Date().toISOString(),
  ip: req.ip
});

// ❌ Evite logs simples
console.log('Usuário logado');
```

### Métricas
```javascript
// ✅ Registre métricas importantes
const startTime = Date.now();
// ... operação ...
const duration = Date.now() - startTime;

console.log('Operação concluída', {
  operation: 'create_product',
  duration,
  success: true
});
```

## 🚀 Deploy

### Produção
```bash
# Build da aplicação
npm run build

# Iniciar em produção
NODE_ENV=production npm start
```

### Docker
```bash
# Build da imagem
docker build -t stockctrl .

# Executar container
docker run -p 3000:3000 stockctrl
```

### Docker Compose
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar serviços
docker-compose down
```

## 🔄 Fluxo de Trabalho

### 1. Nova Feature
```bash
# Crie uma branch
git checkout -b feature/nova-funcionalidade

# Desenvolva
# ... código ...

# Teste
npm test
npm run lint

# Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push
git push origin feature/nova-funcionalidade
```

### 2. Bug Fix
```bash
# Crie uma branch
git checkout -b fix/correcao-bug

# Corrija
# ... código ...

# Teste
npm test

# Commit
git commit -m "fix: corrige bug específico"
```

### 3. Commit Messages
Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 🐛 Debugging

### Logs de Desenvolvimento
```javascript
// ✅ Use logs informativos
console.log('Processando produto:', {
  id: product.id,
  name: product.name,
  quantity: product.quantity
});

// ✅ Use logs de erro detalhados
console.error('Erro ao salvar produto:', {
  error: error.message,
  stack: error.stack,
  product: product
});
```

### Debug com Node.js
```bash
# Debug com breakpoints
node --inspect server.js

# Debug com Chrome DevTools
node --inspect-brk server.js
```

## 📚 Recursos Úteis

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [JWT.io](https://jwt.io/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature
3. **Desenvolva** seguindo os padrões
4. **Teste** suas mudanças
5. **Commit** com mensagem descritiva
6. **Push** para sua branch
7. **Abra** um Pull Request

## 📞 Suporte

- **Issues**: Use o GitHub Issues
- **Documentação**: Consulte `/docs`
- **Código**: Siga os padrões estabelecidos 