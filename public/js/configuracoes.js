function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return `%${  (`00${  c.charCodeAt(0).toString(16)}`).slice(-2)}`;
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- Autenticação ---
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/';
    return;
  }
  const userData = parseJwt(token);
  if (!userData) {
    window.location.href = '/';
    return;
  }

  const headers = { 'Authorization': `Bearer ${token}` };
  const postHeaders = { 'Content-Type': 'application/json', ...headers };

  // --- Seletores de Elementos (Modernos) ---
  const formPerfil = document.getElementById('form-perfil');
  const formSenha = document.getElementById('form-senha');
  const sectionEmpresa = document.getElementById('section-empresa');
  const formEmpresa = document.getElementById('form-empresa');
  const sectionRegras = document.getElementById('section-regras');
  const formRegras = document.getElementById('form-regras-produto');
  const sectionLocais = document.getElementById('section-locais');
  const formLocations = document.getElementById('form-locations');
  const sectionNotificacoes = document.getElementById('section-notificacoes');
  const formNotificacoes = document.getElementById('form-notificacoes');
  const locationsList = document.getElementById('locations-list');
  const addLocationBtn = document.getElementById('add-location-btn');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarUpload = document.getElementById('avatar-upload');
  const logoPreview = document.getElementById('logo-preview');
  const logoUpload = document.getElementById('logo-upload');
  const toastContainer = document.getElementById('toast-container');
  const loaderOverlay = document.getElementById('loader-overlay');

  // --- Funções Auxiliares de UI ---
  const showLoader = (show) => loaderOverlay && loaderOverlay.classList.toggle('hidden', !show);

  const showToast = (message, type = 'success') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  };

  // --- Funções de Preenchimento de Dados ---
  const preencherFormPerfil = (user) => {
    if (!formPerfil) return;
    formPerfil.querySelector('#profile_full_name').value = user.full_name || '';
    formPerfil.querySelector('#profile_username').value = user.username || '';
    formPerfil.querySelector('#profile_email').value = user.email || '';
    if (avatarPreview) {
      avatarPreview.src = user.profile_picture_url || `https://i.pravatar.cc/100?u=${user.username}`;
    }
  };

  const preencherFormEmpresa = (empresa) => {
    console.log('[DEBUG] preencherFormEmpresa - location_definitions:', empresa.location_definitions);
    if (formEmpresa) {
      formEmpresa.querySelector('#company_nome').value = empresa.nome || '';
      formEmpresa.querySelector('#company_nome_exibicao').value = empresa.nome_exibicao || '';
    }
    if (logoPreview) {
      logoPreview.src = empresa.logo || './assets/default-logo.png'; // Fallback
    }
    if (formRegras) {
      formRegras.querySelector('#allow_duplicate_names').checked = !!empresa.allow_duplicate_names;
    }
    if (formNotificacoes) {
      formNotificacoes.querySelector('#notifications_enabled').checked = !!empresa.notifications_enabled;
      formNotificacoes.querySelector('#notification_email').value = empresa.notification_email || '';
    }
    if (locationsList) {
      locationsList.innerHTML = ''; // Limpa antes de adicionar
      if (empresa.location_definitions && Array.isArray(empresa.location_definitions)) {
        empresa.location_definitions.forEach(loc => {
          console.log('[DEBUG] Renderizando local:', loc);
          addLocationField(loc.name, loc.id);
        });
      }
    }
  };

  const addLocationField = (name = '', id = null) => {
    console.log('[DEBUG] addLocationField - name:', name, 'id:', id);
    if (!locationsList) return;
    const newField = document.createElement('div');
    newField.className = 'location-field'; // Usando classe do CSS novo
    const locationId = id || `loc_${  Date.now()  }_${  Math.floor(Math.random() * 10000)}`;
    newField.innerHTML = `
            <input type="text" value="${name}" placeholder="Nome do Local" class="neo-input" required data-location-id="${locationId}">
            <button type="button" class="btn-icon btn-remove-location" title="Remover">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
    locationsList.appendChild(newField);
    newField.querySelector('.btn-remove-location').addEventListener('click', () => newField.remove());
  };

  // --- Lógica de Carregamento da Página ---
  const carregarDadosPagina = async () => {
    showLoader(true);
    try {
      const userRes = await fetch(`/api/usuarios/${userData.id}`, { headers });

      if (!userRes.ok) throw new Error('Falha ao carregar dados do usuário. Faça login novamente.');

      const user = await userRes.json();
      preencherFormPerfil(user);

      // Apenas o 'Diretor' pode ver as seções da empresa
      if (user.role === 'diretor') {
        sectionEmpresa.classList.remove('hidden');
        sectionRegras.classList.remove('hidden');
        sectionLocais.classList.remove('hidden');
        sectionNotificacoes.classList.remove('hidden');

        const empresaRes = await fetch('/api/empresa', { headers });
        if (empresaRes.ok) {
          const empresa = await empresaRes.json();
          preencherFormEmpresa(empresa);
        } else {
          throw new Error('Não foi possível carregar os dados da empresa.');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast(error.message, 'error');
      if (error.message.includes('login')) {
        localStorage.removeItem('authToken');
        window.location.href = '/';
      }
    } finally {
      showLoader(false);
    }
  };

  // --- Lógica de Submissão de Formulários e Uploads ---
  const apiPut = async (url, body) => {
    showLoader(true);
    try {
      const res = await fetch(url, { method: 'PUT', headers: postHeaders, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ocorreu um erro.');
      showToast(data.message || 'Salvo com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(`Erro ao fazer PUT em ${url}:`, err);
    } finally {
      showLoader(false);
    }
  };

  if (formPerfil) formPerfil.addEventListener('submit', (e) => {
    e.preventDefault();
    apiPut(`/api/usuarios/${userData.id}`, {
      full_name: formPerfil.querySelector('#profile_full_name').value,
      username: formPerfil.querySelector('#profile_username').value,
      email: formPerfil.querySelector('#profile_email').value,
    });
  });

  if (formSenha) formSenha.addEventListener('submit', (e) => {
    e.preventDefault();
    const novaSenha = formSenha.querySelector('#password_new').value;
    if (novaSenha !== formSenha.querySelector('#password_confirm').value) {
      return showToast('As senhas não coincidem.', 'error');
    }
    if (novaSenha.length < 6) {
      return showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
    }
    apiPut(`/api/usuarios/${userData.id}/password`, { password: novaSenha });
    formSenha.reset();
  });

  if (formEmpresa) formEmpresa.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = {
      nome: formEmpresa.querySelector('#company_nome').value,
      nome_exibicao: formEmpresa.querySelector('#company_nome_exibicao').value,
    };
    apiPut('/api/empresa', dados);
  });

  if (formRegras) formRegras.addEventListener('submit', (e) => {
    e.preventDefault();
    apiPut('/api/empresa', {
      allow_duplicate_names: formRegras.querySelector('#allow_duplicate_names').checked,
    });
  });

  if (formNotificacoes) formNotificacoes.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = formNotificacoes.querySelector('#notification_email').value;
    const enabled = formNotificacoes.querySelector('#notifications_enabled').checked;

    // Validação simples de e-mail
    if(enabled && !/^\S+@\S+\.\S+$/.test(email)) {
      return showToast('Por favor, insira um e-mail válido.', 'error');
    }

    apiPut('/api/empresa', {
      notifications_enabled: enabled,
      notification_email: email,
    });
  });

  if (formLocations) formLocations.addEventListener('submit', (e) => {
    e.preventDefault();
    const locationInputs = locationsList.querySelectorAll('input[type="text"]');
    console.log('[DEBUG] Todos os inputs de local:', Array.from(locationInputs).map(i => ({value: i.value, id: i.dataset.locationId})));
    const location_definitions = Array.from(locationInputs)
      .map(input => {
        let id = input.dataset.locationId;
        if (!id) {
          id = `loc_${  Date.now()  }_${  Math.floor(Math.random() * 10000)}`;
          input.dataset.locationId = id;
        }
        return { id, name: input.value.trim() };
      })
      .filter(loc => loc.name);
    console.log('[DEBUG] Salvando location_definitions:', location_definitions);
    apiPut('/api/empresa', { location_definitions });
  });

  if (addLocationBtn) addLocationBtn.addEventListener('click', () => addLocationField('', null));

  const handleFileUpload = async (file, endpoint, previewElement) => {
    if (!file) return;
    previewElement.src = URL.createObjectURL(file); // Preview otimista
    const formData = new FormData();
    formData.append(endpoint.includes('avatar') ? 'avatar' : 'logo', file);

    showLoader(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': headers.Authorization },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha no upload.');

      showToast(data.message, 'success');
      previewElement.src = data.url; // URL final
      if (endpoint.includes('avatar')) {
        const headerAvatar = document.getElementById('user-avatar'); // Atualiza header
        if(headerAvatar) headerAvatar.src = data.url;
      }

    } catch (err) {
      showToast(err.message, 'error');
      console.error(`Erro no upload para ${endpoint}:`, err);
    } finally {
      showLoader(false);
    }
  };

  if (avatarUpload) avatarUpload.addEventListener('change', (e) => handleFileUpload(e.target.files[0], '/api/user/avatar', avatarPreview));
  if (logoUpload) logoUpload.addEventListener('change', (e) => handleFileUpload(e.target.files[0], '/api/empresa/logo', logoPreview));

  // --- Iniciação ---
  carregarDadosPagina();
});