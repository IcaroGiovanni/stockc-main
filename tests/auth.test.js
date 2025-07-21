const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock do servidor Express
let app;
let server;

beforeAll(async () => {
  // Importar o app do servidor
  const express = require('express');
  app = express();

  // Configurar middlewares básicos
  app.use(require('body-parser').json());
  app.use(require('cors')());

  // Mock das rotas de autenticação
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuário e senha são obrigatórios'
      });
    }

    // Mock de usuário válido
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'diretor' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 1,
          username: 'admin',
          full_name: 'Diretor de Logística',
          role: 'diretor'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  });

  server = app.listen(3001);
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

describe('Autenticação', () => {
  describe('POST /login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('admin');
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'admin',
          password: 'senha_errada'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('deve rejeitar login sem credenciais', async () => {
      const response = await request(app)
        .post('/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuário e senha são obrigatórios');
    });

    it('deve rejeitar login com usuário vazio', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: '',
          password: 'admin123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Utilitários de Autenticação', () => {
  describe('bcrypt', () => {
    it('deve fazer hash de senha corretamente', async () => {
      const password = 'minha_senha_secreta';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
      const password = 'minha_senha_secreta';
      const wrongPassword = 'senha_errada';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT', () => {
    it('deve gerar e verificar token JWT', () => {
      const payload = { id: 1, username: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
    });

    it('deve rejeitar token inválido', () => {
      expect(() => {
        jwt.verify('token_invalido', process.env.JWT_SECRET);
      }).toThrow();
    });
  });
});