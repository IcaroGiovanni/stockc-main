# 📚 Documentação da API - StockCtrl

## 🔗 Base URL
```
http://localhost:3000
```

## 🔐 Autenticação
A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:
```
Authorization: Bearer <seu-token-jwt>
```

## 📋 Endpoints

### 🔑 Autenticação

#### POST /login
Faz login do usuário e retorna um token JWT.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Diretor de Logística",
    "role": "diretor"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

### 👥 Usuários

#### GET /api/users
Lista todos os usuários da empresa (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@stockctrl.com",
      "full_name": "Diretor de Logística",
      "role": "diretor",
      "empresa_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/users
Cria um novo usuário (requer role 'diretor').

**Request Body:**
```json
{
  "username": "novo.usuario",
  "password": "senha123",
  "email": "usuario@empresa.com",
  "full_name": "Nome Completo",
  "role": "operador"
}
```

#### PUT /api/users/:id
Atualiza um usuário existente.

#### DELETE /api/users/:id
Remove um usuário (soft delete).

### 📦 Produtos

#### GET /api/products
Lista todos os produtos da empresa.

**Query Parameters:**
- `search`: Termo de busca
- `category`: Filtro por categoria
- `page`: Número da página
- `limit`: Itens por página

**Response (200):**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Produto Exemplo",
      "description": "Descrição do produto",
      "category": "Categoria",
      "sku": "SKU123",
      "total_quantity": 100,
      "min_quantity": 10,
      "max_quantity": 500,
      "unit_price": 25.50,
      "supplier": "Fornecedor",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### POST /api/products
Cria um novo produto.

**Request Body:**
```json
{
  "name": "Novo Produto",
  "description": "Descrição",
  "category": "Categoria",
  "sku": "SKU456",
  "initial_quantity": 50,
  "min_quantity": 5,
  "max_quantity": 200,
  "unit_price": 15.75,
  "supplier": "Fornecedor"
}
```

#### GET /api/products/:id
Obtém detalhes de um produto específico.

#### PUT /api/products/:id
Atualiza um produto.

#### DELETE /api/products/:id
Remove um produto (soft delete).

### 📍 Localizações

#### GET /api/locations
Lista todas as localizações configuradas.

#### POST /api/locations
Cria uma nova localização.

#### PUT /api/locations/:id
Atualiza uma localização.

#### DELETE /api/locations/:id
Remove uma localização.

### 📊 Movimentações

#### POST /api/movements
Registra uma movimentação de estoque.

**Request Body:**
```json
{
  "product_id": 1,
  "type": "entrada", // entrada, saida, transferencia
  "quantity": 10,
  "location_id": "A1",
  "sub_location": "Prateleira 1",
  "reason": "Compra",
  "notes": "Observações"
}
```

#### GET /api/movements
Lista movimentações com filtros.

**Query Parameters:**
- `product_id`: ID do produto
- `type`: Tipo de movimentação
- `date_from`: Data inicial
- `date_to`: Data final
- `page`: Número da página
- `limit`: Itens por página

### 📈 Relatórios

#### GET /api/reports/inventory
Relatório de inventário atual.

#### GET /api/reports/movements
Relatório de movimentações.

#### GET /api/reports/low-stock
Produtos com estoque baixo.

#### GET /api/reports/overstock
Produtos com estoque alto.

### 🏢 Empresa

#### GET /api/empresa
Obtém dados da empresa atual.

#### PUT /api/empresa
Atualiza dados da empresa.

### 📝 Logs

#### GET /api/logs
Lista logs de atividade.

**Query Parameters:**
- `user_id`: ID do usuário
- `action`: Tipo de ação
- `date_from`: Data inicial
- `date_to`: Data final
- `page`: Número da página
- `limit`: Itens por página

## 🚨 Códigos de Erro

### 400 - Bad Request
Dados inválidos ou faltando.

### 401 - Unauthorized
Token inválido ou expirado.

### 403 - Forbidden
Usuário sem permissão para a ação.

### 404 - Not Found
Recurso não encontrado.

### 500 - Internal Server Error
Erro interno do servidor.

## 📝 Exemplos de Uso

### JavaScript (Fetch API)
```javascript
// Login
const loginResponse = await fetch('/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Buscar produtos
const productsResponse = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const productsData = await productsResponse.json();
```

### cURL
```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Buscar produtos
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <seu-token>"
```

## 🔄 Paginação
Endpoints que retornam listas suportam paginação:

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Filtros e Busca
Muitos endpoints suportam filtros:

- `search`: Busca textual
- `date_from` / `date_to`: Filtro por data
- `category`: Filtro por categoria
- `status`: Filtro por status

## 📊 Rate Limiting
A API implementa rate limiting para prevenir abuso:
- 100 requests por 15 minutos por IP
- 1000 requests por hora por usuário autenticado 