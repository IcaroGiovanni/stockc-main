const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();

// --- Configuração do Nodemailer (com Ethereal para teste) ---
let transporter;

async function setupEmail() {
    try {
        let testAccount = await nodemailer.createTestAccount();
        
        console.log('--- E-mail de Teste (Ethereal) ---');
        console.log('Use as seguintes credenciais para ver os e-mails enviados:');
        console.log(`Usuário: ${testAccount.user}`);
        console.log(`Senha: ${testAccount.pass}`);
        console.log('-----------------------------------');

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } catch (error) {
        console.error("Falha ao configurar a conta de e-mail de teste:", error);
    }
}
setupEmail();

// Função para enviar e-mail
async function sendEmail(mailOptions) {
    if (!transporter) {
        console.error("Transportador de e-mail não está pronto.");
        return;
    }
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('E-mail de notificação enviado: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Erro ao enviar e-mail de notificação:", error);
    }
}

// --- Criar pastas de upload se não existirem ---
const uploadsDir = path.join(__dirname, 'public/uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const logosDir = path.join(uploadsDir, 'logos');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir);

const port = 3000;
const saltRounds = 10; 
const JWT_SECRET = 'seu-segredo-super-secreto-mude-depois'; 

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuração de Segurança com Helmet
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "http://localhost:3000"],
      imgSrc: ["'self'", "data:", "https://i.pravatar.cc"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// --- Rotas de Páginas ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html')));
app.get('/usuarios', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'usuarios.html')));
app.get('/estoque', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'estoque.html')));
app.get('/logs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'logs.html')));
app.get('/produto/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'produto.html')));
app.get('/onboarding', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'onboarding.html')));
app.get('/configuracoes', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'configuracoes.html')));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- Configuração do Multer para Upload de Arquivos ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = file.fieldname === 'avatar' ? 'public/uploads/avatars' : 'public/uploads/logos';
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.user ? req.user.empresa_id : 'public';
        cb(null, userId + '-' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Erro: Apenas imagens (jpeg, jpg, png, gif) são permitidas!"));
    }
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stock_control',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();

pool.query('SELECT 1').then(() => {
    console.log('Conexão com MySQL (pool) funcionando!');
}).catch(err => {
    console.error('Erro ao conectar ao MySQL (pool):', err);
});

// --- Função de Log de Atividade ---
async function logActivity(empresa_id, user, action, details = {}) {
    try {
        const logQuery = 'INSERT INTO activity_logs (empresa_id, user_id, user_full_name, product_id, action, details) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(logQuery, [empresa_id, user.id, user.full_name || user.username, details.produtoId || null, action, JSON.stringify(details)]);

        const [[settings]] = await pool.query('SELECT notifications_enabled, notification_email FROM empresas WHERE id = ?', [empresa_id]);

        if (settings && settings.notifications_enabled && settings.notification_email) {
            const mailOptions = {
                from: '"StockCtrl Notificações" <notifications@stockctrl.com>',
                to: settings.notification_email,
                subject: `Alerta de Atividade: ${action.replace(/_/g, ' ')}`,
                html: `<div>...</div>` // Simplificado para brevidade
            };
            await sendEmail(mailOptions);
        }
    } catch (error) {
        console.error("Erro no sistema de log de atividade:", error);
    }
}

