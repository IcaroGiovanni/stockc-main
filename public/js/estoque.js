console.log('[DEBUG] estoque.js carregado');
document.addEventListener('DOMContentLoaded', () => {
  // --- Seletores de Elementos ---
  const fabAddProduct = document.getElementById('fab-add-product');
  const productModalOverlay = document.getElementById('product-modal-overlay');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const productForm = document.getElementById('product-form');
  const modalTitle = document.getElementById('modal-title');
  const locationsContainer = document.getElementById('locations-container');
  const inventoryTableBody = document.getElementById('inventory-table-body');
  const searchInput = document.getElementById('search-input');
  const totalValueEl = document.getElementById('total-value');

  const deleteModalOverlay = document.getElementById('delete-confirm-modal-overlay');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const itemToDeleteNameEl = document.getElementById('item-to-delete-name');

  const qrCodeModalOverlay = document.getElementById('qrcode-modal-overlay');
  const closeQrCodeModalBtn = document.getElementById('close-qrcode-modal-btn');
  const qrModalTitleEl = document.getElementById('qr-modal-title');

  // Preview
  const qrPrintPreviewArea = document.getElementById('qr-print-preview-area');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const qrInfoPreview = document.getElementById('qr-info-preview');
  const qrInfoProductName = document.getElementById('qr-info-product-name');
  const qrInfoMainLocation = document.getElementById('qr-info-main-location').querySelector('span');
  const qrInfoMainQuantity = document.getElementById('qr-info-main-quantity').querySelector('span');
  const qrInfoExcessLocation = document.getElementById('qr-info-excess-location');
  const qrInfoExcessLocationText = qrInfoExcessLocation.querySelector('span');

  // Controles
  const positionButtons = document.querySelectorAll('.segmented-control .btn-segment');
  const qrSizeInput = document.getElementById('qr-size-input');
  const qrSizeValue = document.getElementById('qr-size-value');
  const qrColorPrimaryInput = document.getElementById('qr-color-primary');
  const qrColorEyesInput = document.getElementById('qr-color-eyes');

  // Botões de Ação
  const btnViewPage = document.getElementById('btn-view-product-page');
  const btnPrintQr = document.getElementById('btn-print-qr');
  const btnDownloadQr = document.getElementById('btn-download-qr');
  const btnCopyLink = document.getElementById('btn-copy-link');

  const toastContainer = document.getElementById('toast-container');
  const loaderOverlay = document.getElementById('loader-overlay');

  // --- Estado da Aplicação ---
  let allProducts = [];
  let locationDefinitions = [];
  let itemToDeleteId = null;
  let currentProductForQr = null; // Guarda o produto atual para o QR
  let qrCodeInstance = null; // Guarda a instância do QR Code
  let companyLogoUrl = null; // Armazena a URL do logo da empresa
  let currentUserRole = 'viewer'; // Default to most restrictive
  let isEditing = false;
  const sortConfig = { key: 'name', direction: 'ascending' };
  const qrConfig = {
    size: 250,
    primaryColor: '#111827',
    eyeColor: '#fbbf24'
  };

  // --- Funções de UI Auxiliares ---
  const showLoader = (show) => {
    loaderOverlay.classList.toggle('hidden', !show);
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  };

  // --- Funções da API ---
  const getToken = () => localStorage.getItem('authToken');

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  };

  const apiFetch = async (url, options = {}) => {
    showLoader(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers,
      };
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro de comunicação com o servidor.' }));
        throw new Error(errorData.message);
      }
      if (response.status === 204) return null; // No content
      return response.json();
    } finally {
      showLoader(false);
    }
  };

  // --- Funções de Renderização e Ordenação ---
  const sortProducts = () => {
    allProducts.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderLocations = (productQuantities = {}) => {
    console.log('[DEBUG] renderLocations - productQuantities:', productQuantities);
    console.log('[DEBUG] renderLocations - locationDefinitions:', locationDefinitions);
    
    locationsContainer.innerHTML = '';
    if (locationDefinitions.length === 0) {
      locationsContainer.innerHTML = '<p>Nenhuma localização definida. Configure na página de Configurações.</p>';
      return;
    }
    locationDefinitions.forEach(loc => {
      // Sempre usa String(loc.id) para garantir compatibilidade
      const details = productQuantities[String(loc.id)] || {};
      const quantity = details.quantity || 0;
      const subLocation = details.sub_location || '';
      
      console.log(`[DEBUG] Localização ${loc.name} (ID: ${loc.id}):`, { quantity, subLocation, details });

      const formGroup = document.createElement('div');
      formGroup.className = 'form-group-horizontal'; // Usar um container flex
      formGroup.innerHTML = `
                <label for="loc-${loc.id}">${loc.name.toUpperCase()}</label>
                <div class="input-row">
                    <input type="number" id="loc-${loc.id}" class="neo-input quantity-input" value="${quantity}" min="0" data-location-id="${loc.id}" placeholder="Qtde.">
                    <input type="text" id="sub-loc-${loc.id}" class="neo-input sub-location-input" value="${subLocation}" data-location-id="${loc.id}" placeholder="Sublocalização (Ex: Prat. A-5)">
                </div>
            `;
      locationsContainer.appendChild(formGroup);
    });
  };

  const renderTable = (products) => {
    console.log('DEBUG: Produtos recebidos da API:', products);
    inventoryTableBody.innerHTML = '';
    if (!Array.isArray(products) || !products.length) {
      inventoryTableBody.innerHTML = '<tr><td colspan="4">Nenhum produto encontrado.</td></tr>';
      return;
    }
    products.forEach(product => {
      // DEBUG: Mostra o produto individual
      console.log('DEBUG: Produto individual:', product);
      // Tenta extrair locations de diferentes formas possíveis
      let locations = [];
      if (Array.isArray(product.locations)) {
        locations = product.locations;
      } else if (product.quantities_by_location && typeof product.quantities_by_location === 'object') {
        // Caso venha como objeto de localizações
        locations = Object.entries(product.quantities_by_location).map(([key, val]) => ({
          name: key,
          quantity: val.quantity || 0,
          sub_location: val.sub_location || ''
        }));
      }
      // Monta string de localizações e quantidades corretamente
      let locString = 'Sem estoque';
      if (Array.isArray(locations) && locations.length > 0) {
        locString = locations.map(loc => {
          const locName = loc.name || 'Sem localização';
          const subLoc = loc.sub_location ? ` (${loc.sub_location})` : '';
          return `${locName}${subLoc}: <b>${loc.quantity !== undefined && loc.quantity !== null ? loc.quantity : 0}</b>`;
        }).join('<br>');
      }
      // Soma total de todas as localizações
      const totalQty = Array.isArray(locations) ? locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0) : 0;
      // Renderiza botões de ação sempre
      let actionsHTML = '<div class="actions-container">';
      actionsHTML += `<button class="action-btn btn-editar" data-id="${product.id}" title="Editar"><i class="fas fa-edit"></i></button>`;
      actionsHTML += `<button class="action-btn btn-qrcode" data-id="${product.id}" data-name="${product.name}" title="Gerar QR Code"><i class="fas fa-qrcode"></i></button>`;
      actionsHTML += `<button class="action-btn btn-apagar" data-id="${product.id}" data-name="${product.name}" title="Apagar"><i class="fas fa-trash"></i></button>`;
      actionsHTML += '</div>';
      // Renderiza linha
      inventoryTableBody.innerHTML += `
        <tr>
          <td>${product.name || 'Sem nome'}</td>
          <td>${locString}</td>
          <td style="text-align:center;">${totalQty}</td>
          <td style="text-align:center;">${actionsHTML}</td>
        </tr>
      `;
    });
  };

  const filterAndRender = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
    sortProducts(); // Garante que a ordenação seja aplicada antes de renderizar
    renderTable(filtered);
    totalValueEl.textContent = filtered.length;
  };

  // --- Funções de Modal ---
  const openModal = (title, product = null) => {
    console.log('[DEBUG] openModal - title:', title, 'product:', product);
    
    modalTitle.textContent = title;
    isEditing = !!product;
    
    // Reset do formulário
    productForm.reset();
    
    if (product) {
      console.log('[DEBUG] Preenchendo formulário com dados do produto:', product);
      console.log('[DEBUG] product.locations:', product.locations);
      console.log('[DEBUG] product.quantities_by_location:', product.quantities_by_location);
      
      // Converter locations array para quantities_by_location object
      let quantities = {};
      if (product.quantities_by_location) {
        // Se já existe quantities_by_location, usar diretamente
        quantities = product.quantities_by_location;
        console.log('[DEBUG] Usando quantities_by_location existente:', quantities);
      } else if (product.locations && Array.isArray(product.locations)) {
        // Converter locations array para quantities_by_location
        console.log('[DEBUG] Convertendo locations array para quantities_by_location');
        product.locations.forEach(loc => {
          quantities[String(loc.location_id)] = {
            quantity: loc.quantity || 0,
            sub_location: loc.sub_location || ''
          };
        });
      }
      
      console.log('[DEBUG] Quantities by location convertido:', quantities);
      renderLocations(quantities);
    } else {
      console.log('[DEBUG] Modal aberto para novo produto');
      document.getElementById('product-id').value = '';
      document.getElementById('product-name').value = '';
      renderLocations({});
    }
    
    productModalOverlay.classList.remove('hidden');
  };

  const closeModal = () => {
    productModalOverlay.classList.add('hidden');
  };

  const openDeleteModal = (id, name) => {
    itemToDeleteId = id;
    itemToDeleteNameEl.textContent = name;
    deleteModalOverlay.classList.remove('hidden');
  };

  const closeDeleteModal = () => {
    itemToDeleteId = null;
    deleteModalOverlay.classList.add('hidden');
  };

  // Função utilitária para garantir campos obrigatórios e valores default para QR
  function sanitizeProductForQR(product) {
    return {
      id: product.id,
      name: product.name || 'Sem nome',
      location: product.location || 'Sem localização',
      quantity: product.quantity !== undefined && product.quantity !== null ? product.quantity : 0,
      barcode: product.barcode || '',
    };
  }

  const generateQrCode = () => {
    if (!currentProductForQr) return;

    qrCodeContainer.innerHTML = '';
    try {
      const productUrl = `${window.location.origin}/produto/${currentProductForQr.id}`;
      const qrOptions = {
        width: qrConfig.size,
        height: qrConfig.size,
        data: productUrl,
        dotsOptions: { color: qrConfig.primaryColor, type: 'rounded' },
        backgroundOptions: { color: 'transparent' },
        cornersSquareOptions: { color: qrConfig.eyeColor, type: 'extra-rounded' },
        cornersDotOptions: { color: qrConfig.primaryColor }
      };

      if (companyLogoUrl) {
        qrOptions.image = companyLogoUrl;
        qrOptions.imageOptions = { imageSize: 0.4, hideBackgroundDots: true, margin: 4 };
      }

      qrCodeInstance = new QRCodeStyling(qrOptions);
      qrCodeInstance.append(qrCodeContainer);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      showToast('Erro ao gerar QR Code: ' + (error.message || 'Dados incompletos'), 'error');
    }
  };

  const openQrCodeModal = (product) => {
    const sanitized = sanitizeProductForQR(product);
    currentProductForQr = sanitized;
    qrModalTitleEl.textContent = `🔳 QR Code: ${sanitized.name}`;

    // --- Preenche as informações de estoque ---
    qrInfoProductName.textContent = sanitized.name;

    // Encontrar a localização principal (primeira com > 0 ou a primeira da lista)
    let mainLocId = locationDefinitions[0]?.id;
    let hasStock = false;
    for(const locId in sanitized.quantities_by_location) {
      if (sanitized.quantities_by_location[locId]?.quantity > 0) {
        mainLocId = locId;
        hasStock = true;
        break;
      }
    }
    // Correção: garantir que mainLocDetails sempre seja um objeto válido
    const mainLocDef = locationDefinitions.find(l => l.id === mainLocId);
    const mainLocDetails = (sanitized.quantities_by_location && sanitized.quantities_by_location[mainLocId]) ? sanitized.quantities_by_location[mainLocId] : { quantity: 0, sub_location: '' };
    const subLocText = mainLocDetails.sub_location ? `(${mainLocDetails.sub_location})` : '';

    qrInfoMainLocation.textContent = `${mainLocDef?.name || 'N/A'} ${subLocText}`.trim();
    qrInfoMainQuantity.textContent = mainLocDetails.quantity || 0;
    qrInfoMainQuantity.parentElement.style.display = 'block'; // Garante que a quantidade apareça no modal

    // Resetar e encontrar excesso
    qrInfoExcessLocation.classList.add('hidden');
    // (Lógica de excesso pode ser adicionada aqui se necessário)

    // Reseta e gera o QR Code com a configuração atual
    qrSizeInput.value = qrConfig.size;
    qrSizeValue.textContent = `${qrConfig.size}px`;
    qrColorPrimaryInput.value = qrConfig.primaryColor;
    qrColorEyesInput.value = qrConfig.eyeColor;
    generateQrCode();

    qrCodeModalOverlay.classList.remove('hidden');
  };

  const closeQrCodeModal = () => {
    qrCodeModalOverlay.classList.add('hidden');
    currentProductForQr = null;
  };

  // --- Listeners do Modal de QR Code ---

  // Posição
  positionButtons.forEach(button => {
    button.addEventListener('click', () => {
      positionButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const position = button.dataset.position;
      if (position === 'right') {
        qrPrintPreviewArea.classList.add('layout-side-by-side');
      } else {
        qrPrintPreviewArea.classList.remove('layout-side-by-side');
      }
    });
  });

  // Tamanho
  qrSizeInput.addEventListener('input', (event) => {
    qrSizeValue.textContent = `${event.target.value}px`;
  });
  qrSizeInput.addEventListener('change', (event) => {
    qrConfig.size = parseInt(event.target.value, 10);
    generateQrCode();
  });

  // Cores
  qrColorPrimaryInput.addEventListener('change', (event) => {
    qrConfig.primaryColor = event.target.value;
    generateQrCode();
  });
  qrColorEyesInput.addEventListener('change', (event) => {
    qrConfig.eyeColor = event.target.value;
    generateQrCode();
  });

  // Botões de Ação
  btnViewPage.addEventListener('click', () => {
    if (currentProductForQr) {
      window.open(`${window.location.origin}/produto/${currentProductForQr.id}`, '_blank');
    }
  });

  btnDownloadQr.addEventListener('click', () => {
    if (qrCodeInstance && currentProductForQr) {
      qrCodeInstance.download({ name: `qrcode-${currentProductForQr.name.replace(/\s+/g, '_')}`, extension: 'png' });
    }
  });

  btnCopyLink.addEventListener('click', () => {
    if (currentProductForQr) {
      const link = `${window.location.origin}/produto/${currentProductForQr.id}`;
      navigator.clipboard.writeText(link).then(() => {
        showToast('Link copiado para a área de transferência!', 'success');
      }, () => {
        showToast('Falha ao copiar o link.', 'error');
      });
    }
  });

  // *** CORREÇÃO FINAL E DEFINITIVA DA IMPRESSÃO ***
  btnPrintQr.addEventListener('click', () => {
    if (!currentProductForQr || !qrCodeInstance) return;

    const qrCanvas = qrCodeContainer.querySelector('canvas');
    if (!qrCanvas) {
      showToast('Elemento QR Code não encontrado para impressão.', 'error');
      return;
    }
    const qrCodeDataUrl = qrCanvas.toDataURL();

    const productName = qrInfoProductName.textContent;
    const locationName = qrInfoMainLocation.textContent;
    const isSideLayout = qrPrintPreviewArea.classList.contains('layout-side-by-side');

    const img = new Image();

    img.onload = () => {
      const printLayout = `
                <html>
                <head>
                    <title>Imprimir Etiqueta - ${productName}</title>
                    <style>
                        @media print { 
                            @page { margin: 10mm; size: auto; } 
                            body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } 
                        }
                        html, body { 
                            height: 100%; width: 100%; margin: 0; padding: 0; 
                            font-family: Arial, sans-serif; 
                            display: flex; justify-content: center; align-items: center;
                        }
                        .container-vertical { 
                            display: flex; flex-direction: column; align-items: center; 
                            text-align: center; gap: 10px; 
                        }
                        .container-horizontal { 
                            display: flex; flex-direction: row; align-items: center; 
                            text-align: left; gap: 15px; 
                        }
                        img { display: block; width: 120px; height: 120px; }
                        .info { }
                        h3 { margin: 0 0 5px 0; font-size: 1rem; }
                        p { margin: 0; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <div class="${isSideLayout ? 'container-horizontal' : 'container-vertical'}">
                        <img src="${img.src}">
                        <div class="info">
                            <h3>${productName}</h3>
                            <p><b>Local:</b> ${locationName}</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.top = '-100px';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(printLayout);
      doc.close();

      const printAndClean = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      };

      setTimeout(printAndClean, 250);
    };

    img.onerror = () => {
      showToast('Erro ao carregar a imagem do QR Code para impressão.', 'error');
    };

    img.src = qrCodeDataUrl;
  });

  // --- Lógica de Permissão ---
  const hasPermission = (userRole, requiredRole) => {
    const hierarchy = { 'viewer': 0, 'user': 1, 'admin': 2, 'diretor': 3 };
    return hierarchy[userRole] >= hierarchy[requiredRole];
  };

  // --- Lógica Principal e Event Listeners ---
  const initialize = async () => {
    showLoader(true);
    try {
      const userData = parseJwt(getToken());
      if(userData) {
        currentUserRole = userData.role;
      }

      console.log('[DEBUG] Inicializando aplicação...');
      
      const [empresa, products] = await Promise.all([
        apiFetch('/api/empresa'),
        apiFetch('/api/products')
      ]);

      console.log('[DEBUG] Dados da empresa recebidos:', empresa);
      console.log('[DEBUG] Produtos recebidos:', products);

      locationDefinitions = empresa.location_definitions || [];
      // Corrige caso venha como string JSON
      if (typeof locationDefinitions === 'string') {
        try {
          locationDefinitions = JSON.parse(locationDefinitions);
        } catch (error) {
          locationDefinitions = [];
        }
      }
      
      console.log('[DEBUG] Location definitions processadas:', locationDefinitions);
      
      companyLogoUrl = empresa.logo || null;
      allProducts = products;
      totalValueEl.textContent = allProducts.length;

      // Verifica se há um produto para editar na URL
      const urlParams = new URLSearchParams(window.location.search);
      const productIdToEdit = urlParams.get('editar');

      if (productIdToEdit) {
        const productToEdit = allProducts.find(p => p.id == productIdToEdit);
        if (productToEdit) {
          // Atraso mínimo para garantir que a UI se estabilize
          setTimeout(() => openModal('Editar Produto', productToEdit), 100);
        }
        // Limpa o parâmetro da URL para não reabrir ao atualizar
        history.replaceState(null, '', window.location.pathname);
      }

      filterAndRender();

    } catch (error) {
      console.error('Erro na inicialização:', error);
      showToast(error.message, 'error');
    } finally {
      showLoader(false);
    }
  };

  // Abrir/Fechar Modais
  fabAddProduct.addEventListener('click', () => openModal('Adicionar Novo Produto'));
  closeModalBtn.addEventListener('click', closeModal);
  productModalOverlay.addEventListener('click', (event) => {
    if (event.target === productModalOverlay) closeModal();
  });

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', (event) => {
    if (event.target === deleteModalOverlay) closeDeleteModal();
  });

  // Abrir/Fechar Modal de QR Code
  closeQrCodeModalBtn.addEventListener('click', closeQrCodeModal);
  qrCodeModalOverlay.addEventListener('click', (event) => {
    if (event.target === qrCodeModalOverlay) closeQrCodeModal();
  });

  // Ações do Formulário
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const quantities_by_location = {};

    // Nova lógica para coletar quantidade e sublocalização
    locationsContainer.querySelectorAll('.form-group-horizontal').forEach(group => {
      const quantityInput = group.querySelector('.quantity-input');
      const subLocationInput = group.querySelector('.sub-location-input');
      const locationId = quantityInput.dataset.locationId;

      if (locationId && locationId !== 'undefined' && locationId !== '') {
        quantities_by_location[locationId] = {
          quantity: parseInt(quantityInput.value, 10) || 0,
          sub_location: subLocationInput.value.trim()
        };
      }
    });

    const payload = { name, quantities_by_location };

    try {
      if (isEditing) {
        const { name, ...updatePayload } = payload;
        await apiFetch(`/api/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Produto criado com sucesso!', 'success');
      }
      closeModal();
      await initialize(); // Recarrega tudo
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showToast(error.message, 'error');
    }
  });

  // Busca
  searchInput.addEventListener('input', filterAndRender);

  // Delegação de eventos para botões de ação na tabela
  inventoryTableBody.addEventListener('click', (event) => {
    const target = event.target.closest('button.action-btn');
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains('btn-editar')) {
      const product = allProducts.find(p => p.id.toString() === id);
      openModal(`Editar Produto: ${product.name}`, product);
    } else if (target.classList.contains('btn-qrcode')) {
      const product = allProducts.find(p => p.id.toString() === id);
      openQrCodeModal(product);
    } else if (target.classList.contains('btn-apagar')) {
      const name = target.dataset.name;
      openDeleteModal(id, name);
    }
  });

  // Confirmação de exclusão
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!itemToDeleteId) return;
    try {
      await apiFetch(`/api/products/${itemToDeleteId}`, { method: 'DELETE' });
      showToast('Produto apagado com sucesso!', 'success');
      closeDeleteModal();
      await initialize();
    } catch (error) {
      console.error('Erro ao apagar produto:', error);
      showToast(error.message, 'error');
    }
  });

  // Ordenação da Tabela
  document.querySelector('th[data-sort-key="name"]').addEventListener('click', (event) => {
    const key = event.currentTarget.dataset.sortKey;
    if (sortConfig.key === key) {
      sortConfig.direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    } else {
      sortConfig.key = key;
      sortConfig.direction = 'ascending';
    }
    filterAndRender();
  });

  // Inicia a aplicação
  initialize();
});