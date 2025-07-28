document.addEventListener('DOMContentLoaded', () => {
  // --- UTILS ---
  const getToken = () => localStorage.getItem('authToken');
  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch (e) { return null; }
  };
  const hasPermission = (userRole, requiredRole) => {
    const roles = { 'diretor': 2, 'auxiliar': 1, 'visualizador': 0 };
    return (roles[userRole] || 0) >= roles[requiredRole];
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // --- DOM Elements ---
  const ui = {
    companyLogo: document.getElementById('company-logo'),
    productName: document.getElementById('product-name'),
    locationsList: document.getElementById('locations-list'),
    loginStatus: document.getElementById('login-status'),
    statusText: document.getElementById('status-text'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    cancelLogin: document.getElementById('cancel-login'),
  };

  // --- State ---
  let productData = null;
  let activitiesData = [];
  let stockChart = null;
  let empresaLogoUrl = null;
  const productId = window.location.pathname.split('/').pop();
  let token = getToken();
  let userData = token ? parseJwt(token) : null;
  let isLoggedIn = !!token;

async function fetchEmpresaLogo() {
    try {
        // Usar a API pública para buscar dados da empresa
        const res = await fetch(`/api/public/empresa?t=${Date.now()}`);
        if (res.ok) {
            const empresa = await res.json();
            // Usar logo_url que é o campo correto retornado pela API
            empresaLogoUrl = empresa.logo_url || '/img/default-logo.svg';
            // Definir o src do logo
            if (ui.companyLogo) {
                ui.companyLogo.src = empresaLogoUrl;
                ui.companyLogo.onerror = function() {
                    // Fallback em caso de erro ao carregar a imagem
                    this.src = '/img/default-logo.svg';
                };
            }
        } else {
            empresaLogoUrl = '/img/default-logo.svg';
            if (ui.companyLogo) {
                ui.companyLogo.src = empresaLogoUrl;
            }
        }
    } catch (e) {
        console.error('Erro ao buscar logo da empresa:', e);
        empresaLogoUrl = '/img/default-logo.svg';
        if (ui.companyLogo) {
            ui.companyLogo.src = empresaLogoUrl;
        }
    }
}

  // --- Render Functions ---
  const showState = (state, errorMessage = '') => {
    // Função simplificada - apenas para compatibilidade
    console.log(`Estado: ${state}`, errorMessage);
  };

  const renderProductImage = (product) => {
    // Função simplificada - apenas para compatibilidade
    console.log('Renderizando imagem do produto:', product.name);
  };

  const renderProduct = (product) => {
    console.log('DEBUG: renderProduct chamada com:', product);
    productData = product;
    
    document.title = `${product.name} - StockCtrl`;
    
    if (ui.productName) ui.productName.textContent = product.name;
    
    // Renderizar localizações
    if (ui.locationsList) ui.locationsList.innerHTML = '';
    console.log('DEBUG: product.locations:', product.locations);
    
    if(product.locations && product.locations.length > 0){
      product.locations.forEach((loc, index) => {
        console.log('DEBUG: processando localização:', loc);
        if (ui.locationsList) {
          const card = document.createElement('div');
          card.className = 'location-card';
          card.innerHTML = `
            <div class="location-header">
              <div class="location-name">
                <i class="fas fa-map-marker-alt"></i>
                ${loc.name}
              </div>
            </div>
            <div class="location-quantity-section">
              <div class="location-quantity">${loc.quantity}</div>
              ${isLoggedIn ? `
                <button class="edit-quantity-btn" data-index="${index}" title="Editar Quantidade">
                  <i class="fas fa-edit"></i>
                </button>
              ` : ''}
            </div>
          `;
          ui.locationsList.appendChild(card);
          
          // Adicionar event listener para botão de edição se logado
          if (isLoggedIn) {
            const editBtn = card.querySelector('.edit-quantity-btn');
            editBtn.addEventListener('click', () => startQuantityEdit(card, index));
          }
        }
      });
    } else {
      if (ui.locationsList) ui.locationsList.innerHTML = '<div class="location-card"><p>Sem locais de estoque.</p></div>';
    }
    
    // Renderizar imagem do produto
    renderProductImage(product);
  };

  // Funções removidas para simplificar

  // --- Funções de Login ---
  function updateLoginStatus() {
    if (isLoggedIn && userData) {
      ui.loginStatus.classList.remove('logged-out');
      ui.loginStatus.classList.add('logged-in');
      ui.statusText.textContent = `Logado como ${userData.username}`;
      ui.loginStatus.querySelector('.status-dot').classList.remove('logged-out');
      ui.loginStatus.querySelector('.status-dot').classList.add('logged-in');
    } else {
      ui.loginStatus.classList.remove('logged-in');
      ui.loginStatus.classList.add('logged-out');
      ui.statusText.textContent = 'Não logado';
      ui.loginStatus.querySelector('.status-dot').classList.remove('logged-in');
      ui.loginStatus.querySelector('.status-dot').classList.add('logged-out');
    }
  }

  function showLoginModal() {
    ui.loginModal.classList.add('show');
  }

  function hideLoginModal() {
    ui.loginModal.classList.remove('show');
    ui.loginForm.reset();
  }

  async function handleLogin(username, password) {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }
      
      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      token = data.token;
      userData = parseJwt(data.token);
      isLoggedIn = true;
      
      hideLoginModal();
      updateLoginStatus();
      
      // Recarregar o produto para mostrar botões de edição
      await loadProduct();
      
    } catch (error) {
      alert('Erro no login: ' + error.message);
    }
  }

  // --- Funções de Edição de Quantidade ---
  function startQuantityEdit(locationCard, locationIndex) {
    const quantitySection = locationCard.querySelector('.location-quantity-section');
    const currentQuantity = productData.locations[locationIndex].quantity;
    
    quantitySection.innerHTML = `
      <div class="location-quantity">${currentQuantity}</div>
      <div class="quantity-actions">
        <input type="number" class="quantity-input" value="${currentQuantity}" min="0">
        <button class="btn-save" title="Salvar"><i class="fas fa-check"></i></button>
        <button class="btn-cancel" title="Cancelar"><i class="fas fa-times"></i></button>
      </div>
    `;
    
    const input = quantitySection.querySelector('.quantity-input');
    const saveBtn = quantitySection.querySelector('.btn-save');
    const cancelBtn = quantitySection.querySelector('.btn-cancel');
    
    input.focus();
    input.select();
    
    saveBtn.addEventListener('click', () => saveQuantityEdit(locationIndex, input.value));
    cancelBtn.addEventListener('click', () => cancelQuantityEdit(locationIndex));
  }

  async function saveQuantityEdit(locationIndex, newQuantity) {
    try {
      const quantity = parseInt(newQuantity, 10) || 0;
      
      // Atualizar localmente primeiro
      productData.locations[locationIndex].quantity = quantity;
      
      // Montar payload para API
      const payload = {
        name: productData.name,
        sku: productData.sku,
        brand: productData.brand,
        description: productData.description,
        unit_price: productData.unit_price,
        quantities_by_location: {}
      };
      
      productData.locations.forEach((loc) => {
        payload.quantities_by_location[loc.location_id] = {
          quantity: loc.quantity,
          sub_location: loc.sub_location || ''
        };
      });
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar quantidade');
      }
      
      // Recarregar o produto
      await loadProduct();
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
      // Recarregar para reverter mudanças
      await loadProduct();
    }
  }

  function cancelQuantityEdit(locationIndex) {
    // Recarregar o produto para cancelar edição
    loadProduct();
  }

  // --- Main Logic ---
  async function loadProduct() {
    try {
      if (!productId) {
        console.error('ID do produto não encontrado');
        return;
      }
      
      console.log('Carregando dados do produto...');
      
      await fetchEmpresaLogo();
      
      const response = await fetch(`/api/public/products/${productId}`);
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }
      
      const product = await response.json();
      console.log('DEBUG: dados do produto recebidos:', product);
      
      renderProduct(product);
      
      console.log('Produto carregado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto: ' + error.message);
    }
  }

  async function main() {
    // Inicializar status de login
    updateLoginStatus();
    
    // Carregar produto
    await loadProduct();
    
    // Adicionar event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Event listener para o formulário de login
    if (ui.loginForm) {
      ui.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = ui.username.value.trim();
        const password = ui.password.value.trim();
        
        if (!username || !password) {
          alert('Por favor, preencha todos os campos');
          return;
        }
        
        await handleLogin(username, password);
      });
    }

    // Event listener para cancelar login
    if (ui.cancelLogin) {
      ui.cancelLogin.addEventListener('click', hideLoginModal);
    }

    // Event listener para clicar no status de login (para abrir modal se não logado)
    if (ui.loginStatus) {
      ui.loginStatus.addEventListener('click', () => {
        if (!isLoggedIn) {
          showLoginModal();
        }
      });
    }

    // Fechar modal ao clicar fora
    if (ui.loginModal) {
      ui.loginModal.addEventListener('click', (e) => {
        if (e.target === ui.loginModal) {
          hideLoginModal();
        }
      });
    }
  }

  main();
});