// Garante que a empresa e o admin padrão existam
const initializeSystem = async () => {
    try {
        let [[empresa]] = await pool.query('SELECT * FROM empresas WHERE id = 1');
        if (!empresa) {
            await pool.query("INSERT INTO empresas (id, nome, responsavel, nome_exibicao, onboarding_completed) VALUES (1, 'Pneumatica', 'Admin', 'PNEUMATICA', true)");
            console.log('Empresa padrão "Pneumatica" criada com id=1.');
        }

        let [[admin]] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (!admin) {
            const hash = await bcrypt.hash('admin123', saltRounds);
            await pool.query(
                'INSERT INTO users (username, password, email, full_name, role, empresa_id) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin', hash, 'admin@stockctrl.com', 'Diretor de Logística', 'diretor', 1]
            );
            console.log('Usuário admin criado e associado à empresa padrão!');
        } else if (!admin.empresa_id) {
            await pool.query('UPDATE users SET empresa_id = 1 WHERE id = ?', [admin.id]);
            console.log('Usuário admin existente foi associado à empresa padrão!');
        } else {
            console.log('Usuário admin já existe e está associado a uma empresa.');
        }
    } catch (error) {
        console.error('Erro ao inicializar o sistema:', error);
    }
};

initializeSystem();

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// Middleware para autorizar por cargo (Role)
const authorizeRole = (requiredRoles) => (req, res, next) => {
    const userRole = req.user.role;
    const rolesHierarchy = { 'diretor': 2, 'auxiliar': 1, 'visualizador': 0 };

    const userLevel = rolesHierarchy[userRole] ?? -1;
    const requiredLevel = rolesHierarchy[requiredRoles.reduce((max, role) => rolesHierarchy[role] > rolesHierarchy[max] ? role : max, requiredRoles[0])] ?? -1;

    if (userLevel >= requiredLevel) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
    }
};

// Função utilitária para garantir campos obrigatórios e valores default
function sanitizeProduct(product) {
  return {
    id: product.id,
    name: product.name || 'Sem nome',
    description: product.description || '',
    sku: product.sku || '',
    category_id: product.category_id || null,
    brand: product.brand || '',
    unit_price: product.unit_price !== null && product.unit_price !== undefined ? product.unit_price : 0.00,
    min_quantity: product.min_quantity !== null && product.min_quantity !== undefined ? product.min_quantity : 0,
    max_quantity: product.max_quantity !== null && product.max_quantity !== undefined ? product.max_quantity : 1000,
    supplier_id: product.supplier_id || null,
    barcode: product.barcode || '',
    is_active: product.is_active !== null && product.is_active !== undefined ? !!product.is_active : true,
    empresa_id: product.empresa_id,
    created_at: product.created_at,
    updated_at: product.updated_at
  };
}

// --- ROTAS DA API ---

// Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });

    try {
        const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const [[empresa]] = await pool.query('SELECT onboarding_completed FROM empresas WHERE id = ?', [user.empresa_id]);
        
        const tokenPayload = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            empresa_id: user.empresa_id,
            onboarding_completed: empresa ? empresa.onboarding_completed : false
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, message: 'Login bem-sucedido!' });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Usuários ---
app.post('/register', authenticateToken, authorizeRole(['diretor']), async (req, res) => {
    const { username, password, email, full_name, role } = req.body;
    const empresaId = req.user.empresa_id;

    if (!username || !password || !email || !role) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'INSERT INTO users (username, password, email, full_name, role, empresa_id) VALUES (?, ?, ?, ?, ?, ?)';
        
        await pool.query(query, [username, hashedPassword, email, full_name, role, empresaId]);
        await logActivity(empresaId, req.user, 'CRIOU_USUARIO', { nome: full_name, username, role });
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao gerar hash da senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar senha.' });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, username, email, role, created_at, profile_picture_url FROM users WHERE empresa_id = ? ORDER BY full_name ASC', [req.user.empresa_id]);
        res.json(Array.isArray(users) ? users : []);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    // Permitir que o próprio usuário acesse seus dados
    if (req.user.id.toString() !== id && req.user.role !== 'diretor') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const [users] = await pool.query('SELECT id, full_name, username, email, role, created_at, profile_picture_url FROM users WHERE id = ? AND empresa_id = ?', [id, empresaId]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário.' });
    }
});

