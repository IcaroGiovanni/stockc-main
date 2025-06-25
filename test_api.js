const fetch = require('node-fetch').default;

async function testAPI() {
  try {
    // Simular login para obter token
    const loginResponse = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('🔑 Token obtido:', token ? 'OK' : 'FALHOU');
    
    if (!token) {
      console.error('Falha no login');
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Testar GET /api/products (listagem)
    console.log('\n📋 Testando GET /api/products:');
    const productsResponse = await fetch('http://localhost:3000/api/products', { headers });
    const products = await productsResponse.json();
    console.log('Produtos:', products);
    
    // Testar GET /api/products/:id (produto individual)
    if (products.length > 0) {
      const productId = products[0].id;
      console.log(`\n🔍 Testando GET /api/products/${productId}:`);
      const productResponse = await fetch(`http://localhost:3000/api/products/${productId}`, { headers });
      const product = await productResponse.json();
      console.log('Produto individual:', product);
    }
    
    // Testar GET /api/empresa
    console.log('\n🏢 Testando GET /api/empresa:');
    const empresaResponse = await fetch('http://localhost:3000/api/empresa', { headers });
    const empresa = await empresaResponse.json();
    console.log('Empresa:', empresa);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testAPI(); 