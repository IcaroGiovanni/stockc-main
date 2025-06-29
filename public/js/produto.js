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
    loader: document.getElementById('loader'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    mainContent: document.getElementById('main-content'),
    productName: document.getElementById('product-name'),
    statusBadge: document.getElementById('status-badge'),
    editBtn: document.getElementById('edit-btn'),
    printBtn: document.getElementById('print-btn'),
    qrBtn: document.getElementById('qr-btn'),
    shareBtn: document.getElementById('share-btn'),
    infoTotal: document.getElementById('info-total'),
    locationsCount: document.getElementById('locations-count'),
    unitPrice: document.getElementById('unit-price'),
    movementsCount: document.getElementById('movements-count'),
    productSku: document.getElementById('product-sku'),
    productBrand: document.getElementById('product-brand'),
    productDescription: document.getElementById('product-description'),
    productCreated: document.getElementById('product-created'),
    productUpdated: document.getElementById('product-updated'),
    locationsList: document.getElementById('locations-list'),
    activitiesList: document.getElementById('activities-list'),
    addLocationBtn: document.getElementById('add-location-btn'),
    editPanel: document.getElementById('edit-panel'),
    editForm: document.getElementById('edit-form'),
    editName: document.getElementById('edit-name'),
    editSku: document.getElementById('edit-sku'),
    editBrand: document.getElementById('edit-brand'),
    editPrice: document.getElementById('edit-price'),
    editDescription: document.getElementById('edit-description'),
    editLocationsList: document.getElementById('edit-locations-list'),
    closeEdit: document.getElementById('close-edit'),
    cancelEdit: document.getElementById('cancel-edit'),
    // Login elements
    loginStatus: document.getElementById('login-status'),
    loggedInIndicator: document.getElementById('logged-in-indicator'),
    loginFormContainer: document.getElementById('login-form-container'),
    showLoginBtn: document.getElementById('show-login-btn'),
    loginModal: document.getElementById('login-modal'),
    closeLoginModal: document.getElementById('close-login-modal'),
    inlineLoginForm: document.getElementById('inline-login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    cancelLogin: document.getElementById('cancel-login'),
    // Imagem do Produto
    productImage: document.getElementById('product-image'),
    uploadImageLabel: document.getElementById('upload-image-label'),
    uploadImageInput: document.getElementById('upload-image-input'),
  };

  // --- State ---
  let productData = null;
  let activitiesData = [];
  let stockChart = null;
  let empresaLogoUrl = null;
  const productId = window.location.pathname.split('/').pop();
  const token = getToken();
  const userData = token ? parseJwt(token) : null;
  const canEdit = userData && (userData.role === 'diretor' || userData.role === 'auxiliar');

  // Buscar logo da empresa
  async function fetchEmpresaLogo() {
    try {
      const res = await fetch('/api/empresa', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const empresa = await res.json();
        empresaLogoUrl = empresa.logo || './assets/default-logo.png';
      } else {
        empresaLogoUrl = './assets/default-logo.png';
      }
    } catch (e) {
      empresaLogoUrl = './assets/default-logo.png';
    }
  }

  // --- Render Functions ---
  const showState = (state, errorMessage = '') => {
    ui.loader.classList.add('hidden');
    ui.errorContainer.classList.add('hidden');
    ui.mainContent.classList.add('hidden');
    if (state === 'loading') ui.loader.classList.remove('hidden');
    if (state === 'error') {
      ui.errorContainer.classList.remove('hidden');
      if (errorMessage && ui.errorMessage) {
        ui.errorMessage.textContent = errorMessage;
      }
    }
    if (state === 'content' || state === 'success') ui.mainContent.classList.remove('hidden');
  };

  const renderProductImage = (product) => {
    const img = document.getElementById('product-image');
    const uploadLabel = document.getElementById('upload-image-label');
    if (!img) return;
    img.src = empresaLogoUrl || './assets/default-logo.png';
    img.alt = product.name || 'Imagem do Produto';
    // Mostrar botão de upload se logado
    if (getToken() && uploadLabel) {
      uploadLabel.classList.remove('hidden');
    } else if (uploadLabel) {
      uploadLabel.classList.add('hidden');
    }
  };

  const renderProduct = (product) => {
    console.log('DEBUG: renderProduct chamada com:', product);
    productData = product;
    
    // Verificar se todos os elementos do DOM existem
    console.log('DEBUG: ui.productName:', ui.productName);
    console.log('DEBUG: ui.infoTotal:', ui.infoTotal);
    console.log('DEBUG: ui.locationsList:', ui.locationsList);
    
    document.title = `${product.name} - StockCtrl`;
    
    if (ui.productName) ui.productName.textContent = product.name;
    
    // Status badge
    if (ui.statusBadge) {
      ui.statusBadge.textContent = product.is_active ? 'ATIVO' : 'INATIVO';
      ui.statusBadge.className = `status-badge ${product.is_active ? 'active' : 'inactive'}`;
    }

    // Calcular total e renderizar localizações
    let total = 0;
    if (ui.locationsList) ui.locationsList.innerHTML = '';
    console.log('DEBUG: product.locations:', product.locations);
    
    const isLoggedIn = !!getToken();
    
    if(product.locations && product.locations.length > 0){
      ui.locationsCount.textContent = product.locations.length;
      
      product.locations.forEach((loc, index) => {
        console.log('DEBUG: processando localização:', loc);
        total += parseInt(loc.quantity, 10);
        if (ui.locationsList) {
          const card = document.createElement('div');
          card.className = 'location-card';
          card.innerHTML = `
            <div class="location-header">
              <div class="location-name">
                <i class="fas fa-map-marker-alt"></i>
                ${loc.name}
              </div>
              ${loc.sub_location ? `
                <div class="location-sublocation">
                  <i class="fas fa-folder"></i>
                  ${loc.sub_location}
                </div>
              ` : ''}
            </div>
            <div class="location-quantity-section">
              <div class="location-quantity">${loc.quantity}</div>
              ${isLoggedIn ? `
                <div class="location-actions">
                  <button class="btn-edit-qty" data-index="${index}" title="Editar Quantidade">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `;
          ui.locationsList.appendChild(card);
        }
      });
      // Adicionar event listeners para edição de quantidade
      if (isLoggedIn && ui.locationsList) {
        ui.locationsList.querySelectorAll('.btn-edit-qty').forEach(btn => {
          btn.addEventListener('click', function() {
            const card = this.closest('.location-card');
            const idx = parseInt(this.getAttribute('data-index'), 10);
            startQuantityEdit(card, idx);
          });
        });
      }
    } else {
      ui.locationsCount.textContent = '0';
      if (ui.locationsList) ui.locationsList.innerHTML = '<div class="location-card"><p>Sem locais de estoque.</p></div>';
    }
    
    console.log('DEBUG: total calculado:', total);
    console.log('DEBUG: ui.infoTotal element:', ui.infoTotal);
    if (ui.infoTotal) ui.infoTotal.textContent = total;

    // Informações detalhadas
    if (ui.productSku) ui.productSku.textContent = product.sku || '-';
    if (ui.productBrand) ui.productBrand.textContent = product.brand || '-';
    if (ui.productDescription) ui.productDescription.textContent = product.description || '-';
    if (ui.productCreated) ui.productCreated.textContent = formatDate(product.created_at);
    if (ui.productUpdated) ui.productUpdated.textContent = formatDate(product.updated_at);
    if (ui.unitPrice) ui.unitPrice.textContent = formatCurrency(product.unit_price);

    // Mostrar botão de edição se autorizado
    if (canEdit && ui.editBtn) {
      ui.editBtn.classList.remove('hidden');
    }
    if (canEdit && ui.addLocationBtn) {
      ui.addLocationBtn.classList.remove('hidden');
    }

    // Criar gráfico de estoque
    createStockChart(product.locations || []);

    // --- Edição Inline de Campos de Texto (SKU, Marca, Descrição) ---
    enableInlineEditFields();

    // Renderizar imagem do produto
    renderProductImage(product);
    setupImageUpload();
  };

  const createStockChart = (locations) => {
    const ctx = document.getElementById('stock-chart');
    if (!ctx) return;

    // Destruir gráfico existente
    if (stockChart) {
      stockChart.destroy();
    }

    const labels = locations.map(loc => loc.name);
    const data = locations.map(loc => loc.quantity);

    stockChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#fbbf24',
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#84cc16'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#f3f4f6',
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  };

  const renderActivities = (activities) => {
    if (!ui.activitiesList) return;
    
    ui.activitiesList.innerHTML = '';
    ui.movementsCount.textContent = activities.length;
    
    if (!activities || activities.length === 0) {
      ui.activitiesList.innerHTML = '<div class="activity-item"><p>Nenhuma atividade registrada.</p></div>';
      return;
    }

    activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      
      let icon = 'activity';
      let title = activity.action.replace(/_/g, ' ');
      
      // Definir ícone baseado na ação
      if (activity.action.includes('CRIOU')) icon = 'plus-circle';
      else if (activity.action.includes('EDITOU')) icon = 'edit-3';
      else if (activity.action.includes('APAGOU')) icon = 'trash-2';
      else if (activity.action.includes('MOVIMENTOU')) icon = 'move';
      
      item.innerHTML = `
        <div class="activity-icon">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${title}</div>
          <div class="activity-user">${activity.user_full_name || 'Sistema'}</div>
        </div>
        <div class="activity-time">${formatDate(activity.created_at)}</div>
      `;
      ui.activitiesList.appendChild(item);
    });
    
    // Recriar ícones do Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  // --- Funções auxiliares de login ---
  function showLoginModal() {
    if (ui.loginModal) ui.loginModal.classList.remove('hidden');
  }
  function hideLoginModal() {
    if (ui.loginModal) ui.loginModal.classList.add('hidden');
    if (ui.inlineLoginForm) ui.inlineLoginForm.reset();
  }
  async function handleLogin(username, password) {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Credenciais inválidas');
      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      hideLoginModal();
      updateLoginStatus();
      window.location.reload();
    } catch (error) {
      alert('Erro no login: ' + error.message);
    }
  }
  function updateLoginStatus() {
    const token = getToken();
    const userData = token ? parseJwt(token) : null;
    if (userData && ui.loggedInIndicator && ui.loginFormContainer) {
      ui.loggedInIndicator.classList.remove('hidden');
      ui.loginFormContainer.classList.add('hidden');
    } else if (ui.loggedInIndicator && ui.loginFormContainer) {
      ui.loggedInIndicator.classList.add('hidden');
      ui.loginFormContainer.classList.remove('hidden');
    }
  }

  // --- Funções auxiliares de edição inline ---
  function startQuantityEdit(locationCard, locationIndex) {
    const quantitySection = locationCard.querySelector('.location-quantity-section');
    const currentQuantity = productData.locations[locationIndex].quantity;
    quantitySection.innerHTML = `
      <div class="quantity-edit-mode">
        <input type="number" class="quantity-input" value="${currentQuantity}" min="0" />
        <button class="btn-save-qty" title="Salvar"><i class="fas fa-check"></i></button>
        <button class="btn-cancel-qty" title="Cancelar"><i class="fas fa-times"></i></button>
      </div>
    `;
    const input = quantitySection.querySelector('.quantity-input');
    input.focus();
    input.select();
    // Adicionar event listeners
    quantitySection.querySelector('.btn-save-qty').addEventListener('click', function() {
      saveQuantityEdit(locationIndex, this);
    });
    quantitySection.querySelector('.btn-cancel-qty').addEventListener('click', function() {
      cancelQuantityEdit(locationIndex);
    });
  }
  async function saveQuantityEdit(locationIndex, button) {
    const locationCard = button.closest('.location-card');
    const input = locationCard.querySelector('.quantity-input');
    const newQuantity = parseInt(input.value, 10) || 0;
    try {
      // Atualizar localmente primeiro
      productData.locations[locationIndex].quantity = newQuantity;
      // Montar payload completo
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
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Erro ao salvar quantidade');
      renderProduct(productData);
      createStockChart(productData.locations || []);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
      productData.locations[locationIndex].quantity = parseInt(input.defaultValue, 10) || 0;
    }
  }
  function cancelQuantityEdit(locationIndex) {
    renderProduct(productData);
  }

  // Expor funções globalmente
  window.saveQuantityEdit = saveQuantityEdit;
  window.cancelQuantityEdit = cancelQuantityEdit;
  window.startQuantityEdit = startQuantityEdit;

  // --- Edição Inline ---
  function openEditPanel() {
    if (!ui.editPanel) return;
    
    ui.editPanel.classList.remove('hidden');
    
    // Preencher formulário com dados atuais
    if (ui.editName) ui.editName.value = productData.name || '';
    if (ui.editSku) ui.editSku.value = productData.sku || '';
    if (ui.editBrand) ui.editBrand.value = productData.brand || '';
    if (ui.editPrice) ui.editPrice.value = productData.unit_price || '';
    if (ui.editDescription) ui.editDescription.value = productData.description || '';
    
    // Renderizar campos de edição para localizações
    if (ui.editLocationsList) {
      ui.editLocationsList.innerHTML = '';
      (productData.locations || []).forEach((loc, idx) => {
        const item = document.createElement('div');
        item.className = 'edit-location-item';
        item.innerHTML = `
          <span class="edit-location-name">${loc.name}</span>
          <input type="number" class="neo-input edit-location-input" data-location-id="${loc.location_id}" value="${loc.quantity}" min="0" />
        `;
        ui.editLocationsList.appendChild(item);
      });
    }
  }

  function closeEditPanel() {
    if (ui.editPanel) ui.editPanel.classList.add('hidden');
  }

  // --- Event Listeners ---
  if (canEdit && ui.editBtn) {
    ui.editBtn.addEventListener('click', openEditPanel);
  }
  
  if (ui.closeEdit) {
    ui.closeEdit.addEventListener('click', closeEditPanel);
  }
  
  if (ui.cancelEdit) {
    ui.cancelEdit.addEventListener('click', closeEditPanel);
  }

  if (ui.printBtn) {
    ui.printBtn.addEventListener('click', () => window.print());
  }

  if (ui.qrBtn) {
    ui.qrBtn.addEventListener('click', () => {
      // Implementar geração de QR Code
      alert('Funcionalidade de QR Code em desenvolvimento');
    });
  }

  if (ui.shareBtn) {
    ui.shareBtn.addEventListener('click', () => {
      // Implementar compartilhamento
      if (navigator.share) {
        navigator.share({
          title: productData?.name || 'Produto',
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    });
  }

  // Login event listeners
  if (ui.showLoginBtn) {
    ui.showLoginBtn.addEventListener('click', showLoginModal);
  }

  if (ui.closeLoginModal) {
    ui.closeLoginModal.addEventListener('click', hideLoginModal);
  }

  if (ui.cancelLogin) {
    ui.cancelLogin.addEventListener('click', hideLoginModal);
  }

  if (ui.inlineLoginForm) {
    ui.inlineLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = ui.loginUsername.value.trim();
      const password = ui.loginPassword.value.trim();
      
      if (!username || !password) {
        alert('Por favor, preencha todos os campos');
        return;
      }
      
      await handleLogin(username, password);
    });
  }

  if (ui.editForm) {
    ui.editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = ui.editName.value.trim();
      const newSku = ui.editSku.value.trim();
      const newBrand = ui.editBrand.value.trim();
      const newPrice = parseFloat(ui.editPrice.value) || 0;
      const newDescription = ui.editDescription.value.trim();
      // Coletar novas quantidades
      const newQuantities = Array.from(ui.editLocationsList.querySelectorAll('.edit-location-input'))
        .map(input => ({
          location_id: input.dataset.locationId,
          quantity: parseInt(input.value, 10) || 0
        }));
      // Montar payload para API
      const payload = {
        name: newName,
        sku: newSku,
        brand: newBrand,
        unit_price: newPrice,
        description: newDescription,
        quantities_by_location: {}
      };
      newQuantities.forEach(q => {
        payload.quantities_by_location[q.location_id] = {
          quantity: q.quantity,
          sub_location: '' // ajuste se houver campo de sublocalização
        };
      });
      try {
        const res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Erro ao salvar alterações.');
        closeEditPanel();
        await main(); // Recarregar dados
      } catch (err) {
        alert('Erro ao salvar: ' + err.message);
      }
    });
  }

  // --- Edição Inline de Campos de Texto (SKU, Marca, Descrição) ---
  function enableInlineEditFields() {
    if (!getToken()) return; // Só permite se estiver logado
    document.querySelectorAll('.editable-field').forEach(el => {
      el.classList.add('editable-enabled');
      el.title = 'Clique para editar';
      el.addEventListener('click', function handler(e) {
        if (el.classList.contains('editing')) return;
        el.classList.add('editing');
        const field = el.dataset.field;
        const currentValue = el.textContent === '-' || el.textContent === 'Clique para adicionar' ? '' : el.textContent;
        el.innerHTML = `
          <input type="text" class="inline-edit-input" value="${currentValue}" />
          <button class="btn-save-inline" title="Salvar"><i class="fas fa-check"></i></button>
          <button class="btn-cancel-inline" title="Cancelar"><i class="fas fa-times"></i></button>
        `;
        const input = el.querySelector('input');
        input.focus();
        input.select();
        // Salvar
        el.querySelector('.btn-save-inline').addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const newValue = input.value.trim();
          await saveInlineField(field, newValue, el);
        });
        // Cancelar
        el.querySelector('.btn-cancel-inline').addEventListener('click', (ev) => {
          ev.stopPropagation();
          renderProduct(productData);
        });
      });
    });
  }

  async function saveInlineField(field, value, el) {
    try {
      // Atualizar localmente
      productData[field] = value;
      // Montar payload completo
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
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      renderProduct(productData);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
      renderProduct(productData);
    }
  }

  // --- Upload de imagem ---
  function setupImageUpload() {
    const input = document.getElementById('upload-image-input');
    if (!input) return;
    input.onchange = async function() {
      if (!input.files || !input.files[0]) return;
      const formData = new FormData();
      formData.append('image', input.files[0]);
      try {
        const res = await fetch(`/api/products/${productId}/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}` },
          body: formData
        });
        if (!res.ok) throw new Error('Erro ao enviar imagem');
        const data = await res.json();
        productData.image_url = data.image_url;
        renderProduct(productData);
      } catch (err) {
        alert('Erro ao enviar imagem: ' + err.message);
      }
    };
  }

  // --- Main Logic ---
  async function main() {
    try {
      if (!productId) {
        showState('error', 'ID do produto não encontrado');
        return;
      }
      
      showState('loading');
      
      // Inicializar status de login
      updateLoginStatus();
      
      await fetchEmpresaLogo();
      
      const response = await fetch(`/api/public/products/${productId}`);
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }
      
      const product = await response.json();
      console.log('DEBUG: dados do produto recebidos:', product);
      
      renderProduct(product);
      
      // Buscar atividades do produto
      try {
        const activitiesResponse = await fetch(`/api/products/${productId}/logs`);
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          renderActivities(activities);
        }
      } catch (error) {
        console.log('Não foi possível carregar atividades:', error);
        renderActivities([]);
      }
      
      showState('content');
      
      // Recriar ícones do Lucide após renderizar tudo
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showState('error', error.message);
    }
  }

  main();
});

