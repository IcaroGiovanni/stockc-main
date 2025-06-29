const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Token de acesso necessário',
            code: 'TOKEN_REQUIRED'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'seu-segredo-super-secreto-mude-depois', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Token inválido ou expirado',
                code: 'TOKEN_INVALID'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware de autorização por roles
const authorizeRole = (requiredRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }

    const userRole = req.user.role;
    const hasPermission = Array.isArray(requiredRoles) 
        ? requiredRoles.includes(userRole)
        : requiredRoles === userRole;

    if (!hasPermission) {
        return res.status(403).json({ 
            error: 'Acesso negado. Permissões insuficientes.',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: requiredRoles,
            current: userRole
        });
    }

    next();
};

// Função para gerar hash de senha
const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    return await bcrypt.hash(password, saltRounds);
};

// Função para verificar senha
const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Função para gerar token JWT
const generateToken = (user) => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role, 
            empresa_id: user.empresa_id 
        },
        process.env.JWT_SECRET || 'seu-segredo-super-secreto-mude-depois',
        { expiresIn }
    );
};

module.exports = {
    authenticateToken,
    authorizeRole,
    hashPassword,
    verifyPassword,
    generateToken
}; 