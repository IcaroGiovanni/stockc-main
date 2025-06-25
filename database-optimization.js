const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockctrl',
  port: process.env.DB_PORT || 3306
};

// Função para verificar se uma coluna existe
async function columnExists(connection, tableName, columnName) {
  try {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [dbConfig.database, tableName, columnName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar coluna ${columnName} na tabela ${tableName}:`, error.message);
    return false;
  }
}

// Função para verificar se uma tabela existe
async function tableExists(connection, tableName) {
  try {
    const [rows] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = ?`,
      [dbConfig.database, tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error.message);
    return false;
  }
}

// Função para adicionar coluna se não existir
async function addColumnIfNotExists(connection, tableName, columnName, columnDefinition) {
  const exists = await columnExists(connection, tableName, columnName);
  if (!exists) {
    try {
      await connection.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`✅ Coluna ${columnName} adicionada à tabela ${tableName}`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar coluna ${columnName} na tabela ${tableName}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Coluna ${columnName} já existe na tabela ${tableName}`);
  }
}

// Função para criar tabela se não existir
async function createTableIfNotExists(connection, tableName, tableDefinition) {
  const exists = await tableExists(connection, tableName);
  if (!exists) {
    try {
      await connection.execute(`CREATE TABLE ${tableName} ${tableDefinition}`);
      console.log(`✅ Tabela ${tableName} criada`);
    } catch (error) {
      console.error(`❌ Erro ao criar tabela ${tableName}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Tabela ${tableName} já existe`);
  }
}

// Função para adicionar índice se não existir
async function addIndexIfNotExists(connection, tableName, indexName, indexDefinition) {
  try {
    await connection.execute(`CREATE INDEX ${indexName} ON ${tableName} ${indexDefinition}`);
    console.log(`✅ Índice ${indexName} adicionado à tabela ${tableName}`);
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log(`ℹ️  Índice ${indexName} já existe na tabela ${tableName}`);
    } else {
      console.error(`❌ Erro ao adicionar índice ${indexName} na tabela ${tableName}:`, error.message);
    }
  }
}

// Função para adicionar chave estrangeira se não existir
async function addForeignKeyIfNotExists(connection, tableName, constraintName, foreignKeyDefinition) {
  try {
    await connection.execute(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ${foreignKeyDefinition}`);
    console.log(`✅ Chave estrangeira ${constraintName} adicionada à tabela ${tableName}`);
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log(`ℹ️  Chave estrangeira ${constraintName} já existe na tabela ${tableName}`);
    } else {
      console.error(`❌ Erro ao adicionar chave estrangeira ${constraintName} na tabela ${tableName}:`, error.message);
    }
  }
}

