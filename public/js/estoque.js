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

  // --- Variável para armazenar o texto customizado da etiqueta ---
  let customPrintText = '';

  // --- Seletores do novo recurso ---
  const btnEditPrintText = document.getElementById('btn-edit-print-text');
  const editPrintTextContainer = document.getElementById('edit-print-text-container');
  const inputPrintText = document.getElementById('input-print-text');
  const btnSavePrintText = document.getElementById('btn-save-print-text');

  // Debug dos elementos
  console.log('[DEBUG] Elementos QR Code encontrados:', {
    btnEditPrintText: !!btnEditPrintText,
    editPrintTextContainer: !!editPrintTextContainer,
    inputPrintText: !!inputPrintText,
    btnSavePrintText: !!btnSavePrintText
  });

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
    // (Lógica de estoque pode ser adicionada aqui se necessário)

    // Reseta e gera o QR Code com a configuração atual
    qrSizeInput.value = qrConfig.size;
    qrSizeValue.textContent = `${qrConfig.size}px`;
    qrColorPrimaryInput.value = qrConfig.primaryColor;
    qrColorEyesInput.value = qrConfig.eyeColor;
    generateQrCode();

    qrCodeModalOverlay.classList.remove('hidden');

    // Reset do texto customizado ao abrir o modal
    customPrintText = '';
    if (editPrintTextContainer) {
      editPrintTextContainer.classList.add('hidden');
    }
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
  if (btnViewPage) {
    btnViewPage.addEventListener('click', () => {
      if (currentProductForQr) {
        window.open(`${window.location.origin}/produto/${currentProductForQr.id}`, '_blank');
      }
    });
  } else {
    console.error('[ERROR] Botão Visualizar não encontrado');
  }

  if (btnPrintQr) {
    btnPrintQr.addEventListener('click', () => {
      console.debug('[DEBUG] Botão de imprimir QR acionado');
      if (!currentProductForQr) {
        showToast('Nenhum produto selecionado para impressão', 'error');
        return;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Bloqueador de popup detectado. Permita popups para imprimir.', 'error');
        return;
      }
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - Etiqueta</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background: white; }
            .qr-container { display: inline-block; padding: 20px; border: 2px solid #333; border-radius: 10px; margin: 10px; }
            .custom-text { font-size: 16px; font-weight: bold; margin-top: 15px; color: #facc15; border-top: 1px solid #ccc; padding-top: 10px; }
            @media print { body { margin: 0; } .qr-container { border: 1px solid #000; } }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div id="qrcode-print"></div>
            ${customPrintText ? `<div class="custom-text">${customPrintText}</div>` : ''}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js"></script>
          <script>
            const qrOptions = {
              width: ${qrConfig.size},
              height: ${qrConfig.size},
              data: '${window.location.origin}/produto/${currentProductForQr.id}',
              dotsOptions: { color: '${qrConfig.primaryColor}', type: 'rounded' },
              backgroundOptions: { color: 'transparent' },
              cornersSquareOptions: { color: '${qrConfig.eyeColor}', type: 'extra-rounded' },
              cornersDotOptions: { color: '${qrConfig.primaryColor}' }
            };
            const qrCode = new QRCodeStyling(qrOptions);
            qrCode.append(document.getElementById('qrcode-print'));
            window.onload = function() {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
    });
  } else {
    console.error('[ERROR] Botão Imprimir não encontrado');
  }

  if (btnDownloadQr) {
    btnDownloadQr.addEventListener('click', () => {
      if (qrCodeInstance && currentProductForQr) {
        qrCodeInstance.download({ name: `qrcode-${currentProductForQr.name.replace(/\s+/g, '_')}`, extension: 'png' });
      }
    });
  } else {
    console.error('[ERROR] Botão Download não encontrado');
  }

  if (btnCopyLink) {
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
  } else {
    console.error('[ERROR] Botão Copiar Link não encontrado');
  }

  // Botão Editar Escrita
  if (btnEditPrintText) {
    btnEditPrintText.addEventListener('click', () => {
      console.debug('[DEBUG] Botão Editar Escrita clicado!');
      if (editPrintTextContainer) {
        editPrintTextContainer.classList.toggle('hidden');
        if (!editPrintTextContainer.classList.contains('hidden')) {
          if (inputPrintText) {
            inputPrintText.value = customPrintText;
            inputPrintText.focus();
          }
          console.debug('[DEBUG] Input de escrita exibido');
        } else {
          console.debug('[DEBUG] Input de escrita ocultado');
        }
      } else {
        console.error('[ERROR] Container de edição não encontrado');
      }
    });
  } else {
    console.error('[ERROR] Botão Editar Escrita não encontrado');
  }

  // Botão Salvar Texto
  if (btnSavePrintText) {
    btnSavePrintText.addEventListener('click', () => {
      if (inputPrintText) {
        customPrintText = inputPrintText.value.trim();
        console.debug('[DEBUG] Texto salvo:', customPrintText);
        
        // Atualiza a pré-visualização
        const preview = document.getElementById('qr-info-preview');
        if (preview) {
          let customTextEl = preview.querySelector('.custom-print-text');
          if (!customTextEl) {
            customTextEl = document.createElement('p');
            customTextEl.className = 'custom-print-text';
            preview.appendChild(customTextEl);
          }
          customTextEl.textContent = customPrintText;
          customTextEl.style.color = '#facc15';
          customTextEl.style.fontWeight = 'bold';
          customTextEl.style.marginTop = '8px';
          console.debug('[DEBUG] Pré-visualização atualizada com o texto customizado');
        }
        
        if (editPrintTextContainer) {
          editPrintTextContainer.classList.add('hidden');
        }
        showToast('Texto da etiqueta salvo!', 'success');
      } else {
        console.error('[ERROR] Input de texto não encontrado');
      }
    });
  } else {
    console.error('[ERROR] Botão Salvar Texto não encontrado');
  }

  // Botão Cancelar Texto
  const btnCancelPrintText = document.getElementById('btn-cancel-print-text');
  if (btnCancelPrintText) {
    btnCancelPrintText.addEventListener('click', () => {
      if (inputPrintText) {
        inputPrintText.value = customPrintText; // Restaura o valor original
      }
      if (editPrintTextContainer) {
        editPrintTextContainer.classList.add('hidden');
      }
      showToast('Edição cancelada', 'info');
    });
  } else {
    console.error('[ERROR] Botão Cancelar Texto não encontrado');
  }

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

      // Adicionar botão de template de importação
      addTemplateButton();

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

  // --- Exportar CSV ---
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!Array.isArray(allProducts) || allProducts.length === 0) {
        alert('Nenhum produto para exportar!');
        return;
      }
      // Monta o CSV
      const headers = ['ID', 'Nome', 'Localizações', 'Total'];
      const rows = allProducts.map(prod => [
        prod.id,
        '"' + (prod.name || '').replace(/"/g, '""') + '"',
        '"' + (Array.isArray(prod.locations) ? prod.locations.map(l => `${l.name} (${l.quantity})`).join('; ') : '') + '"',
        prod.locations && Array.isArray(prod.locations) ? prod.locations.reduce((sum, l) => sum + (l.quantity || 0), 0) : 0
      ]);
      let csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'estoque.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    });
  }

  // --- Exportar XLSX ---
  const btnExportXlsx = document.getElementById('btn-export-xlsx');
  if (btnExportXlsx) {
    btnExportXlsx.addEventListener('click', () => {
      if (!Array.isArray(allProducts) || allProducts.length === 0) {
        alert('Nenhum produto para exportar!');
        return;
      }
      // Monta os dados para a planilha
      const data = allProducts.map(prod => ({
        ID: prod.id,
        Nome: prod.name || '',
        Localizacoes: Array.isArray(prod.locations) ? prod.locations.map(l => `${l.name} (${l.quantity})`).join('; ') : '',
        Total: prod.locations && Array.isArray(prod.locations) ? prod.locations.reduce((sum, l) => sum + (l.quantity || 0), 0) : 0
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
      XLSX.writeFile(wb, 'estoque.xlsx');
    });
  }

  // Função para mostrar modal informativo
  const showModalInfo = (title, message, type = 'info') => {
    console.log('[DEBUG] showModalInfo chamada:', { title, message, type });
    
    // Criar modal se não existir
    let modal = document.getElementById('info-modal');
    if (!modal) {
      console.log('[DEBUG] Criando novo modal...');
      modal = document.createElement('div');
      modal.id = 'info-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="premium-title" id="info-modal-title">${title}</h2>
            <button class="close-button" id="info-modal-close"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div style="text-align: center; padding: 20px;">
              <i class="fas fa-info-circle" style="font-size: 3rem; color: var(--color-accent); margin-bottom: 15px;"></i>
              <p style="font-size: 1.1rem; line-height: 1.6; color: var(--color-text);">${message}</p>
            </div>
          </div>
          <div class="modal-footer" style="text-align: center; padding: 15px; border-top: 1px solid var(--color-glass-border);">
            <button class="btn btn-primary" id="info-modal-ok">Entendi</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event listeners para fechar modal
      document.getElementById('info-modal-close').addEventListener('click', () => {
        console.log('[DEBUG] Fechando modal via X');
        modal.classList.add('hidden');
      });
      document.getElementById('info-modal-ok').addEventListener('click', () => {
        console.log('[DEBUG] Fechando modal via botão Entendi');
        modal.classList.add('hidden');
      });
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          console.log('[DEBUG] Fechando modal via clique fora');
          modal.classList.add('hidden');
        }
      });
    }

    // Atualizar conteúdo e mostrar
    document.getElementById('info-modal-title').textContent = title;
    modal.querySelector('.modal-body p').textContent = message;
    modal.classList.remove('hidden');
    console.log('[DEBUG] Modal mostrado!');
  };

  // --- Importar CSV ---
  const inputImportCsv = document.getElementById('input-import-csv');
  if (inputImportCsv) {
    inputImportCsv.addEventListener('change', (event) => {
      // Modal informativo - disponível na próxima atualização
      showModalInfo(
        'Importação de CSV',
        'A funcionalidade de importação de arquivos CSV estará disponível na próxima atualização do sistema.',
        'info'
      );
      
      // Limpar o input
      event.target.value = '';
    });
  }

  // --- Importar XLSX ---
  const inputImportXlsx = document.getElementById('input-import-xlsx');
  const labelImportXlsx = document.querySelector('label[for="input-import-xlsx"]');
  
  if (inputImportXlsx) {
    // Event listener no input (quando arquivo é selecionado)
    inputImportXlsx.addEventListener('change', async (event) => {
      // Modal informativo - disponível na próxima atualização
      showModalInfo(
        'Importação de Planilhas',
        'A funcionalidade de importação de planilhas Excel estará disponível na próxima atualização do sistema.',
        'info'
      );
      
      // Limpar o input
      event.target.value = '';
    });
  }

  // Event listener no label (quando o botão é clicado)
  if (labelImportXlsx) {
    labelImportXlsx.addEventListener('click', (event) => {
      console.log('[DEBUG] Botão Importar clicado!');
      
      // Modal informativo - disponível na próxima atualização
      showModalInfo(
        'Importação de Planilhas',
        'A funcionalidade de importação de planilhas Excel estará disponível na próxima atualização do sistema.',
        'info'
      );
      
      // Prevenir que o input seja acionado
      event.preventDefault();
    });
  }

  // --- Gerar Planilha de Exemplo para Importação ---
  const generateImportTemplate = () => {
    // Modal informativo - disponível na próxima atualização
    showModalInfo(
      'Template de Importação',
      'O template de importação estará disponível na próxima atualização do sistema.',
      'info'
    );
  };

  // Adicionar botão para download do template (se não existir)
  const addTemplateButton = () => {
    const actionsContainer = document.querySelector('.estoque-actions');
    if (actionsContainer && !document.getElementById('btn-template')) {
      const templateBtn = document.createElement('button');
      templateBtn.id = 'btn-template';
      templateBtn.className = 'btn btn-secondary btn-xl';
      templateBtn.style.cssText = 'display:flex;align-items:center;gap:8px;min-width:120px;';
      templateBtn.title = 'Baixar template de importação';
      templateBtn.innerHTML = '<i class="fas fa-download"></i> <span>Template</span>';
      templateBtn.addEventListener('click', generateImportTemplate);
      actionsContainer.appendChild(templateBtn);
    }
  };

  // Inicia a aplicação
  initialize();

  // Teste da função showModalInfo (remover depois)
  console.log('[DEBUG] Função showModalInfo disponível:', typeof showModalInfo);
  
  // Teste manual - descomentar para testar
  // setTimeout(() => {
  //   showModalInfo('Teste', 'Este é um teste do modal informativo!', 'info');
  // }, 2000);
});