app.put('/api/users/:id', authenticateToken, authorizeRole(['diretor']), (req, res) => {
    const { full_name, username, email, role } = req.body;
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    pool.query(
        'UPDATE users SET full_name=?, username=?, email=?, role=? WHERE id=? AND empresa_id=?',
        [full_name, username, email, role, id, empresaId],
        (err, result) => {
            if (err) {
                console.error('Erro ao editar usuário:', err);
                return res.status(500).json({ message: 'Erro ao editar usuário.', error: err });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            logActivity(empresaId, req.user, 'EDITOU_USUARIO', { usuarioId: id, dados: req.body });
            res.json({ message: 'Usuário atualizado com sucesso!' });
        }
    );
});

app.put('/api/users/:id/password', authenticateToken, authorizeRole(['diretor']), async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const requestingUser = req.user;

    if (requestingUser.id.toString() !== id) {
        return res.status(403).json({ message: 'Acesso negado. Você só pode alterar a sua própria senha.' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], (err, result) => {
            if (err) {
                console.error('Erro ao atualizar senha:', err);
                return res.status(500).json({ message: 'Erro interno ao atualizar a senha.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.json({ message: 'Senha atualizada com sucesso!' });
        });
    } catch (error) {
        console.error('Erro ao gerar hash da nova senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.delete('/api/users/:id', authenticateToken, authorizeRole(['diretor']), (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    pool.query('DELETE FROM users WHERE id=? AND empresa_id=?', [id, empresaId], (err, result) => {
        if (err) {
            console.error('Erro ao apagar usuário:', err);
            return res.status(500).json({ message: 'Erro ao apagar usuário.' });
        }
        logActivity(empresaId, req.user, 'APAGOU_USUARIO', { usuarioId: id });
        res.json({ message: 'Usuário apagado com sucesso!' });
    });
});

// --- CRUD de Produtos ---
// Listar produtos
app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const { empresa_id } = req.user;
        // Busca todos os produtos da empresa
        const [products] = await pool.query(`SELECT * FROM products WHERE empresa_id = ?`, [empresa_id]);
        // Busca todas as localizações de produtos da empresa
        const [locations] = await pool.query(`SELECT pl.product_id, l.name as location_name, pl.quantity, pl.sub_location FROM product_locations pl JOIN locations l ON pl.location_id = l.id WHERE pl.empresa_id = ?`, [empresa_id]);
        // Monta o array de produtos com locations
        const productsWithLocations = products.map(product => {
            const locs = locations.filter(loc => loc.product_id === product.id).map(loc => ({
                name: loc.location_name || 'Sem localização',
                quantity: loc.quantity || 0,
                sub_location: loc.sub_location || ''
            }));
            return {
                id: product.id,
                name: product.name || 'Sem nome',
                locations: locs,
                created_at: product.created_at,
                updated_at: product.updated_at
            };
        });
        res.json(productsWithLocations);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ message: 'Erro ao listar produtos.' });
    }
});

// Buscar produto por ID
app.get('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { empresa_id } = req.user;
        const { id } = req.params;
        
        // Buscar produto
        const [products] = await pool.query(`
            SELECT * FROM products WHERE id = ? AND empresa_id = ?
        `, [id, empresa_id]);
        
        if (!products.length) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        const product = products[0];
        
        // Buscar localizações do produto
        const [locations] = await pool.query(`
            SELECT pl.location_id, pl.quantity, pl.sub_location, l.name as location_name
            FROM product_locations pl 
            JOIN locations l ON pl.location_id = l.id 
            WHERE pl.product_id = ? AND pl.empresa_id = ?
        `, [id, empresa_id]);
        
        // Converter localizações para o formato quantities_by_location (chave string)
        const quantities_by_location = {};
        locations.forEach(loc => {
            quantities_by_location[String(loc.location_id)] = {
                quantity: loc.quantity || 0,
                sub_location: loc.sub_location || ''
            };
        });
        
        // Montar resposta final
        const productWithLocations = {
            ...sanitizeProduct(product),
            quantities_by_location
        };
        
        res.json(productWithLocations);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ message: 'Erro ao buscar produto.' });
    }
});