// Função principal para otimizar o banco
async function optimizeDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    console.log('\n📋 Iniciando otimização do banco de dados...\n');

    // 1. Criar tabelas se não existirem
    console.log('🏗️  Criando tabelas...');
    
    await createTableIfNotExists(connection, 'categories', `(
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      empresa_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_category_empresa (empresa_id, name),
      INDEX idx_category_empresa (empresa_id)
    )`);

    await createTableIfNotExists(connection, 'suppliers', `(
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      empresa_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_supplier_empresa (empresa_id, name),
      INDEX idx_supplier_empresa (empresa_id)
    )`);

    await createTableIfNotExists(connection, 'locations', `(
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      empresa_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_location_empresa (empresa_id, name),
      INDEX idx_location_empresa (empresa_id)
    )`);

    await createTableIfNotExists(connection, 'stock_movements', `(
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      location_id INT UNSIGNED NOT NULL,
      sub_location VARCHAR(100),
      movement_type ENUM('entrada', 'saida', 'transferencia', 'ajuste') NOT NULL,
      quantity INT NOT NULL,
      previous_quantity INT NOT NULL,
      new_quantity INT NOT NULL,
      reason VARCHAR(255),
      notes TEXT,
      user_id INT UNSIGNED,
      empresa_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movement_product (product_id),
      INDEX idx_movement_location (location_id),
      INDEX idx_movement_type (movement_type),
      INDEX idx_movement_empresa (empresa_id),
      INDEX idx_movement_created (created_at)
    )`);

    // 2. Adicionar colunas na tabela empresas
    console.log('\n🏢 Adicionando colunas na tabela empresas...');
    await addColumnIfNotExists(connection, 'empresas', 'nome_exibicao', 'VARCHAR(100) NOT NULL');
    await addColumnIfNotExists(connection, 'empresas', 'onboarding_completed', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists(connection, 'empresas', 'notifications_enabled', 'BOOLEAN DEFAULT TRUE');
    await addColumnIfNotExists(connection, 'empresas', 'notification_email', 'VARCHAR(255)');
    await addColumnIfNotExists(connection, 'empresas', 'location_definitions', 'JSON');
    await addColumnIfNotExists(connection, 'empresas', 'logo_url', 'VARCHAR(500)');

    // 3. Adicionar colunas na tabela products
    console.log('\n📦 Adicionando colunas na tabela products...');
    await addColumnIfNotExists(connection, 'products', 'description', 'TEXT');
    await addColumnIfNotExists(connection, 'products', 'sku', 'VARCHAR(100)');
    await addColumnIfNotExists(connection, 'products', 'category_id', 'INT UNSIGNED');
    await addColumnIfNotExists(connection, 'products', 'brand', 'VARCHAR(100)');
    await addColumnIfNotExists(connection, 'products', 'unit_price', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists(connection, 'products', 'min_quantity', 'INT UNSIGNED DEFAULT 0');
    await addColumnIfNotExists(connection, 'products', 'max_quantity', 'INT UNSIGNED DEFAULT 1000');
    await addColumnIfNotExists(connection, 'products', 'supplier_id', 'INT UNSIGNED');
    await addColumnIfNotExists(connection, 'products', 'barcode', 'VARCHAR(50)');
    await addColumnIfNotExists(connection, 'products', 'is_active', 'BOOLEAN DEFAULT TRUE');

    // 4. Adicionar colunas na tabela product_locations
    console.log('\n📍 Adicionando colunas na tabela product_locations...');
    await addColumnIfNotExists(connection, 'product_locations', 'location_id', 'INT UNSIGNED NOT NULL');

    // 5. Adicionar colunas na tabela activity_logs
    console.log('\n📝 Adicionando colunas na tabela activity_logs...');
    await addColumnIfNotExists(connection, 'activity_logs', 'details', 'JSON');

    // 6. Adicionar índices
    console.log('\n🔍 Adicionando índices...');
    
    // Índices para empresas
    await addIndexIfNotExists(connection, 'empresas', 'idx_empresa_nome', '(nome)');
    await addIndexIfNotExists(connection, 'empresas', 'idx_empresa_onboarding', '(onboarding_completed)');
    await addIndexIfNotExists(connection, 'empresas', 'idx_empresa_notifications', '(notifications_enabled)');

    // Índices para products
    await addIndexIfNotExists(connection, 'products', 'idx_product_empresa_active', '(empresa_id, is_active)');
    await addIndexIfNotExists(connection, 'products', 'idx_product_name', '(name)');
    await addIndexIfNotExists(connection, 'products', 'idx_product_sku', '(sku)');
    await addIndexIfNotExists(connection, 'products', 'idx_product_category', '(category_id)');
    await addIndexIfNotExists(connection, 'products', 'idx_product_supplier', '(supplier_id)');
    await addIndexIfNotExists(connection, 'products', 'idx_product_barcode', '(barcode)');

    // Índices para product_locations
    await addIndexIfNotExists(connection, 'product_locations', 'idx_location_product', '(product_id)');
    await addIndexIfNotExists(connection, 'product_locations', 'idx_location_location', '(location_id)');
    await addIndexIfNotExists(connection, 'product_locations', 'idx_location_empresa', '(empresa_id)');

    // Índices para activity_logs
    await addIndexIfNotExists(connection, 'activity_logs', 'idx_log_empresa', '(empresa_id)');
    await addIndexIfNotExists(connection, 'activity_logs', 'idx_log_user', '(user_id)');
    await addIndexIfNotExists(connection, 'activity_logs', 'idx_log_product', '(product_id)');
    await addIndexIfNotExists(connection, 'activity_logs', 'idx_log_action', '(action)');
    await addIndexIfNotExists(connection, 'activity_logs', 'idx_log_created', '(created_at)');

    // 7. Adicionar chaves estrangeiras
    console.log('\n🔗 Adicionando chaves estrangeiras...');
    
    await addForeignKeyIfNotExists(connection, 'products', 'fk_products_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'products', 'fk_products_category', 
      'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL');
    await addForeignKeyIfNotExists(connection, 'products', 'fk_products_supplier', 
      'FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL');

    await addForeignKeyIfNotExists(connection, 'product_locations', 'fk_product_locations_product', 
      'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'product_locations', 'fk_product_locations_location', 
      'FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'product_locations', 'fk_product_locations_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');

    await addForeignKeyIfNotExists(connection, 'activity_logs', 'fk_activity_logs_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'activity_logs', 'fk_activity_logs_user', 
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
    await addForeignKeyIfNotExists(connection, 'activity_logs', 'fk_activity_logs_product', 
      'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL');

    await addForeignKeyIfNotExists(connection, 'stock_movements', 'fk_stock_movements_product', 
      'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'stock_movements', 'fk_stock_movements_user', 
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
    await addForeignKeyIfNotExists(connection, 'stock_movements', 'fk_stock_movements_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');

    await addForeignKeyIfNotExists(connection, 'categories', 'fk_categories_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'suppliers', 'fk_suppliers_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');
    await addForeignKeyIfNotExists(connection, 'locations', 'fk_locations_empresa', 
      'FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE');

    // 8. Adicionar constraints únicas
    console.log('\n🔒 Adicionando constraints únicas...');
    
    try {
      await connection.execute(`
        ALTER TABLE product_locations 
        ADD UNIQUE KEY uk_product_location_sub (product_id, location_id, sub_location, empresa_id)
      `);
      console.log('✅ Constraint única adicionada em product_locations');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Constraint única já existe em product_locations');
      } else {
        console.error('❌ Erro ao adicionar constraint única em product_locations:', error.message);
      }
    }

    console.log('\n✅ Otimização do banco de dados concluída com sucesso!');
    console.log('\n📊 Resumo das melhorias aplicadas:');
    console.log('   • Tabelas de categorias, fornecedores e localizações criadas');
    console.log('   • Colunas adicionais adicionadas nas tabelas existentes');
    console.log('   • Índices otimizados para melhor performance');
    console.log('   • Chaves estrangeiras para integridade referencial');
    console.log('   • Constraints únicas para evitar duplicatas');

  } catch (error) {
    console.error('❌ Erro durante a otimização:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a otimização
if (require.main === module) {
  optimizeDatabase();
}

module.exports = { optimizeDatabase }; 