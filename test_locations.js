const mysql = require('mysql2/promise');

async function testLocations() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stock_control'
  });

  try {
    console.log('🔍 Testando dados de localização...\n');

    // 1. Verificar localizações da empresa
    console.log('1. Localizações da empresa:');
    const [locations] = await pool.query('SELECT * FROM locations WHERE empresa_id = 1');
    console.log(locations);
    console.log('');

    // 2. Verificar produtos
    console.log('2. Produtos:');
    const [products] = await pool.query('SELECT * FROM products WHERE empresa_id = 1');
    console.log(products);
    console.log('');

    // 3. Verificar localizações de produtos
    console.log('3. Localizações de produtos:');
    const [productLocations] = await pool.query(`
      SELECT pl.*, l.name as location_name, p.name as product_name
      FROM product_locations pl 
      JOIN locations l ON pl.location_id = l.id 
      JOIN products p ON pl.product_id = p.id 
      WHERE pl.empresa_id = 1
    `);
    console.log(productLocations);
    console.log('');

    // 4. Testar a query que o backend usa
    console.log('4. Testando query do backend (GET /api/products/:id):');
    if (products.length > 0) {
      const productId = products[0].id;
      const [productWithLocations] = await pool.query(`
        SELECT pl.location_id, pl.quantity, pl.sub_location, l.name as location_name
        FROM product_locations pl 
        JOIN locations l ON pl.location_id = l.id 
        WHERE pl.product_id = ? AND pl.empresa_id = ?
      `, [productId, 1]);
      console.log(`Produto ID ${productId}:`, productWithLocations);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

testLocations(); 