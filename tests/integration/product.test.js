const request = require('supertest');
const { pool } = require('../../src/config/database');
const { generateToken } = require('../../src/middleware/auth');

describe('Product API Integration Tests', () => {
    let app;
    let authToken;
    let testProductId;

    beforeAll(async () => {
        // Importar app após configuração
        app = require('../../server');
        
        // Criar token de autenticação para testes
        const testUser = {
            id: 1,
            username: 'testuser',
            role: 'diretor',
            empresa_id: 1
        };
        authToken = generateToken(testUser);
    });

    afterAll(async () => {
        // Limpar dados de teste
        if (testProductId) {
            await pool.query('DELETE FROM products WHERE id = ?', [testProductId]);
        }
        await pool.end();
    });

    describe('GET /api/products', () => {
        it('should return all products for authenticated user', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('products');
            expect(Array.isArray(response.body.products)).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            await request(app)
                .get('/api/products')
                .expect(401);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/products?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
        });
    });

    describe('POST /api/products', () => {
        it('should create a new product with valid data', async () => {
            const productData = {
                nome: 'Produto Teste',
                descricao: 'Descrição do produto teste',
                categoria: 'Teste',
                preco: 99.99,
                quantidade: 100,
                unidade: 'un',
                codigo: 'TEST001'
            };

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.nome).toBe(productData.nome);
            testProductId = response.body.id;
        });

        it('should validate required fields', async () => {
            const invalidData = {
                descricao: 'Produto sem nome'
            };

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('nome');
        });

        it('should prevent duplicate product codes', async () => {
            const duplicateData = {
                nome: 'Produto Duplicado',
                codigo: 'TEST001', // Código já existente
                preco: 50.00,
                quantidade: 10
            };

            await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData)
                .expect(409);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product with valid data', async () => {
            const updateData = {
                nome: 'Produto Atualizado',
                preco: 149.99,
                quantidade: 75
            };

            const response = await request(app)
                .put(`/api/products/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.nome).toBe(updateData.nome);
            expect(response.body.preco).toBe(updateData.preco);
        });

        it('should return 404 for non-existent product', async () => {
            await request(app)
                .put('/api/products/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ nome: 'Teste' })
                .expect(404);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product successfully', async () => {
            await request(app)
                .delete(`/api/products/${testProductId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Verificar se foi realmente deletado
            const [[product]] = await pool.query(
                'SELECT * FROM products WHERE id = ?',
                [testProductId]
            );
            expect(product).toBeUndefined();
        });
    });

    describe('POST /api/products/:id/adjust-stock', () => {
        beforeEach(async () => {
            // Recriar produto para teste de ajuste de estoque
            const [result] = await pool.query(
                'INSERT INTO products (nome, codigo, preco, quantidade, empresa_id) VALUES (?, ?, ?, ?, ?)',
                ['Produto Estoque', 'STOCK001', 25.00, 50, 1]
            );
            testProductId = result.insertId;
        });

        it('should adjust stock quantity', async () => {
            const adjustmentData = {
                quantidade: 10,
                tipo: 'entrada',
                motivo: 'Compra de fornecedor'
            };

            const response = await request(app)
                .post(`/api/products/${testProductId}/adjust-stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(adjustmentData)
                .expect(200);

            expect(response.body.quantidade).toBe(60); // 50 + 10
        });

        it('should prevent negative stock', async () => {
            const adjustmentData = {
                quantidade: 100, // Mais que o estoque atual (50)
                tipo: 'saida',
                motivo: 'Venda'
            };

            await request(app)
                .post(`/api/products/${testProductId}/adjust-stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(adjustmentData)
                .expect(400);
        });
    });
}); 