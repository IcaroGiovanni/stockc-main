const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// --- Configuração do Banco de Dados ---
// Certifique-se de que estas credenciais estão corretas.
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_control',
};

// --- Funções de Migração ---

// 1. Cria a tabela 'product_locations' se ela não existir
async function createProductLocationsTable(pool) {
  console.log('Verificando se a tabela \'product_locations\' existe...');
  await pool.query(`
        CREATE TABLE IF NOT EXISTS product_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            location_id VARCHAR(255) NOT NULL,
            quantity INT NOT NULL DEFAULT 0,
            sub_location VARCHAR(255),
            empresa_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
            UNIQUE KEY (product_id, location_id, sub_location)
        );
    `);
  console.log('-> Tabela \'product_locations\' garantida.');
}

// 2. Garante que a coluna 'location_definitions' na tabela 'empresas' tenha IDs únicos
async function updateLocationDefinitions(pool) {
  console.log('Atualizando \'location_definitions\' com IDs únicos...');
  const [empresas] = await pool.query('SELECT id, location_definitions FROM empresas WHERE location_definitions IS NOT NULL AND location_definitions != \'[]\'');

  for (const empresa of empresas) {
    try {
      const defs = JSON.parse(empresa.location_definitions);
      let needsUpdate = false;

      if (Array.isArray(defs)) {
        defs.forEach(def => {
          if (!def.id) {
            def.id = uuidv4();
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          console.log(`- Atualizando definições para empresa ID: ${empresa.id}`);
          await pool.query('UPDATE empresas SET location_definitions = ? WHERE id = ?', [JSON.stringify(defs), empresa.id]);
        }
      }
    } catch (e) {
      console.error(`- Erro ao processar JSON para empresa ID ${empresa.id}:`, e.message);
    }
  }
  console.log('-> \'location_definitions\' atualizadas.');
}


// 3. Migra dados da coluna JSON 'quantities_by_location' para a nova tabela
async function migrateDataFromProductsJson(pool) {
  console.log('Iniciando migração de dados de \'products.quantities_by_location\'...');
  const [products] = await pool.query('SELECT id, empresa_id, quantities_by_location FROM products WHERE quantities_by_location IS NOT NULL AND quantities_by_location != \'{}\'');

  if (products.length === 0) {
    console.log('-> Nenhum produto com dados a migrar.');
    return;
  }

  console.log(`Encontrados ${products.length} produtos para migrar.`);

  for (const product of products) {
    try {
      const quantities = JSON.parse(product.quantities_by_location);
      for (const [locationId, details] of Object.entries(quantities)) {
        if (details && typeof details === 'object' && details.quantity > 0) {
          console.log(`- Migrando Produto ID ${product.id}, Local ID ${locationId}...`);

          const quantity = details.quantity || 0;
          const subLocation = details.sub_location || '';

          // Usamos INSERT ... ON DUPLICATE KEY UPDATE para evitar erros de duplicidade
          await pool.query(`
                        INSERT INTO product_locations (product_id, location_id, quantity, sub_location, empresa_id)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
                    `, [product.id, locationId, quantity, subLocation, product.empresa_id]);
        }
      }
    } catch (e) {
      console.error(`- Erro ao migrar dados para o produto ID ${product.id}:`, e.message);
    }
  }
  console.log('-> Migração de dados concluída.');
}

// --- Função Principal ---
async function runMigration() {
  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Conexão com o banco de dados estabelecida.');

    await createProductLocationsTable(pool);
    await updateLocationDefinitions(pool);
    await migrateDataFromProductsJson(pool);

    console.log('\n*** Migração concluída com sucesso! ***');
    console.log('A coluna \'quantities_by_location\' na tabela \'products\' pode ser removida manualmente se desejar.');

  } catch (error) {
    console.error('\n*** ERRO DURANTE A MIGRAÇÃO: ***', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Conexão com o banco de dados fechada.');
    }
  }
}

runMigration();