// Criar produto
app.post('/api/products', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { name, description, sku, category_id, brand, unit_price, min_quantity, max_quantity, supplier_id, barcode, is_active, quantities_by_location } = req.body;
        const empresa_id = req.user.empresa_id;
        if (!name) return res.status(400).json({ message: 'O campo name é obrigatório.' });
        await conn.beginTransaction();
        // Insere produto
        const [result] = await conn.query(`
            INSERT INTO products (name, description, sku, category_id, brand, unit_price, min_quantity, max_quantity, supplier_id, barcode, is_active, empresa_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description || null, sku || null, category_id || null, brand || null, unit_price || 0, min_quantity || 0, max_quantity || 1000, supplier_id || null, barcode || null, is_active !== undefined ? is_active : true, empresa_id]);
        const productId = result.insertId;
        // Insere localizações
        if (quantities_by_location && typeof quantities_by_location === 'object') {
            for (const [locationId, details] of Object.entries(quantities_by_location)) {
                await conn.query(`
                    INSERT INTO product_locations (product_id, location_id, empresa_id, quantity, sub_location, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [productId, locationId, empresa_id, details.quantity || 0, details.sub_location || '']);
            }
        }
        await conn.commit();
        res.status(201).json({ message: 'Produto criado com sucesso!' });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'SKU já cadastrado.' });
        }
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro ao criar produto.' });
    } finally {
        conn.release();
    }
});

