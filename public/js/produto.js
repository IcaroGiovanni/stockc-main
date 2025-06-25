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

  // --- DOM Elements ---
  const ui = {
    loader: document.getElementById('loader'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    mainContent: document.getElementById('main-content'),
    productName: document.getElementById('product-name'),
    infoName: document.getElementById('info-name'),
    infoTotal: document.getElementById('info-total'),
    infoCreated: document.getElementById('info-created'),
    infoUpdated: document.getElementById('info-updated'),
    locationsList: document.getElementById('locations-list'),
    logsContainer: document.getElementById('logs-container'),
    editBtnContainer: document.getElementById('edit-button-container'),
    readonlyIndicator: document.getElementById('readonly-indicator'),
    editBtn: document.getElementById('edit-btn'),
    printBtn: document.getElementById('print-btn'),
    accessStatus: document.getElementById('access-status'),
  };

  // --- State ---
  let productData = null;
  const productId = window.location.pathname.split('/').pop();
  const token = getToken();
  const userData = token ? parseJwt(token) : null;

  // --- Render Functions ---
  const showState = (state) => {
    ui.loader.classList.add('hidden');
    ui.errorContainer.classList.add('hidden');
    ui.mainContent.classList.add('hidden');
    if (state === 'loading') ui.loader.classList.remove('hidden');
    if (state === 'error') ui.errorContainer.classList.remove('hidden');
    if (state === 'content') ui.mainContent.classList.remove('hidden');
  };

  const renderProduct = (product) => {
    productData = product;
    document.title = `${product.name} - StockCtrl`;
    ui.productName.textContent = product.name;
    ui.infoName.textContent = product.name;
    ui.infoCreated.textContent = formatDate(product.created_at);
    ui.infoUpdated.textContent = formatDate(product.updated_at);

    let total = 0;
    ui.locationsList.innerHTML = '';
    if(product.locations && product.locations.length > 0){
      product.locations.forEach(loc => {
        total += parseInt(loc.quantity, 10);
        const item = document.createElement('div');
        item.className = 'location-item-detailed';
        item.innerHTML = `<span>${loc.name} ${loc.sub_location ? `(${loc.sub_location})` : ''}</span> <strong>${loc.quantity}</strong>`;
        ui.locationsList.appendChild(item);
      });
    } else {
      ui.locationsList.innerHTML = '<div class="log-item-placeholder" style="padding: 1rem 0;">Sem locais de estoque.</div>';
    }
    ui.infoTotal.textContent = total;
  };

  const renderLogs = (logs) => {
    ui.logsContainer.innerHTML = '';
    if(!logs || logs.length === 0){
      ui.logsContainer.innerHTML = '<div class="log-item-placeholder">Nenhuma atividade registrada.</div>';
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'log-item';
      let detailsText = '';
      try {
        const details = JSON.parse(log.details);
        detailsText = details.nome ? `(${details.nome})` : '';
      } catch(e) {}

      item.innerHTML = `
                <i data-lucide="history" class="log-icon"></i>
                <div class="log-content">
                    <p class="log-action">${log.action.replace(/_/g, ' ')} ${detailsText}</p>
                    <p class="log-user">${log.user_full_name || 'Sistema'}</p>
                </div>
                <span class="log-timestamp">${formatDate(log.created_at)}</span>
            `;
      ui.logsContainer.appendChild(item);
    });
  };

  const renderAuthUI = () => {
    if (userData) {
      ui.accessStatus.className = 'status-badge-authed';
      ui.accessStatus.innerHTML = `
                <i data-lucide="unlock"></i>
                <div>
                    <p class="status-text">${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
                    <p class="status-subtext">${userData.full_name}</p>
                </div>
            `;
      if (hasPermission(userData.role, 'auxiliar')) {
        ui.editBtnContainer.classList.remove('hidden');
      } else {
        ui.readonlyIndicator.classList.remove('hidden');
      }
    } else {
      ui.readonlyIndicator.classList.remove('hidden');
    }
  };

  // --- Event Listeners ---
  ui.editBtn.addEventListener('click', () => {
    if(productData) window.location.href = `/estoque?editar=${productData.id}`;
  });
  ui.printBtn.addEventListener('click', () => window.print());

  // --- Main Logic ---
  const main = async () => {
    if (!productId) {
      showState('error');
      return;
    }
    showState('loading');

    let finalProduct = null;
    let finalLogs = [];

    try {
      // Se houver token, tenta buscar dados autenticados primeiro.
      if (token) {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [productRes, logsRes] = await Promise.all([
          fetch(`/api/products/${productId}`, { headers }),
          fetch(`/api/products/${productId}/logs`, { headers })
        ]);

        if (productRes.ok) {
          finalProduct = await productRes.json();
          if (logsRes.ok) {
            finalLogs = await logsRes.json();
          }
        }
      }

      // Se a busca autenticada falhou, ou se não havia token, busca os dados públicos.
      if (!finalProduct) {
        const publicProductRes = await fetch(`/api/public/products/${productId}`);
        if (!publicProductRes.ok) {
          const err = await publicProductRes.json().catch(() => ({ message: 'Produto não encontrado.' }));
          throw new Error(err.message);
        }
        finalProduct = await publicProductRes.json();
      }

      // Agora, com os dados em mãos, renderiza a página.
      renderProduct(finalProduct);
      renderLogs(finalLogs);
      renderAuthUI();
      showState('content');
      if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
      console.error(error);
      ui.errorMessage.textContent = error.message;
      showState('error');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  main();
});
