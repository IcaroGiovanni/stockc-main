-- Otimização completa do banco de dados StockCtrl

-- 1. Tabela de empresas
ALTER TABLE empresas 
  MODIFY COLUMN id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  MODIFY COLUMN nome VARCHAR(255) NOT NULL,
  MODIFY COLUMN responsavel VARCHAR(255) NOT NULL,
  MODIFY COLUMN nome_exibicao VARCHAR(100) NOT NULL,
  MODIFY COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  MODIFY COLUMN notifications_enabled BOOLEAN DEFAULT TRUE,
  MODIFY COLUMN notification_email VARCHAR(255),
  MODIFY COLUMN location_definitions JSON,
  MODIFY COLUMN logo_url VARCHAR(500),
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD INDEX idx_empresa_nome (nome),
  ADD INDEX idx_empresa_onboarding (onboarding_completed),
  ADD INDEX idx_empresa_notifications (notifications_enabled);

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_category_empresa (empresa_id, name),
  INDEX idx_category_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- 3. Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_supplier_empresa (empresa_id, name),
  INDEX idx_supplier_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- 4. Tabela de localizações
CREATE TABLE IF NOT EXISTS locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location_empresa (empresa_id, name),
  INDEX idx_location_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- 5. Tabela de produtos
ALTER TABLE products 
  ADD COLUMN description TEXT,
  ADD COLUMN sku VARCHAR(100) UNIQUE,
  ADD COLUMN category_id INT UNSIGNED,
  ADD COLUMN brand VARCHAR(100),
  ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN min_quantity INT UNSIGNED DEFAULT 0,
  ADD COLUMN max_quantity INT UNSIGNED DEFAULT 1000,
  ADD COLUMN supplier_id INT UNSIGNED,
  ADD COLUMN barcode VARCHAR(50),
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
  MODIFY COLUMN id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  MODIFY COLUMN name VARCHAR(255) NOT NULL,
  MODIFY COLUMN empresa_id INT UNSIGNED NOT NULL,
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD INDEX idx_product_empresa_active (empresa_id, is_active),
  ADD INDEX idx_product_name (name),
  ADD INDEX idx_product_sku (sku),
  ADD INDEX idx_product_category (category_id),
  ADD INDEX idx_product_supplier (supplier_id),
  ADD INDEX idx_product_barcode (barcode),
  ADD FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- 6. Tabela de localizações de produtos
ALTER TABLE product_locations 
  MODIFY COLUMN id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  MODIFY COLUMN product_id INT UNSIGNED NOT NULL,
  ADD COLUMN location_id INT UNSIGNED NOT NULL,
  MODIFY COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 0,
  MODIFY COLUMN sub_location VARCHAR(100),
  MODIFY COLUMN empresa_id INT UNSIGNED NOT NULL,
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD UNIQUE KEY uk_product_location_sub (product_id, location_id, sub_location, empresa_id),
  ADD INDEX idx_location_product (product_id),
  ADD INDEX idx_location_location (location_id),
  ADD INDEX idx_location_empresa (empresa_id),
  ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  ADD FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  ADD FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- 7. Tabela de logs de atividade
ALTER TABLE activity_logs 
  MODIFY COLUMN id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  MODIFY COLUMN empresa_id INT UNSIGNED NOT NULL,
  MODIFY COLUMN user_id INT UNSIGNED,
  MODIFY COLUMN product_id INT UNSIGNED,
  MODIFY COLUMN action VARCHAR(100) NOT NULL,
  MODIFY COLUMN details JSON,
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD INDEX idx_log_empresa (empresa_id),
  ADD INDEX idx_log_user (user_id),
  ADD INDEX idx_log_product (product_id),
  ADD INDEX idx_log_action (action),
  ADD INDEX idx_log_created (created_at),
  ADD FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 8. Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
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
  INDEX idx_movement_created (created_at),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
); 