// Atualizar produto
app.put('/api/products/:id', authenticateToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const empresa_id = req.user.empresa_id;
        const { name, description, sku, category_id, brand, unit_price, min_quantity, max_quantity, supplier_id, barcode, is_active, quantities_by_location } = req.body;
        await conn.beginTransaction();
        // Atualiza produto
        const [result] = await conn.query(`
            UPDATE products SET name=?, description=?, sku=?, category_id=?, brand=?, unit_price=?, min_quantity=?, max_quantity=?, supplier_id=?, barcode=?, is_active=?
            WHERE id=? AND empresa_id=?
        `, [name, description, sku, category_id, brand, unit_price, min_quantity, max_quantity, supplier_id, barcode, is_active, id, empresa_id]);
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        // Remove localizações antigas
        await conn.query('DELETE FROM product_locations WHERE product_id=? AND empresa_id=?', [id, empresa_id]);
        // Insere novas localizações
        if (quantities_by_location && typeof quantities_by_location === 'object') {
            for (const [locationId, details] of Object.entries(quantities_by_location)) {
                await conn.query(`
                    INSERT INTO product_locations (product_id, location_id, empresa_id, quantity, sub_location, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [id, locationId, empresa_id, details.quantity || 0, details.sub_location || '']);
            }
        }
        await conn.commit();
        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'SKU já cadastrado.' });
        }
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro ao atualizar produto.' });
    } finally {
        conn.release();
    }
});

// Deletar produto
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id=? AND empresa_id=?', [id, empresaId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        logActivity(empresaId, req.user, 'APAGOU_PRODUTO', { produtoId: id });
        res.json({ message: 'Produto apagado com sucesso!' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(400).json({ message: 'Não é possível excluir o produto pois ele está vinculado a movimentações ou localizações.' });
        }
        console.error('Erro ao apagar produto:', error);
        res.status(500).json({ message: 'Erro ao apagar produto.' });
    }
});

// --- Empresa ---
app.get('/api/empresa', authenticateToken, async (req, res) => {
    try {
        const [empresaRows] = await pool.query('SELECT * FROM empresas WHERE id = ?', [req.user.empresa_id]);
        if (!empresaRows.length) {
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }
        
        const empresa = empresaRows[0];
        
        // Buscar localizações da empresa
        const [locationRows] = await pool.query(
            'SELECT id, name FROM locations WHERE empresa_id = ? ORDER BY name ASC',
            [req.user.empresa_id]
        );
        
        // Adicionar location_definitions ao objeto da empresa
        empresa.location_definitions = locationRows.map(loc => ({
            id: loc.id,
            name: loc.name
        }));
        
        res.json(empresa);
    } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Atualizar empresa
app.put('/api/empresa', authenticateToken, authorizeRole(['diretor']), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { 
            nome, 
            nome_exibicao, 
            allow_duplicate_names, 
            notifications_enabled, 
            notification_email,
            location_definitions,
            onboarding_completed 
        } = req.body;
        
        const empresa_id = req.user.empresa_id;
        
        await conn.beginTransaction();
        
        // Preparar campos para atualização da empresa
        const updateFields = [];
        const updateValues = [];
        
        if (nome !== undefined) {
            updateFields.push('nome = ?');
            updateValues.push(nome);
        }
        if (nome_exibicao !== undefined) {
            updateFields.push('nome_exibicao = ?');
            updateValues.push(nome_exibicao);
        }
        if (allow_duplicate_names !== undefined) {
            updateFields.push('allow_duplicate_names = ?');
            updateValues.push(allow_duplicate_names);
        }
        if (notifications_enabled !== undefined) {
            updateFields.push('notifications_enabled = ?');
            updateValues.push(notifications_enabled);
        }
        if (notification_email !== undefined) {
            updateFields.push('notification_email = ?');
            updateValues.push(notification_email);
        }
        if (onboarding_completed !== undefined) {
            updateFields.push('onboarding_completed = ?');
            updateValues.push(onboarding_completed);
        }
        
        // Atualizar empresa se houver campos para atualizar
        if (updateFields.length > 0) {
            updateValues.push(empresa_id);
            const updateQuery = `UPDATE empresas SET ${updateFields.join(', ')} WHERE id = ?`;
            await conn.query(updateQuery, updateValues);
        }
        
        // Processar location_definitions se fornecido
        if (location_definitions && Array.isArray(location_definitions)) {
            // Remover localizações existentes
            await conn.query('DELETE FROM locations WHERE empresa_id = ?', [empresa_id]);
            
            // Inserir novas localizações
            for (const loc of location_definitions) {
                if (loc.name && loc.name.trim()) {
                    await conn.query(
                        'INSERT INTO locations (name, empresa_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                        [loc.name.trim(), empresa_id]
                    );
                }
            }
        }
        
        await conn.commit();
        res.json({ message: 'Empresa atualizada com sucesso!' });
        
    } catch (error) {
        await conn.rollback();
        console.error('Erro ao atualizar empresa:', error);
        res.status(500).json({ message: 'Erro ao atualizar empresa.' });
    } finally {
        conn.release();
    }
});

// --- Dashboard ---
app.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
    try {
        const { empresa_id } = req.user;

        const [[{ total_products }]] = await pool.query('SELECT COUNT(id) as total_products FROM products WHERE empresa_id = ?', [empresa_id]);
        
        const [[result]] = await pool.query('SELECT SUM(quantity) as total_items FROM product_locations WHERE empresa_id = ?', [empresa_id]);
        const total_items = result.total_items || 0;

        const [[{ logs_today }]] = await pool.query("SELECT COUNT(id) as logs_today FROM activity_logs WHERE empresa_id = ? AND DATE(created_at) = CURDATE()", [empresa_id]);
        const [[{ total_users }]] = await pool.query('SELECT COUNT(id) as total_users FROM users WHERE empresa_id = ?', [empresa_id]);

        res.json({ total_products, total_items, logs_today, total_users });
    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
    }
});


// --- ROTAS PÚBLICAS ---
app.get('/api/public/empresa', async (req, res) => {
    try {
        // Assume ID 1 como padrão ou busca a primeira
        const [[empresa]] = await pool.query('SELECT nome_fantasia, logo_url FROM empresas ORDER BY id LIMIT 1');
        if (empresa) {
            res.json(empresa);
        } else {
            res.status(404).json({ message: 'Nenhuma empresa configurada.' });
        }
    } catch (error) {
        console.error('Erro ao buscar dados públicos da empresa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/api/public/products/:id', async (req, res) => {
    try {
        const productDetails = await getProductDetails(req.params.id);
         if (!productDetails) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        res.json(productDetails);
    } catch (error) {
        console.error('Erro ao buscar detalhes públicos do produto:', error);
        res.status(500).json({ message: 'Erro ao buscar dados do produto.' });
    }
});

// Alias para listagem de usuários
app.get('/api/usuarios', authenticateToken, authorizeRole(['diretor']), async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, username, email, role, created_at, profile_picture_url FROM users WHERE empresa_id = ? ORDER BY full_name ASC', [req.user.empresa_id]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

// Alias para buscar usuário por id (compatível com frontend antigo)
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    // Permitir que o próprio usuário acesse seus dados
    if (req.user.id.toString() !== id && req.user.role !== 'diretor') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const [users] = await pool.query('SELECT id, full_name, username, email, role, created_at, profile_picture_url FROM users WHERE id = ? AND empresa_id = ?', [id, empresaId]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário.' });
    }
});

// Alias para editar usuário
app.put('/api/usuarios/:id', authenticateToken, authorizeRole(['diretor']), (req, res) => {
    const { full_name, username, email, role } = req.body;
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    pool.query(
        'UPDATE users SET full_name=?, username=?, email=?, role=? WHERE id=? AND empresa_id=?',
        [full_name, username, email, role, id, empresaId],
        (err, result) => {
            if (err) {
                console.error('Erro ao editar usuário:', err);
                return res.status(500).json({ message: 'Erro ao editar usuário.', error: err });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            logActivity(empresaId, req.user, 'EDITOU_USUARIO', { usuarioId: id, dados: req.body });
            res.json({ message: 'Usuário atualizado com sucesso!' });
        }
    );
});

// Alias para deletar usuário
app.delete('/api/usuarios/:id', authenticateToken, authorizeRole(['diretor']), (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    pool.query('DELETE FROM users WHERE id=? AND empresa_id=?', [id, empresaId], (err, result) => {
        if (err) {
            console.error('Erro ao apagar usuário:', err);
            return res.status(500).json({ message: 'Erro ao apagar usuário.' });
        }
        logActivity(empresaId, req.user, 'APAGOU_USUARIO', { usuarioId: id });
        res.json({ message: 'Usuário apagado com sucesso!' });
    });
});

// Rota para listar logs da empresa (usando activity_logs)
app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        const [logs] = await pool.query(
            `SELECT 
                l.id, l.empresa_id, l.user_id, l.product_id, l.action, l.quantity, l.description, l.created_at, 
                u.full_name as user_name, p.name as product_name
            FROM activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN products p ON l.product_id = p.id
            WHERE l.empresa_id = ?
            ORDER BY l.created_at DESC`,
            [req.user.empresa_id]
        );
        res.json(Array.isArray(logs) ? logs : []);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs.' });
    }
});

// Criar localização
app.post('/api/locations', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const empresa_id = req.user.empresa_id;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'O nome da localização é obrigatório.' });
        }
        const [result] = await pool.query(
            'INSERT INTO locations (name, empresa_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [name.trim(), empresa_id]
        );
        res.status(201).json({ id: result.insertId, name: name.trim(), empresa_id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Já existe uma localização com esse nome.' });
        }
        console.error('Erro ao criar localização:', error);
        res.status(500).json({ message: 'Erro ao criar localização.' });
    }
});

// --- Middleware de Tratamento de Erros ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Erro no upload: ${err.message}` });
  }
  if (err.message.includes("Apenas imagens")) {
      return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Algo deu muito errado no servidor!', error: err.message });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 
