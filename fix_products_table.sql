-- Ajuste da tabela products para garantir alinhamento total
ALTER TABLE products 
  MODIFY COLUMN id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  MODIFY COLUMN name VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS category_id INT UNSIGNED,
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS min_quantity INT UNSIGNED DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_quantity INT UNSIGNED DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS supplier_id INT UNSIGNED,
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  MODIFY COLUMN empresa_id INT UNSIGNED NOT NULL,
  MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Remover FKs antigas se existirem (ajuste manual se necessário)
ALTER TABLE products DROP FOREIGN KEY IF EXISTS fk_products_category;
ALTER TABLE products DROP FOREIGN KEY IF EXISTS fk_products_supplier;
ALTER TABLE products DROP FOREIGN KEY IF EXISTS fk_products_empresa;

-- Adicionar FKs corretas
ALTER TABLE products 
  ADD CONSTRAINT fk_products_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_empresa_id ON products(empresa_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id); 